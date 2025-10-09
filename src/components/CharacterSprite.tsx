import type { ImgHTMLAttributes } from "react"

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string,
};

export function CharacterSprite({ src, className, ...props }: Props) {
  return <img src={src} width="720" height="960" className={`h-full object-cover object-top ${className}`} {...props} />;
};