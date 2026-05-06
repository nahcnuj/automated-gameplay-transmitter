type Props = PropsWithChildren<{
  bgColor?: `bg-${string}`;
  /** Border color Tailwind class (e.g. `"border-white"`, `"border-emerald-300"`) */
  borderColor?: `border-${string}`;
  /** Border style Tailwind class (e.g. `"border-solid"`, `"border-dashed"`, `"border-double"`) */
  borderStyle?: `border-${string}`;
  /** Border width Tailwind class (e.g. `"border"`, `"border-2"`, `"border-4"`) */
  borderWidth?: "border" | `border-${string}`;
  /** Border radius Tailwind class (e.g. `"rounded"`, `"rounded-xl"`, `"rounded-full"`) */
  rounded?: "rounded" | `rounded-${string}`;
}>;

/**
 * A container box with configurable background and border styles.
 *
 * @param bgColor - Background color Tailwind class. Default: `"bg-black"`
 * @param borderColor - Border color Tailwind class. Default: `"border-white"`
 * @param borderStyle - Border style Tailwind class. Default: `"border-solid"`
 * @param borderWidth - Border width Tailwind class. Default: `"border"` (1px)
 * @param rounded - Border radius Tailwind class. Default: none
 */
export function Box({
  bgColor = "bg-black",
  borderColor = "border-white",
  borderStyle = "border-solid",
  borderWidth = "border",
  rounded,
  children,
}: Props): JSX.Element {
  const classes = ["w-full", "h-full", bgColor, borderColor, borderStyle, borderWidth];
  if (rounded) classes.push(rounded);
  return (
    <div className={classes.join(" ")}>
      {children}
    </div>
  );
};