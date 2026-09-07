import { readFile } from "node:fs/promises";

import { failure, success, DevCharterError, type Result } from "@devcharter/core";
import type { EcosystemAdapter } from "@devcharter/core/rendering";
import {
  applyEdits,
  findNodeAtLocation,
  modify,
  parseTree,
  type Node,
  type ParseError
} from "jsonc-parser";

const ASSET_NAMES = new Set(["project-architect", "specification-architect"]);

export async function loadPackagedSkill(name: string): Promise<Result<string>> {
  if (!ASSET_NAMES.has(name))
    return failure(new DevCharterError("INVALID_ARGUMENT", "Unknown built-in Codex skill"));
  try {
    return success(
      await readFile(new URL(`../dist/assets/skills/${name}/SKILL.md`, import.meta.url), "utf8")
    );
  } catch (cause) {
    return failure(
      new DevCharterError("READ_FAILED", "Packaged Codex skill asset is unavailable", { cause })
    );
  }
}

function headingMerge(existing: string, addition: string): string {
  const body = addition.replace(/^#\s+[^\n]+\n+/, "").trim();
  if (body === "" || existing.includes(body)) return existing;
  const separator = /\r?\n$/.test(existing) ? "\n" : "\n\n";
  return existing + separator + body + "\n";
}

function duplicateProperty(node: Node): string | undefined {
  if (node.type !== "object") return undefined;
  const seen = new Set<string>();
  for (const property of node.children ?? []) {
    const key = property.children?.[0]?.value;
    if (typeof key !== "string") continue;
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return undefined;
}

function packageScripts(
  proposal: Parameters<EcosystemAdapter["renderChange"]>[0]["proposal"]
): Record<string, string> | undefined {
  const value = proposal.acceptedDecisions.find(
    (decision) => decision.id === "project.packageScripts"
  )?.value;
  if (value === null || Array.isArray(value) || typeof value !== "object") return undefined;
  return Object.fromEntries(Object.entries(value).map(([name, body]) => [name, String(body)]));
}

function renderPackageJson(
  scripts: Record<string, string>,
  existingContent?: string
): Result<string> {
  const sortedNames = Object.keys(scripts).sort((left, right) => left.localeCompare(right));
  if (existingContent === undefined) {
    return success(
      JSON.stringify(
        { scripts: Object.fromEntries(sortedNames.map((name) => [name, scripts[name]])) },
        null,
        2
      ) + "\n"
    );
  }
  const errors: ParseError[] = [];
  const root = parseTree(existingContent.replace(/^\ufeff/, ""), errors, {
    allowTrailingComma: false,
    disallowComments: true
  });
  const scriptsNode = root === undefined ? undefined : findNodeAtLocation(root, ["scripts"]);
  if (
    errors.length > 0 ||
    root?.type !== "object" ||
    duplicateProperty(root) !== undefined ||
    (scriptsNode !== undefined &&
      (scriptsNode.type !== "object" || duplicateProperty(scriptsNode) !== undefined))
  ) {
    return failure(
      new DevCharterError("INVALID_ARGUMENT", "package.json is malformed or ambiguous")
    );
  }
  const indent = existingContent.match(/\n([ \t]+)\S/)?.[1] ?? "  ";
  const formattingOptions = {
    insertSpaces: !indent.includes("\t"),
    tabSize: indent.includes("\t") ? 1 : indent.length,
    eol: existingContent.includes("\r\n") ? "\r\n" : "\n"
  };
  let rendered = existingContent.replace(/^\ufeff/, "");
  const existingNames =
    scriptsNode?.children
      ?.map((property) => property.children?.[0]?.value)
      .filter((name): name is string => typeof name === "string") ?? [];
  const existingNameSet = new Set(existingNames);
  const orderedNames = [
    ...existingNames.filter((name) => Object.hasOwn(scripts, name)),
    ...sortedNames.filter((name) => !existingNameSet.has(name))
  ];
  if (scriptsNode === undefined) {
    const value = Object.fromEntries(sortedNames.map((name) => [name, scripts[name]]));
    rendered = applyEdits(rendered, modify(rendered, ["scripts"], value, { formattingOptions }));
  } else {
    for (const name of orderedNames) {
      rendered = applyEdits(
        rendered,
        modify(rendered, ["scripts", name], scripts[name], { formattingOptions })
      );
    }
  }
  return success(rendered);
}

export const codexAdapter: EcosystemAdapter = {
  id: "codex",
  async renderChange({ proposal, change, existingContent }) {
    const skill = change.path.match(
      /^\.agents\/skills\/(project-architect|specification-architect)\/SKILL\.md$/
    )?.[1];
    if (skill !== undefined) return loadPackagedSkill(skill);
    if (/^(?:.*\/)?AGENTS\.md$/i.test(change.path)) {
      const generated = `# Repository instructions\n\n## Purpose\n\n${proposal.desiredOutcome}\n\n## Workflow\n\nInspect before changing files, preserve project-owned content, and run the repository's authoritative verification commands.\n`;
      return success(
        existingContent === undefined ? generated : headingMerge(existingContent, generated)
      );
    }
    if (/(?:^|\/)package\.json$/i.test(change.path)) {
      const scripts = packageScripts(proposal);
      if (scripts === undefined) {
        return failure(
          new DevCharterError(
            "INVALID_ARGUMENT",
            "package.json rendering requires the approved project.packageScripts decision"
          )
        );
      }
      return renderPackageJson(scripts, existingContent);
    }
    if (/\.md$/i.test(change.path)) {
      const generated = `# ${change.purpose}\n\n${proposal.desiredOutcome}\n\n## Maintenance\n\n${change.maintenanceImplication}\n`;
      return success(
        existingContent === undefined ? generated : headingMerge(existingContent, generated)
      );
    }
    return failure(
      new DevCharterError("INVALID_ARGUMENT", "No deterministic Codex rendering recipe exists", {
        path: change.path
      })
    );
  }
};

export default codexAdapter;
