import { describe, expect, test } from "bun:test";
import { MarkovModel as BrowserMarkovModel } from "./index";
import { MarkovModel as ServerMarkovModel } from "./index.node";

describe("root exports", () => {
  test("exports MarkovModel namespace from index.ts", () => {
    expect(typeof BrowserMarkovModel.create).toBe("function");
  });

  test("exports MarkovModel namespace from index.node.ts", () => {
    expect(typeof ServerMarkovModel.create).toBe("function");
  });
});
