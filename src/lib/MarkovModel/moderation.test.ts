import { describe, expect, test } from 'bun:test';
import { moderateParsedModel } from './moderation';

describe('moderation', () => {
  test('redacts provided offensive tokens (non-offensive placeholders)', () => {
    const parsed = {
      '': { 'sexTOKEN': 1, 'normal': 1, 'scatTOKEN': 1, 'hateTOKEN': 1 },
      'sexTOKEN': { '。': 1 },
      'scatTOKEN': { '。': 1 },
      'hateTOKEN': { '。': 1 },
    } as any;

    const patterns = {
      sexual_explicit: ['sexTOKEN'],
      scat: ['scatTOKEN'],
      hate: ['hateTOKEN'],
    };

    const { model, report } = moderateParsedModel(parsed, [], { mode: 'redact', patterns });

    expect(report.sexual_explicit!.count).toBeGreaterThanOrEqual(1);
    expect(report.scat!.count).toBeGreaterThanOrEqual(1);
    expect(report.hate!.count).toBeGreaterThanOrEqual(1);

    const keys = Object.keys(model);
    expect(keys.some(k => k.startsWith('__REDACTED_SEXUAL_EXPLICIT__'))).toBe(true);
    expect(keys.some(k => k.startsWith('__REDACTED_SCAT__'))).toBe(true);
    expect(keys.some(k => k.startsWith('__REDACTED_HATE__'))).toBe(true);
  });

  test('accepts external patterns', () => {
    const parsed = {
      '': { 'hoge': 1, 'normal': 1 },
      'hoge': { '。': 1 },
    } as any;

    const customPatterns = { bad: ['hoge'] };
    const { model, report } = moderateParsedModel(parsed, [], { mode: 'redact', patterns: customPatterns });

    expect(report.bad).toBeDefined();
    expect(report.bad!.count).toBe(1);
    const keys = Object.keys(model);
    expect(keys.some(k => k.startsWith('__REDACTED_BAD__'))).toBe(true);
  });
});
