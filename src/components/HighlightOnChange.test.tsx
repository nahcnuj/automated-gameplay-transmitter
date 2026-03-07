import { afterEach, jest, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { act, cleanup, render } from "@testing-library/react";
import { HighlightOnChange } from "./HighlightOnChange";

afterEach(() => {
  jest.useRealTimers();
  cleanup();
});

test("HighlightOnChange renders children", () => {
  const html = renderToString(<HighlightOnChange timeout={100}>hi</HighlightOnChange>);
  expect(html).toContain("hi");
});

test("HighlightOnChange applies classNameOnChanged immediately and removes it after timeout", async () => {
  jest.useFakeTimers();

  const { container } = render(
    <HighlightOnChange timeout={100} classNameOnChanged="highlight">hi</HighlightOnChange>
  );

  expect((container.firstChild as HTMLElement).className).toContain("highlight");

  await act(async () => {
    jest.advanceTimersByTime(100);
  });
  expect((container.firstChild as HTMLElement).className).not.toContain("highlight");
});
