type Props = PropsWithChildren;

export function Container({ children }: Props): JSX.Element {
  return (
    <div className="h-full p-1 overflow-hidden">
      {children}
    </div>
  );
};