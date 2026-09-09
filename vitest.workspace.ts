import { defineProject, defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/*",
  defineProject({
    test: {
      name: "release",
      include: ["tests/release/**/*.test.ts"],
      testTimeout: 30_000,
      hookTimeout: 30_000
    }
  })
]);
