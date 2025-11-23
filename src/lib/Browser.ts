export interface Browser {
  open(url: string): Promise<void>
  close(): Promise<void>

  clickByText(text: string): Promise<void>

  press(key: string, selector: string): Promise<void>

  fillByRole(value: string, role: string, selector: string): Promise<void>

  get url(): string
  get document(): Document
};
