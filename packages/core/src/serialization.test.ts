import { describe, expect, it } from "vitest";

import {
  canonicalizePathSet,
  normalizeGeneratedText,
  stableHash,
  stableJson
} from "./serialization.js";

describe("stable serialization", () => {
  it("sorts object keys while preserving semantic array order", () => {
    expect(stableJson({ z: ["second", "first"], a: { d: 2, c: 1 } })).toBe(
      '{\n  "a": {\n    "c": 1,\n    "d": 2\n  },\n  "z": [\n    "second",\n    "first"\n  ]\n}\n'
    );
  });

  it("normalizes generated line endings and trailing newlines", () => {
    expect(normalizeGeneratedText("one\r\ntwo\r\n\r\n")).toBe("one\ntwo\n");
  });

  it("hashes semantically identical object-key order identically", () => {
    expect(stableHash({ b: 2, a: 1 })).toBe(stableHash({ a: 1, b: 2 }));
    expect(stableHash({ items: [1, 2] })).not.toBe(stableHash({ items: [2, 1] }));
  });

  it("canonicalizes only explicitly set-like path collections", () => {
    expect(canonicalizePathSet(["b/file", "a/file", "b/file"])).toEqual(["a/file", "b/file"]);
  });
});
