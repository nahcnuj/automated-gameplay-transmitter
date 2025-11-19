import type { PropsWithChildren } from "react";

type Props = {};

export function Box({ children }: PropsWithChildren<Props>) {
  return (
    <div className="w-full h-full bg-black/50 border-5 border-double border-emerald-300 rounded-xl">
      {children}
    </div>
  );
};