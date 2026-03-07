import { jest, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { HighlightOnChange } from "./HighlightOnChange";

jest.useFakeTimers();

test("HighlightOnChange renders children", () => {
  const html = renderToString(<HighlightOnChange timeout={100}>hi</HighlightOnChange>);
  expect(html).toContain("hi");
});

