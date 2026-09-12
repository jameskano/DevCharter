import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("writer import boundary", () => {
  it("keeps root, rendering, adapter, and non-apply CLI sources outside the writer graph", async () => {
    const root = await readFile(new URL("./index.ts", import.meta.url), "utf8");
    const rendering = await readFile(new URL("./rendering.ts", import.meta.url), "utf8");
    const application = await readFile(new URL("./application.ts", import.meta.url), "utf8");
    const cli = await readFile(new URL("../../cli/src/index.ts", import.meta.url), "utf8");
    const adapter = await readFile(
      new URL("../../adapter-codex/src/index.ts", import.meta.url),
      "utf8"
    );
    expect(root).not.toMatch(/writer|application/);
    expect(rendering).not.toMatch(/\.\/writer|\.\/application/);
    expect(adapter).not.toMatch(/core\/writer|core\/application/);
    expect(cli).not.toContain("@devcharter/core/application");
    expect(cli).toContain('import("./apply-command.js")');
    expect(application).toContain('from "./writer.js"');
  });
});
