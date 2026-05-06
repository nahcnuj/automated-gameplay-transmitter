// Global JSX namespace declaration for ambient type resolution.
// The actual JSX types come from the consumer's jsxImportSource configuration
// (e.g. "react" or "hono/jsx"), so this library remains JSX-runtime-agnostic.
declare namespace JSX {
  type Element = React.JSX.Element;
  type IntrinsicElements = React.JSX.IntrinsicElements;
}

/** Adds an optional `children` prop to `T`. Mirrors React's `PropsWithChildren<T>`. */
type PropsWithChildren<T = {}> = T & {
  children?: JSX.Element | JSX.Element[] | string | number | boolean | null;
};
