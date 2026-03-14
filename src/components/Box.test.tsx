import { expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { Box } from "./Box";

test("Box renders children", () => {
  const html = renderToString(<Box>content</Box>);
  expect(html).toContain("content");
});

test("Box uses default bg-black class", () => {
  const html = renderToString(<Box>content</Box>);
  expect(html).toContain("bg-black");
});

test("Box uses default border-white class", () => {
  const html = renderToString(<Box>content</Box>);
  expect(html).toContain("border-white");
});

test("Box uses default border-solid class", () => {
  const html = renderToString(<Box>content</Box>);
  expect(html).toContain("border-solid");
});

test("Box uses default border class for thin width", () => {
  const html = renderToString(<Box>content</Box>);
  expect(html).toMatch(/ border[ "]/);
});

test("Box applies custom bgColor", () => {
  const html = renderToString(<Box bgColor="bg-red-500">content</Box>);
  expect(html).toContain("bg-red-500");
});

test("Box applies custom borderColor", () => {
  const html = renderToString(<Box borderColor="border-emerald-300">content</Box>);
  expect(html).toContain("border-emerald-300");
});

test("Box applies custom borderStyle", () => {
  const html = renderToString(<Box borderStyle="border-double">content</Box>);
  expect(html).toContain("border-double");
});

test("Box applies custom borderWidth", () => {
  const html = renderToString(<Box borderWidth="border-4">content</Box>);
  expect(html).toContain("border-4");
});
