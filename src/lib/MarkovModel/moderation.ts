import crypto from 'crypto';

export type ModerateOptions = {
  mode?: 'redact' | 'remove';
  maxExamples?: number;
  // patterns may be provided as arrays of strings or RegExp objects.
  patterns?: Record<string, Array<string | RegExp>>;
};

export type ModerateReport = Record<string, { count: number; examples: string[] }>;

export type UndoOccurrence =
  | { type: 'top' }
  | { type: 'nested'; parentOriginal: string; parentMasked: string; count: number };

export type UndoEntry = {
  original: string;
  occurrences: UndoOccurrence[];
  topLevelEntry?: Record<string, number>;
};

export type ModerateMapping = Record<string, UndoEntry>;

/**
 * Moderate a parsed model (the `model` object from parsed JSON).
 * Returns the moderated model and a summary report.
 */
export function moderateParsedModel(
  parsed: Record<string, Record<string, number>>,
  _corpus: unknown,
  opts: ModerateOptions = {}
): { model: Record<string, Record<string, number>>; report: ModerateReport; mapping: ModerateMapping } {
  const { mode = 'redact', maxExamples = 20 } = opts;

  // Helper to escape literal strings for safe insertion into a RegExp.
  function escapeForRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Use only external patterns provided via `opts.patterns`. Patterns must
  // be a record mapping category -> array of string or RegExp. If no
  // patterns are provided, no tokens will be detected.
  const merged: Record<string, Array<string | RegExp>> = {};
  if (opts.patterns) {
    for (const [k, v] of Object.entries(opts.patterns)) {
      merged[k] = Array.isArray(v) ? v : [v as any];
    }
  }

  // Convert merged pattern lists into a RegExp per category.
  const categories: Record<string, RegExp> = {};
  for (const [name, arr] of Object.entries(merged)) {
    const parts: string[] = arr.map((p) => (p instanceof RegExp ? p.source : escapeForRegex(String(p))));
    categories[name] = new RegExp(parts.join('|'), 'iu');
  }

  function detectCategory(token: string | undefined): string | null {
    if (!token) return null;
    for (const [k, rx] of Object.entries(categories)) if (rx.test(token)) return k;
    return null;
  }

  function maskToken(s: string) {
    const h = crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
    const cat = detectCategory(s) ?? 'UNKNOWN';
    return `__REDACTED_${cat.toUpperCase()}__${h}`;
  }

  // Collect tokens and locations (top-level vs nested) so we can produce
  // a report that includes original expressions and a mapping to the
  // redacted placeholders. This mapping will allow undoing moderation.
  const occurrencesByToken: Record<
    string,
    Array<{ type: 'top' | 'nested'; parent?: string; count?: number }>
  > = {};

  for (const outer of Object.keys(parsed)) {
    // register top-level occurrence
    occurrencesByToken[outer] = occurrencesByToken[outer] || [];
    occurrencesByToken[outer].push({ type: 'top' });

    const nested = parsed[outer];
    if (nested && typeof nested === 'object') {
      for (const nk of Object.keys(nested)) {
        occurrencesByToken[nk] = occurrencesByToken[nk] || [];
        occurrencesByToken[nk].push({ type: 'nested', parent: outer, count: nested[nk] as number });
      }
    }
  }

  const reportSummary: ModerateReport = {};
  const mapping: ModerateMapping = {};

  for (const [t, occs] of Object.entries(occurrencesByToken)) {
    const cat = detectCategory(t);
    if (!cat) continue;

    reportSummary[cat] = reportSummary[cat] || { count: 0, examples: [] };
    reportSummary[cat].count += 1;
    if (reportSummary[cat].examples.length < maxExamples) reportSummary[cat].examples.push(t);

    const masked = maskToken(t);
    const entry: UndoEntry = { original: t, occurrences: [] };

    for (const o of occs) {
      if (o.type === 'top') {
        // deep-clone the original top-level object so the mapping contains
        // the full data necessary to restore a removed top-level key.
        const originalObj = parsed[t] ? JSON.parse(JSON.stringify(parsed[t])) : undefined;
        if (originalObj) entry.topLevelEntry = originalObj;
        entry.occurrences.push({ type: 'top' });
      } else {
        const parent = o.parent!;
        const parentMasked = detectCategory(parent) ? maskToken(parent) : parent;
        entry.occurrences.push({ type: 'nested', parentOriginal: parent, parentMasked, count: o.count ?? 0 });
      }
    }

    mapping[masked] = entry;
  }

  // Build new model
  const newModel: Record<string, Record<string, number>> = {};
  for (const oldKey of Object.keys(parsed)) {
    const newKey = detectCategory(oldKey) ? (mode === 'redact' ? maskToken(oldKey) : null) : oldKey;
    const nested = parsed[oldKey];
    if (!nested || typeof nested !== 'object') continue;
    if (newKey === null) {
      // removed top-level key; skip entirely
      continue;
    }
    const newNested: Record<string, number> = newModel[newKey] || {};
    for (const [nk, cnt] of Object.entries(nested)) {
      const newNk = detectCategory(nk) ? (mode === 'redact' ? maskToken(nk) : null) : nk;
      if (newNk === null) continue;
      newNested[newNk] = (newNested[newNk] || 0) + cnt;
    }
    newModel[newKey] = newNested;
  }

  return { model: newModel, report: reportSummary, mapping };
}

/**
 * Restore a moderated model using the mapping produced at moderation time.
 * Returns a restored model object (same shape as the original parsed model).
 */
export function undoModeratedModel(
  moderated: Record<string, Record<string, number>>,
  mapping: ModerateMapping
): Record<string, Record<string, number>> {
  // Start from a shallow copy of moderated model
  const restored: Record<string, Record<string, number>> = {};
  for (const [k, v] of Object.entries(moderated)) restored[k] = { ...v };

  // First, restore top-level entries so nested restoration can find parents
  for (const [masked, entry] of Object.entries(mapping)) {
    if (entry.topLevelEntry) {
      // If masked key exists, remove it and set original key to original data
      if (masked in restored) delete restored[masked];
      restored[entry.original] = { ...(entry.topLevelEntry || {}) };
    }
  }

  // Then restore nested occurrences
  for (const [masked, entry] of Object.entries(mapping)) {
    for (const occ of entry.occurrences) {
      if (occ.type === 'nested') {
        // locate the parent key in restored model: prefer parentOriginal if
        // present (it may have been restored above), otherwise try parentMasked
        const parentKey = (occ.parentOriginal && occ.parentOriginal in restored)
          ? occ.parentOriginal
          : (occ.parentMasked in restored ? occ.parentMasked : undefined as any);

        if (!parentKey) {
          // Parent does not exist; create it and attach nested key
          restored[occ.parentOriginal] = { [entry.original]: occ.count };
        } else {
          // ensure parent object exists
          restored[parentKey] = restored[parentKey] || {};
          // set original nested key to recorded count
          restored[parentKey][entry.original] = occ.count;
          // remove masked nested key if present
          if (masked in restored[parentKey]) delete restored[parentKey][masked];
        }
      }
    }
  }

  return restored;
}
