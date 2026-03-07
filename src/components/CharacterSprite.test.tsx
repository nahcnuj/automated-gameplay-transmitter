import { expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { CharacterSprite } from "./CharacterSprite";

test("CharacterSprite renders an img tag", () => {
  const html = renderToString(<CharacterSprite src="/foo.png" className="xyz" />);
  expect(html).toContain("<img");
  expect(html).toContain("/foo.png");
});

