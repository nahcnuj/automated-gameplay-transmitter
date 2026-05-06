type Props = JSX.IntrinsicElements["img"] & {
  src: string,
};

export function CharacterSprite({ src, className, ...props }: Props): JSX.Element {
  return <img src={src} width="720" height="960" className={`h-full object-cover object-top ${className}`} {...props} />;
};