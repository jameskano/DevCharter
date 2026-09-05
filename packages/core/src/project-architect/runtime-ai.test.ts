import { describe, expect, it } from "vitest";

import {
  analyzeRuntimeAiEvidence,
  bindRuntimeAiFingerprintEvidence,
  sourceImports
} from "./runtime-ai.js";

function evidence(
  entries: Readonly<Record<string, string | undefined>>,
  options: { production?: readonly string[]; tests?: readonly string[] } = {}
) {
  const texts = new Map(
    Object.entries(entries).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );
  const sourcePaths = [...texts.keys()].filter((repositoryPath) =>
    /\.(?:[cm]?[jt]sx?|py|rs|go|java|kts?)$/i.test(repositoryPath)
  );
  return analyzeRuntimeAiEvidence({
    texts,
    productionSourcePaths: new Set(options.production ?? sourcePaths),
    testSourcePaths: new Set(options.tests ?? [])
  });
}

describe("runtime-AI package authority", () => {
  it.each([
    {
      name: "same package declaration and import",
      entries: {
        "packages/a/package.json": '{"dependencies":{"openai":"1"}}',
        "packages/a/src/client.ts": 'import OpenAI from "openai";'
      },
      detected: true
    },
    {
      name: "sibling declaration cannot authorize an import",
      entries: {
        "packages/a/package.json": '{"dependencies":{"openai":"1"}}',
        "packages/b/src/client.ts": 'import OpenAI from "openai";'
      },
      detected: false
    },
    {
      name: "nearer empty package manifest blocks a root declaration",
      entries: {
        "package.json": '{"dependencies":{"openai":"1"}}',
        "packages/b/package.json": '{"name":"b"}',
        "packages/b/src/client.ts": 'import OpenAI from "openai";'
      },
      detected: false
    },
    {
      name: "root declaration governs a root source",
      entries: {
        "package.json": '{"dependencies":{"openai":"1"}}',
        "src/client.ts": 'import OpenAI from "openai";'
      },
      detected: true
    },
    {
      name: "root declaration governs nested source without nearer manifest",
      entries: {
        "package.json": '{"dependencies":{"openai":"1"}}',
        "packages/a/src/client.ts": 'import OpenAI from "openai";'
      },
      detected: true
    },
    {
      name: "a Python manifest cannot authorize JavaScript",
      entries: {
        "pyproject.toml": '[project]\ndependencies = ["openai"]',
        "src/client.ts": 'import OpenAI from "openai";'
      },
      detected: false
    }
  ])("resolves $name", ({ entries, detected }) => {
    const result = evidence(entries);
    expect(result.matchedDependencies.length > 0).toBe(detected);
    expect(result.matchedImportsBySource.size > 0).toBe(detected);
  });

  it("keeps declaration-only and import-only evidence unconfirmed", () => {
    const declared = evidence({ "package.json": '{"dependencies":{"openai":"1"}}' });
    expect(declared.matchedDependencies).toEqual([]);
    expect(declared.unmatchedDependencies.map((item) => item.name)).toEqual(["openai"]);

    const imported = evidence({ "src/client.ts": 'import OpenAI from "openai";' });
    expect(imported.matchedDependencies).toEqual([]);
    expect(imported.matchedImportsBySource.size).toBe(0);
  });

  it("is stable across input ordering and path separators", () => {
    const posix = evidence({
      "package.json": '{"dependencies":{"openai":"1"}}',
      "packages/a/src/client.ts": 'import OpenAI from "openai";'
    });
    const windowsReordered = evidence({
      "packages\\a\\src\\client.ts": 'import OpenAI from "openai";',
      "package.json": '{"dependencies":{"openai":"1"}}'
    });
    expect(windowsReordered).toEqual(posix);
    expect(
      bindRuntimeAiFingerprintEvidence("base", "packages\\a\\src\\client.ts", windowsReordered)
    ).toBe(bindRuntimeAiFingerprintEvidence("base", "packages/a/src/client.ts", posix));
  });
});

describe("JavaScript runtime-AI lexical masking", () => {
  it.each([
    ["line comment", '// import OpenAI from "openai";'],
    ["block comment", '/*\nimport OpenAI from "openai";\n*/'],
    ["single-quoted example", `const example = 'import OpenAI from "openai"';`],
    ["double-quoted example", `const example = "require('openai')";`],
    ["template example", 'const example = `import OpenAI from "openai"`;'],
    ["multiline template", 'const example = `first\nimport OpenAI from "openai"\nlast`;'],
    ["escaped quotes", `const example = 'import OpenAI from \\'openai\\'';`],
    ["escaped backtick", 'const example = `import("openai") \\` still text`;'],
    ["comment markers in string", `const example = "// import('openai') /* require('openai') */";`]
  ])("ignores %s", (_name, source) => {
    expect(sourceImports("src/client.ts", source)).toEqual([]);
  });

  it.each([
    ["static import", 'import OpenAI from "openai";'],
    ["side-effect import", 'import "openai";'],
    ["require", 'const OpenAI = require("openai");'],
    ["dynamic import", 'const OpenAI = await import("openai");'],
    ["template interpolation", 'const value = `${await import("openai")}`;']
  ])("recognizes %s", (_name, source) => {
    expect(sourceImports("src/client.ts", source)).toEqual(["openai"]);
  });

  it("keeps only the live import beside inactive examples", () => {
    expect(
      sourceImports(
        "src/client.ts",
        [
          '// import "@anthropic-ai/sdk";',
          'const example = `require("openai")`;',
          'import OpenAI from "openai";'
        ].join("\n")
      )
    ).toEqual(["openai"]);
  });
});

describe("polyglot runtime-AI lexical masking", () => {
  const cases = [
    {
      language: "Python",
      manifestPath: "pyproject.toml",
      manifest: '[project]\ndependencies = ["openai"]',
      sourcePath: "src/client.py",
      active: "from openai import OpenAI",
      inactive: [
        "# import openai",
        'EXAMPLE = """\nimport openai\n"""',
        "EXAMPLE = '''\nfrom openai import OpenAI\n'''",
        `example = 'import openai'`,
        'example = "from openai import OpenAI"'
      ]
    },
    {
      language: "Rust",
      manifestPath: "Cargo.toml",
      manifest: '[dependencies]\nasync-openai = "0.27"',
      sourcePath: "src/lib.rs",
      active: "use async_openai::Client;",
      inactive: [
        "// use async_openai::Client;",
        "/* use async_openai::Client; */",
        "/* outer /* use async_openai::Client; */ outer */",
        'let example = "use async_openai::Client;";',
        'let example = r#"use async_openai::Client;"#;'
      ]
    },
    {
      language: "Go",
      manifestPath: "go.mod",
      manifest: "module example.test/demo\nrequire github.com/sashabaranov/go-openai v1.40.1",
      sourcePath: "src/main.go",
      active: 'package main\nimport "github.com/sashabaranov/go-openai"',
      inactive: [
        '// import "github.com/sashabaranov/go-openai"',
        '/* import "github.com/sashabaranov/go-openai" */',
        'var example = `import "github.com/sashabaranov/go-openai"`',
        'var example = "import \\"github.com/sashabaranov/go-openai\\""'
      ]
    },
    {
      language: "Java",
      manifestPath: "pom.xml",
      manifest:
        "<project><dependencies><dependency><groupId>com.openai</groupId><artifactId>openai-java</artifactId></dependency></dependencies></project>",
      sourcePath: "src/App.java",
      active: "import com.openai.client.OpenAIClient;",
      inactive: [
        "// import com.openai.client.OpenAIClient;",
        "/* import com.openai.client.OpenAIClient; */",
        'String example = "import com.openai.client.OpenAIClient;";'
      ]
    },
    {
      language: "Kotlin",
      manifestPath: "pom.xml",
      manifest:
        "<project><dependencies><dependency><groupId>com.anthropic</groupId><artifactId>anthropic-java</artifactId></dependency></dependencies></project>",
      sourcePath: "src/App.kt",
      active: "import com.anthropic.client.AnthropicClient",
      inactive: [
        "// import com.anthropic.client.AnthropicClient",
        "/* import com.anthropic.client.AnthropicClient */",
        'val example = """\nimport com.anthropic.client.AnthropicClient\n"""'
      ]
    }
  ] as const;

  it.each(cases)(
    "recognizes an active $language import",
    ({ manifestPath, manifest, sourcePath, active }) => {
      const result = evidence({ [manifestPath]: manifest, [sourcePath]: active });
      expect(result.matchedDependencies).toHaveLength(1);
      expect(result.matchedImportsBySource.has(sourcePath)).toBe(true);
    }
  );

  for (const testCase of cases) {
    it.each(testCase.inactive.map((source, index) => ({ source, index })))(
      `ignores ${testCase.language} inactive form $index`,
      ({ source }) => {
        const result = evidence({
          [testCase.manifestPath]: testCase.manifest,
          [testCase.sourcePath]: source
        });
        expect(result.matchedDependencies).toEqual([]);
        expect(result.matchedImportsBySource.size).toBe(0);
      }
    );
  }

  it("recognizes a grouped Go import declaration", () => {
    const result = evidence({
      "go.mod": "module example.test/demo\nrequire github.com/sashabaranov/go-openai v1.40.1",
      "src/main.go":
        'package main\nimport (\n  "fmt"\n  openai "github.com/sashabaranov/go-openai"\n)'
    });
    expect(result.matchedDependencies).toHaveLength(1);
    expect(result.matchedImportsBySource.has("src/main.go")).toBe(true);
  });
});

describe("authoritative Python dependency sections", () => {
  it.each([
    ["PEP 621 dependencies", '[project]\ndependencies = [\n  "openai>=1", # client\n]'],
    [
      "PEP 621 optional dependencies",
      "[project.optional-dependencies]\nai = [\n  \"openai>=1; python_version >= '3.10'\",\n]"
    ],
    ["Poetry dependencies", '[tool.poetry.dependencies]\npython = "^3.12"\nopenai = "^1"']
  ])("recognizes %s", (_name, manifest) => {
    const result = evidence({
      "pyproject.toml": manifest,
      "src/client.py": "import openai"
    });
    expect(result.matchedDependencies.map((item) => item.name)).toEqual(["openai"]);
  });

  it.each([
    ["keywords", '[project]\nkeywords = ["openai"]'],
    ["classifiers", '[project]\nclassifiers = ["openai"]'],
    ["arbitrary tool array", '[tool.example]\npackages = ["openai"]'],
    ["commented dependency", '[project]\n# dependencies = ["openai"]'],
    ["malformed dependency array", '[project]\ndependencies = ["openai"\n[tool.example]'],
    ["malformed Poetry dependency", "[tool.poetry.dependencies]\nopenai ="]
  ])("rejects %s", (_name, manifest) => {
    const result = evidence({
      "pyproject.toml": manifest,
      "src/client.py": "import openai"
    });
    expect(result.dependencies).toEqual([]);
    expect(result.matchedDependencies).toEqual([]);
    expect(result.matchedImportsBySource.size).toBe(0);
  });
});

describe("bounded Maven application dependency authority", () => {
  const javaImport = "import com.openai.client.OpenAIClient;";
  const directDependency = (details = ""): string => `
    <dependency>
      <groupId>com.openai</groupId>
      <artifactId>openai-java</artifactId>
      ${details}
    </dependency>`;
  const pom = (body: string): string => `<project>${body}</project>`;

  it.each([
    ["omitted scope", pom(`<dependencies>${directDependency()}</dependencies>`), "src/App.java"],
    [
      "compile scope",
      pom(`<dependencies>${directDependency("<scope>compile</scope>")}</dependencies>`),
      "src/App.java"
    ],
    [
      "runtime scope",
      pom(`<dependencies>${directDependency("<scope>runtime</scope>")}</dependencies>`),
      "src/App.java"
    ],
    [
      "provided scope",
      pom(`<dependencies>${directDependency("<scope>provided</scope>")}</dependencies>`),
      "src/App.java"
    ],
    [
      "system scope",
      pom(`<dependencies>${directDependency("<scope>system</scope>")}</dependencies>`),
      "src/App.java"
    ],
    [
      "optional dependency",
      pom(`<dependencies>${directDependency("<optional>true</optional>")}</dependencies>`),
      "src/App.java"
    ],
    [
      "Maven namespace and XML declaration",
      `<?xml version="1.0" encoding="UTF-8"?>
       <project xmlns="http://maven.apache.org/POM/4.0.0">
         <modelVersion>4.0.0</modelVersion>
         <dependencies>${directDependency("<version>${openai.version}</version>")}</dependencies>
       </project>`,
      "src/App.java"
    ],
    [
      "one exact match among multiple dependencies",
      pom(`<dependencies>
        <dependency><groupId>org.example</groupId><artifactId>ordinary</artifactId></dependency>
        ${directDependency()}
      </dependencies>`),
      "src/App.java"
    ],
    [
      "active Java import",
      pom(`<name>demo</name><dependencies>${directDependency()}</dependencies>`),
      "src/App.java"
    ],
    [
      "active Kotlin import",
      pom(`<dependencies>${directDependency()}</dependencies>`),
      "src/App.kt"
    ]
  ])("accepts a direct dependency with %s", (_name, manifest, sourcePath) => {
    const result = evidence({ "pom.xml": manifest, [sourcePath]: javaImport });
    expect(result.dependencies.map((item) => item.name)).toEqual(["com.openai:openai-java"]);
    expect(result.matchedDependencies.map((item) => item.name)).toEqual(["com.openai:openai-java"]);
    expect([...result.matchedImportsBySource.keys()]).toEqual([sourcePath]);
  });

  it.each([
    [
      "XML-commented dependency",
      pom(`<dependencies><!-- ${directDependency()} --></dependencies>`)
    ],
    [
      "multiline XML-commented dependency",
      pom(`<!--\n<dependencies>\n${directDependency()}\n</dependencies>\n-->`)
    ],
    [
      "dependency markup inside CDATA",
      pom(
        `<description><![CDATA[<dependencies>${directDependency()}</dependencies>]]></description>`
      )
    ],
    [
      "dependency management",
      pom(
        `<dependencyManagement><dependencies>${directDependency()}</dependencies></dependencyManagement>`
      )
    ],
    [
      "BOM import scope",
      pom(
        `<dependencies>${directDependency("<scope>import</scope><type>pom</type>")}</dependencies>`
      )
    ],
    [
      "build plugin dependency",
      pom(
        `<build><plugins><plugin><dependencies>${directDependency()}</dependencies></plugin></plugins></build>`
      )
    ],
    [
      "reporting plugin dependency",
      pom(
        `<reporting><plugins><plugin><dependencies>${directDependency()}</dependencies></plugin></plugins></reporting>`
      )
    ],
    [
      "profile-only dependency",
      pom(
        `<profiles><profile><dependencies>${directDependency()}</dependencies></profile></profiles>`
      )
    ],
    [
      "test-scoped dependency",
      pom(`<dependencies>${directDependency("<scope>test</scope>")}</dependencies>`)
    ],
    [
      "arbitrary extension nesting",
      pom(`<extensions><dependencies>${directDependency()}</dependencies></extensions>`)
    ],
    [
      "missing groupId",
      pom(
        "<dependencies><dependency><artifactId>openai-java</artifactId></dependency></dependencies>"
      )
    ],
    [
      "missing artifactId",
      pom("<dependencies><dependency><groupId>com.openai</groupId></dependency></dependencies>")
    ],
    [
      "empty groupId or artifactId",
      pom(
        "<dependencies><dependency><groupId> </groupId><artifactId>openai-java</artifactId></dependency></dependencies>"
      )
    ],
    [
      "malformed unclosed dependency",
      "<project><dependencies><dependency><groupId>com.openai</groupId><artifactId>openai-java</artifactId></dependencies></project>"
    ],
    ["malformed ancestry", `<project><dependencies>${directDependency()}</project></dependencies>`],
    [
      "lookalike identifiers",
      pom(
        "<dependencies><dependency><groupId>com.openai.example</groupId><artifactId>openai-java-mock</artifactId></dependency></dependencies>"
      )
    ]
  ])("rejects %s", (_name, manifest) => {
    const result = evidence({ "pom.xml": manifest, "src/App.java": javaImport });
    expect(result.matchedDependencies).toEqual([]);
    expect(result.matchedImportsBySource.size).toBe(0);
    expect(result.dependenciesByManifest.size).toBe(0);
  });
});

describe("production-source eligibility", () => {
  it("keeps test-only imports separate from confirming production evidence", () => {
    const entries = {
      "package.json": '{"dependencies":{"openai":"1"}}',
      "src/client.test.ts": 'import OpenAI from "openai";'
    };
    const result = evidence(entries, { production: [], tests: ["src/client.test.ts"] });
    expect(result.matchedDependencies).toEqual([]);
    expect(result.matchedImportsBySource.size).toBe(0);
    expect(result.matchedTestImportsBySource.has("src/client.test.ts")).toBe(true);
    expect(result.unmatchedDependencies.map((item) => item.name)).toEqual(["openai"]);
  });

  it("confirms from production while keeping test matches distinct", () => {
    const entries = {
      "pyproject.toml": '[project]\ndependencies = ["openai"]',
      "src/client.py": "import openai",
      "tests/test_client.py": "import openai"
    };
    const result = evidence(entries, {
      production: ["src/client.py"],
      tests: ["tests/test_client.py"]
    });
    expect(result.matchedDependencies).toHaveLength(1);
    expect([...result.matchedImportsBySource.keys()]).toEqual(["src/client.py"]);
    expect([...result.matchedTestImportsBySource.keys()]).toEqual(["tests/test_client.py"]);
  });
});

describe("exact ecosystem-specific dependency mappings", () => {
  it.each(["@types/openai", "openai-mock", "not-openai"])(
    "does not allow %s to authorize openai",
    (dependency) => {
      const result = evidence({
        "package.json": JSON.stringify({ devDependencies: { [dependency]: "1" } }),
        "src/client.ts": 'import OpenAI from "openai";'
      });
      expect(result.matchedDependencies).toEqual([]);
      expect(result.matchedImportsBySource.size).toBe(0);
      expect(result.unmatchedDependencies.map((item) => item.name)).toEqual([dependency]);
    }
  );

  it.each([
    ["openai", "openai"],
    ["@anthropic-ai/sdk", "@anthropic-ai/sdk"],
    ["@ai-sdk/openai", "@ai-sdk/openai"]
  ])("maps JavaScript dependency %s only to its supported import", (dependency, importName) => {
    const result = evidence({
      "package.json": JSON.stringify({ dependencies: { [dependency]: "1" } }),
      "src/client.ts": `import "${importName}";`
    });
    expect(result.matchedDependencies.map((item) => item.name)).toEqual([dependency]);
  });
});
