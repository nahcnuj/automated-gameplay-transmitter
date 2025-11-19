import type { PropsWithChildren } from "react";

export function Container({ children }: PropsWithChildren) {
  return (
    <div className="h-full p-1 overflow-hidden">
      {children}
    </div>
  );
};