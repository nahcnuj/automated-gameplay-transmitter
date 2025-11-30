import type { Action } from "./Action";
import type { State } from "./State";

export const ActionResult = {
  ok: (action: Action): State => ({
    name: 'result',
    succeeded: true,
    action,
  }),
  error: (action: Action): State => ({
    name: 'result',
    succeeded: false,
    action,
  }),
} as const;
