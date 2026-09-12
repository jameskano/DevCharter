#!/usr/bin/env node

import { runCli } from "./index.js";

process.exitCode = await runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value)
});
