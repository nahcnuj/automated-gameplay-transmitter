import type { ReactNode } from "react";

type LayoutProps<S, B> = {
  count: keyof typeof gridTemplateClass,
  span: keyof typeof screenClass,
  className: string,
  children: readonly [S, B],
};

const gridTemplateClass = {
  1: 'grid-cols-1 grid-rows-1',
  2: 'grid-cols-2 grid-rows-2',
  4: 'grid-cols-4 grid-rows-4',
  8: 'grid-cols-8 grid-rows-8',
  10: 'grid-cols-10 grid-rows-10',
  16: 'grid-cols-16 grid-rows-16',
};

const screenClass: Record<keyof typeof gridTemplateClass, string> = {
  1: 'col-span-1 row-span-1',
  2: 'col-span-2 row-span-2',
  4: 'col-span-4 row-span-4',
  8: 'col-span-8 row-span-8',
  10: 'col-span-10 row-span-10',
  16: 'col-span-16 row-span-16',
};

const sideClass: Record<string, string> = {
  '10_8': 'col-span-2 row-span-8',
};

const bottomClass: Record<string, string> = {
  '10_8': 'col-span-10 row-span-2',
};

export const Layout = <SideComponent extends ReactNode, BottomComponent extends ReactNode>({ count, span, className, children: [sideComponent, bottomComponent] }: LayoutProps<SideComponent, BottomComponent>) => {
  const count_span = `${count}_${span}`;

  // TODO type restriction
  if (!Object.hasOwn(sideClass, count_span)) throw new Error(`No side-panel class found for the pair of count:${count} and span:${span}.`);
  if (!Object.hasOwn(bottomClass, count_span)) throw new Error(`No bottom-panel class found for the pair of count:${count} and span:${span}.`);

  return (
    <div className={`w-screen h-screen content-center`}>
      <div className={`grid ${gridTemplateClass[count]} max-w-full max-h-full aspect-video`}>
        <div className={screenClass[span]} />
        <div className={sideClass[count_span]}>
          <div className={`w-full h-full ${className}`}>
            {sideComponent}
          </div>
        </div>
        <div className={bottomClass[count_span]}>
          <div className={`w-full h-full ${className}`}>
            {bottomComponent}
          </div>
        </div>
      </div>
    </div>
  );
};