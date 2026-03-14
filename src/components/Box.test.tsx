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
  expect(getBoxElement(container).classList).toContain("bg-black");
});

test("Box uses default border-white class", () => {
  const { container } = render(<Box>content</Box>);
  expect(getBoxElement(container).classList).toContain("border-white");
});

test("Box uses default border-solid class", () => {
  const { container } = render(<Box>content</Box>);
  expect(getBoxElement(container).classList).toContain("border-solid");
});

test("Box uses default border class for thin width", () => {
  const { container } = render(<Box>content</Box>);
  expect(getBoxElement(container).classList).toContain("border");
});

test("Box has no rounded class by default", () => {
  const { container } = render(<Box>content</Box>);
  expect(Array.from(getBoxElement(container).classList).filter(c => c.startsWith("rounded"))).toBeEmpty();
});

test("Box applies custom bgColor", () => {
  const { container } = render(<Box bgColor="bg-red-500">content</Box>);
  const el = getBoxElement(container);
  expect(el.classList).toContain("bg-red-500");
  expect(el.classList).not.toContain("bg-black");
});

test("Box applies custom borderColor", () => {
  const { container } = render(<Box borderColor="border-emerald-300">content</Box>);
  const el = getBoxElement(container);
  expect(el.classList).toContain("border-emerald-300");
  expect(el.classList).not.toContain("border-white");
});

test("Box applies custom borderStyle", () => {
  const { container } = render(<Box borderStyle="border-double">content</Box>);
  const el = getBoxElement(container);
  expect(el.classList).toContain("border-double");
  expect(el.classList).not.toContain("border-solid");
});

test("Box applies custom borderWidth", () => {
  const { container } = render(<Box borderWidth="border-4">content</Box>);
  const el = getBoxElement(container);
  expect(el.classList).toContain("border-4");
  expect(el.classList).not.toContain("border");
});

test("Box applies rounded class when provided", () => {
  const { container } = render(<Box rounded="rounded-xl">content</Box>);
  expect(getBoxElement(container).classList).toContain("rounded-xl");
});
