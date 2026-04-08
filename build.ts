#!/usr/bin/env bun
import plugin from "bun-plugin-tailwind";
import { existsSync } from "fs";
import { rm, readFile, writeFile } from "fs/promises";
import path from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🏗️  Bun Build Script

Usage: bun run build.ts [options]

Common Options:
  --outdir <path>          Output directory (default: "dist")
  --minify                 Enable minification (or --minify.whitespace, --minify.syntax, etc)
  --sourcemap <type>      Sourcemap type: none|linked|inline|external
  --target <target>        Build target: browser|bun|node
  --format <format>        Output format: esm|cjs|iife
  --splitting              Enable code splitting
  --packages <type>        Package handling: bundle|external
  --public-path <path>     Public path for assets
  --env <mode>             Environment handling: inline|disable|prefix*
  --conditions <list>      Package.json export conditions (comma separated)
  --external <list>        External packages (comma separated)
  --banner <text>          Add banner text to output
  --footer <text>          Add footer text to output
  --define <obj>           Define global constants (e.g. --define.VERSION=1.0.0)
  --help, -h               Show this help message

Example:
  bun run build.ts --outdir=dist --minify --sourcemap=linked --external=react,react-dom
`);
  process.exit(0);
}

const toCamelCase = (str: string): string => str.replace(/-([a-z])/g, (_match, p1) => p1.toUpperCase());

const parseValue = (value: string): any => {
  if (value === "true") return true;
  if (value === "false") return false;

  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d*\.\d+$/.test(value)) return parseFloat(value);

  if (value.includes(",")) return value.split(",").map(v => v.trim());

  return value;
};

function parseArgs(): any {
  const config: any = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;
    if (!arg.startsWith("--")) continue;

    if (arg.startsWith("--no-")) {
      const key = toCamelCase(arg.slice(5));
      config[key] = false;
      continue;
    }

    if (!arg.includes("=") && (i === args.length - 1 || args[i + 1]?.startsWith("--"))) {
      const key = toCamelCase(arg.slice(2));
      config[key] = true;
      continue;
    }

    let key: string;
    let value: string;

    if (arg.includes("=")) {
      [key, value] = arg.slice(2).split("=", 2) as [string, string];
    } else {
      key = arg.slice(2);
      value = args[++i] ?? "";
    }

    key = toCamelCase(key);

    if (key.includes(".")) {
      const [parentKey, childKey] = key.split(".") as [string, string];
      config[parentKey] = config[parentKey] || {};
      config[parentKey][childKey] = parseValue(value);
    } else {
      config[key] = parseValue(value);
    }
  }

  return config;
}

const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

if (process.argv.includes("--lib")) {
  // Library build:
  // - index.ts bundled as a browser-targeted ES module for browser-safe exports
  // - index.node.ts bundled as a node-targeted ES module for server-side exports
  const outdir = path.join(process.cwd(), "dist");

  if (existsSync(outdir)) {
    console.log(`🗑️ Cleaning previous build at ${outdir}`);
    await rm(outdir, { recursive: true, force: true });
  }

  console.log("\n📦 Building library (browser)...\n");
  const browserStart = performance.now();

  const browserResult = await Bun.build({
    entrypoints: [path.resolve("index.ts")],
    outdir,
    target: "browser",
    format: "esm",
    packages: "external",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });

  const browserEnd = performance.now();

  const browserOutputTable = browserResult.outputs.map(output => ({
    File: path.relative(process.cwd(), output.path),
    Type: output.kind,
    Size: formatFileSize(output.size),
  }));

  console.table(browserOutputTable);
  if (!browserResult.success) {
    console.error(`\n❌ Browser library build failed\n`);
  } else {
    console.log(`\n✅ Browser library build completed in ${(browserEnd - browserStart).toFixed(2)}ms\n`);
  }

  console.log("\n📦 Building library (node)...\n");
  const nodeStart = performance.now();

  const nodeResult = await Bun.build({
    entrypoints: [path.resolve("index.node.ts")],
    outdir,
    target: "node",
    format: "esm",
    packages: "external",
  });

  const nodeEnd = performance.now();

  const nodeOutputTable = nodeResult.outputs.map(output => ({
    File: path.relative(process.cwd(), output.path),
    Type: output.kind,
    Size: formatFileSize(output.size),
  }));

  console.table(nodeOutputTable);
  if (!nodeResult.success) {
    console.error(`\n❌ Node library build failed\n`);
  } else {
    console.log(`\n✅ Node library build completed in ${(nodeEnd - nodeStart).toFixed(2)}ms\n`);
  }

  // Build CLI entrypoint (bin/markov.ts) into dist/bin/markov.js with a Node shebang
  console.log("\n📦 Building CLI (markov)...\n");
  const cliStart = performance.now();
  const cliResult = await Bun.build({
    entrypoints: [path.resolve("bin/markov.ts")],
    outdir,
    target: "node",
    format: "esm",
    packages: "external",
    banner: "#!/usr/bin/env node\n",
  });

  const cliEnd = performance.now();

  const cliOutputTable = cliResult.outputs.map(output => ({
    File: path.relative(process.cwd(), output.path),
    Type: output.kind,
    Size: formatFileSize(output.size),
  }));

  // Ensure the generated files start with a shebang for npm/bun installers
  for (const output of cliResult.outputs) {
    try {
      const p = output.path;
      let content = await readFile(p, 'utf8');
      // Remove any existing shebang lines and normalize to a single Node shebang
      content = content.replace(/#!.*\r?\n/g, '');
      await writeFile(p, '#!/usr/bin/env node\n' + content, 'utf8');
    } catch (err) {
      // best-effort, ignore
    }
  }

  console.table(cliOutputTable);
  if (!cliResult.success) {
    console.error(`\n❌ CLI build failed\n`);
  } else {
    console.log(`\n✅ CLI build completed in ${(cliEnd - cliStart).toFixed(2)}ms\n`);
  }

  process.exit(browserResult.success && nodeResult.success && cliResult.success ? 0 : 1);
}

console.log("\n🚀 Starting build process...\n");

const cliConfig = parseArgs();
const outdir = cliConfig.outdir || path.join(process.cwd(), "dist");

if (existsSync(outdir)) {
  console.log(`🗑️ Cleaning previous build at ${outdir}`);
  await rm(outdir, { recursive: true, force: true });
}

const start = performance.now();

const entrypoints = [...new Bun.Glob("**.html").scanSync("src")]
  .map(a => path.resolve("src", a))
  .filter(dir => !dir.includes("node_modules"));
console.log(`📄 Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process\n`);

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [plugin],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  ...cliConfig,
});

const end = performance.now();

const outputTable = result.outputs.map(output => ({
  File: path.relative(process.cwd(), output.path),
  Type: output.kind,
  Size: formatFileSize(output.size),
}));

console.table(outputTable);
const buildTime = (end - start).toFixed(2);

console.log(`\n✅ Build completed in ${buildTime}ms\n`);
