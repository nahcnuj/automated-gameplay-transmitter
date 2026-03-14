import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { Box } from "./Box";

afterEach(cleanup);

function getBoxElement(container: HTMLElement): HTMLElement {
  return container.firstChild as HTMLElement;
}

test("Box renders children", () => {
  const { container } = render(<Box>content</Box>);
  expect(container.textContent).toContain("content");
});

test("Box uses default bg-black class", () => {
  const { container } = render(<Box>content</Box>);
  expect(getBoxElement(container).classList.contains("bg-black")).toBe(true);
});

test("Box uses default border-white class", () => {
  const { container } = render(<Box>content</Box>);
  expect(getBoxElement(container).classList.contains("border-white")).toBe(true);
});

test("Box uses default border-solid class", () => {
  const { container } = render(<Box>content</Box>);
  expect(getBoxElement(container).classList.contains("border-solid")).toBe(true);
});

test("Box uses default border class for thin width", () => {
  const { container } = render(<Box>content</Box>);
  expect(getBoxElement(container).classList.contains("border")).toBe(true);
});

test("Box has no rounded class by default", () => {
  const { container } = render(<Box>content</Box>);
  const classList = Array.from(getBoxElement(container).classList);
  expect(classList.every(c => !c.startsWith("rounded"))).toBe(true);
});

test("Box applies custom bgColor", () => {
  const { container } = render(<Box bgColor="bg-red-500">content</Box>);
  const el = getBoxElement(container);
  expect(el.classList.contains("bg-red-500")).toBe(true);
  expect(el.classList.contains("bg-black")).toBe(false);
});

test("Box applies custom borderColor", () => {
  const { container } = render(<Box borderColor="border-emerald-300">content</Box>);
  const el = getBoxElement(container);
  expect(el.classList.contains("border-emerald-300")).toBe(true);
  expect(el.classList.contains("border-white")).toBe(false);
});

test("Box applies custom borderStyle", () => {
  const { container } = render(<Box borderStyle="border-double">content</Box>);
  const el = getBoxElement(container);
  expect(el.classList.contains("border-double")).toBe(true);
  expect(el.classList.contains("border-solid")).toBe(false);
});

test("Box applies custom borderWidth", () => {
  const { container } = render(<Box borderWidth="border-4">content</Box>);
  const el = getBoxElement(container);
  expect(el.classList.contains("border-4")).toBe(true);
  expect(el.classList.contains("border")).toBe(false);
});

test("Box applies rounded class when provided", () => {
  const { container } = render(<Box rounded="rounded-xl">content</Box>);
  expect(getBoxElement(container).classList.contains("rounded-xl")).toBe(true);
});
