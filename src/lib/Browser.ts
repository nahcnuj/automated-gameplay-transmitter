export interface Browser {
  open(url: string): Promise<void>
  close(): Promise<void>
};
