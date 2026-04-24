import { expect, test } from "bun:test";
import plugin from "../src/plugin";

test("default export is a Plugin factory function", () => {
  expect(typeof plugin).toBe("function");
});
