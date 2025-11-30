export type { Action } from "./Action";
export type { ActionResult } from "./ActionResult";
export type { State } from "./State";

export interface Browser {
  open(url: string): Promise<void>
  close(): Promise<void>

  clickByText(text: string): Promise<void>
  clickByElementId(id: string): Promise<void>

  press(key: string, selector: string): Promise<void>

  fillByRole(value: string, role: string, selector: string): Promise<void>

  evaluate<T>(f: () => T): Promise<T | undefined>

  get url(): string
};
