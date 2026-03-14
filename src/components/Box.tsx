import type { PropsWithChildren } from "react";

type Props = {
  bgColor?: string;
  borderColor?: string;
  borderStyle?: string;
  borderWidth?: string;
};

export function Box({
  bgColor = "bg-black",
  borderColor = "border-white",
  borderStyle = "border-solid",
  borderWidth = "border",
  children,
}: PropsWithChildren<Props>) {
  return (
    <div className={`w-full h-full rounded-xl ${bgColor} ${borderColor} ${borderStyle} ${borderWidth}`}>
      {children}
    </div>
  );
};