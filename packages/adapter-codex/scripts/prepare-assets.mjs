import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const target = fileURLToPath(new URL("../dist/assets/skills/", import.meta.url));

for (const name of ["project-architect", "specification-architect"]) {
  await mkdir(`${target}${name}`, { recursive: true });
  await copyFile(`${repositoryRoot}.agents/skills/${name}/SKILL.md`, `${target}${name}/SKILL.md`);
}
