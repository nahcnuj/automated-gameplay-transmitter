export interface Browser {
  open(url: string): Promise<void>
  close(): Promise<void>

  clickByText(text: string): Promise<void>

  press(key: string, selector: string): Promise<void>

  fillByRole(value: string, role: string, selector: string): Promise<void>

  evaluate<T>(f: () => Promise<T>): Promise<T | undefined>

  get url(): string
};
