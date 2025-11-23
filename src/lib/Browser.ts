import type { Locator, Page } from "playwright"

export interface Browser {
  open(url: string): Promise<void>
  close(): Promise<void>

  clickByText(text: string): Promise<void>

  press(key: string, selector: string): Promise<void>

  fillByRole(value: string, role: Parameters<Locator['getByRole']>[0], selector: string): Promise<void>

  get url(): string
  get document(): Document
};
