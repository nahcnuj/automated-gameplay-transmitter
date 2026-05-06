import { useEffect, useState } from "react";

type Props = ChildrenProps & {
  /** timeout in millisecond */
  timeout: number

  /** className on changed */
  classNameOnChanged?: string
};

export function HighlightOnChange({ children, timeout, classNameOnChanged }: Props): JSX.Element {
  const [isHighlighting, setIsHighlighting] = useState(false);

  useEffect(() => {
    setIsHighlighting(true);

    const id = setTimeout(() => {
      setIsHighlighting(false);
    }, timeout);

    return () => {
      clearTimeout(id);
    };
  }, [children]);

  return <div className={`${isHighlighting ? classNameOnChanged : ''}`}>
    {children}
  </div>;
}