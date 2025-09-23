import { useEffect, useState, type PropsWithChildren } from "react";

type Props = {
  /** timeout in millisecond */
  timeout: number

  /** className on changed */
  classNameOnChanged?: string
};

export function HighlightOnChange({ children, timeout, classNameOnChanged }: PropsWithChildren<Props>) {
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