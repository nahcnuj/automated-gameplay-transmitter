import type { PropsWithChildren } from "react";

type Props = {
  /** Background color Tailwind class (e.g. `"bg-black"`, `"bg-slate-900/80"`). Default: `"bg-black"` */
  bgColor?: `bg-${string}`;
  /** Border color Tailwind class (e.g. `"border-white"`, `"border-emerald-300"`). Default: `"border-white"` */
  borderColor?: `border-${string}`;
  /** Border style Tailwind class (e.g. `"border-solid"`, `"border-dashed"`, `"border-double"`). Default: `"border-solid"` */
  borderStyle?: `border-${string}`;
  /** Border width Tailwind class (e.g. `"border"`, `"border-2"`, `"border-4"`). Default: `"border"` */
  borderWidth?: "border" | `border-${string}`;
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