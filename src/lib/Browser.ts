export interface Browser {
  open(url: string): Promise<void>
  close(): Promise<void>

  clickByText(text: string): Promise<void>

  get url(): string
};
