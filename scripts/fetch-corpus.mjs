#!/usr/bin/env node
/**
 * 下载锚点体检语料：把 dsh 各版本的 @deepseek-ai/* 包解到 `.anchor-corpus/<版本>/`，
 * 供 scripts/verify-anchors.mjs 用。
 *
 * 为什么要这个：补丁的 pattern 是长串精确匹配，只看「装上了没」看不出失锚。
 * CI 里拿一份官方包做基线，改 dsh 版号就能提前发现新版本把锚点改坏了。
 *
 * 用法：
 *   node scripts/fetch-corpus.mjs                       # 默认拉 ENGINE 里列的版本
 *   node scripts/fetch-corpus.mjs --version 0.2.1-rc.2  # 只拉一个
 *   node scripts/fetch-corpus.mjs --list                # 看会拉哪些包
 *   node scripts/fetch-corpus.mjs --offline             # 只用本地缓存
 *
 * 网络：默认走 npm registry。国内或代理环境先设 HTTPS_PROXY。
 * 语料目录已进 .gitignore，不进仓库。
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const corpusRoot = path.join(root, ".anchor-corpus");
const args = process.argv.slice(2);
const getOpt = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : "";
};

/** 默认语料版本。加新版本时在这里追加一行。 */
const VERSIONS = ["0.2.0-rc.2", "0.2.1-rc.2"];

/** 补丁会打到的全部包。少一个就会让对应补丁在体检里报 missing。 */
const PACKAGES = [
  "dsh-agent-instructions",
  "dsh-web-app",
  "dsh-headless",
  "dsh-harness-dev-context",
  "dsh-working-directory",
  "dsh-user-approval",
  "dsh-sandbox",
  "dsh-fs-sandbox",
  "dsh-sandbox-local",
  "dsh-sandbox-policy",
  "dsh-base",
  "dsh-settings",
  "dsh-fs-observation-policy",
  "dsh-repeat-tool-reminder",
  "dsh-compaction-tool-result-pruner",
  "dsh-tool-fs",
  "dsh-tool-subagent",
  "dsh-subagent",
  "dsh-acp-app",
  "dsh-sdk-app",
  "dsh-sdk-minimal",
  "dsh-tool-bash",
  "dsh-tool-pwsh",
  "dsh-persona",
  "dsh-session-format-v0-to-v1",
  "dsh-system-prompt",
  "dsh-tool-web",
  "dsh-hooks-claude-code",
  "dsh-hooks-codex",
  "dsh-api-session-controller",
  "dsh-session-reference",
  "dsh-agent-loop",
  "dsh-tools",
  "dsh-permission-presets",
  "dsh-session-log-deepseek",
  "dsh-experimental-auto-review",
  "dsh-llm-deepseek",
  "dsh-tool-todo",
  "dsh-app-boot",
  "dsh-session",
  "dsh-client-ui-conversation",
  "dsh-tool-present",
];

/**
 * pi-ai 是补丁 #47/#49/#57/#90/#91 的目标，不在 @deepseek-ai 命名空间下，
 * 也不跟 dsh 版本走（它自己发 0.x / 1.x）。每个 dsh 版本用它当时钉的版本。
 */
const PI_AI_BY_DSH = {
  "0.2.0-rc.2": "0.87.1",
  "0.2.1-rc.2": "1.1.0",
};

/**
 * 某些包是后来版本才有的，旧版本上不存在是正常的，不算失败。
 * 键 = 包名，值 = 它最早出现的 dsh 版本（含）。
 */
const INTRODUCED_IN = {
  "dsh-harness-dev-context": "0.2.1-rc.2",
  "dsh-working-directory": "0.2.1-rc.2",
  "dsh-tool-working-directory": "0.2.1-rc.2",
  "dsh-api-remote-access": "0.2.1-rc.2",
  "dsh-web-deepseek-api": "0.2.1-rc.2",
};

/**
 * 粗比版本号，够用（只比 major.minor，预发布标签按"同号即够"处理）。
 * 例：0.2.0-rc.2 vs 0.2.1-rc.2 → false；0.2.1-rc.2 vs 0.2.1-rc.2 → true。
 */
function versionAtLeast(v, min) {
  const num = (s) => String(s).split("-")[0].split(".").map(Number);
  const a = num(v);
  const b = num(min);
  const [a1, a2, a3 = 0] = a;
  const [b1, b2, b3 = 0] = b;
  if (a1 !== b1) return a1 > b1;
  if (a2 !== b2) return a2 > b2;
  return a3 >= b3;
}

if (args.includes("--list")) {
  console.log("versions:", VERSIONS.join(", "));
  console.log("packages:", PACKAGES.length, "@deepseek-ai/*, plus @earendil-works/pi-ai per version");
  for (const p of PACKAGES) console.log("  @deepseek-ai/" + p);
  for (const [dsh, pi] of Object.entries(PI_AI_BY_DSH)) console.log(`  @earendil-works/pi-ai@${pi}  (for dsh ${dsh})`);
  process.exit(0);
}

const only = getOpt("--version");
const offline = args.includes("--offline");
const versions = only ? [only] : VERSIONS;

function run(cmd, cmdArgs, cwd) {
  return execFileSync(cmd, cmdArgs, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
  });
}

/**
 * Windows 上 npm 只有 npm.cmd，execFileSync 直接调 "npm" 会 ENOENT，
 * 而调 "npm.cmd" 在无 shell 时又可能被拒。所以优先用 node 跑 npm-cli.js
 * （跟 lib/core.js 的 npmQuery 同一个办法），退路才用 shell。
 */
function npmCommand() {
  const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  if (fs.existsSync(npmCli)) return [process.execPath, [npmCli]];
  return ["npm", []];
}

function npmPack(spec, cwd) {
  const [cmd, pre] = npmCommand();
  const out = run(cmd, [...pre, "pack", spec, "--silent"], cwd);
  return out.trim().split(/\r?\n/).pop();
}

function unpack(tgz, dest) {
  fs.mkdirSync(dest, { recursive: true });
  run("tar", ["-xzf", tgz, "-C", dest]);
  return path.join(dest, "package");
}

let fetched = 0;
let reused = 0;
const failed = [];
const skipped = [];

for (const version of versions) {
  const outDir = path.join(corpusRoot, version);
  const workDir = path.join(corpusRoot, ".work", version);
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(workDir, { recursive: true });

  // dsh 自己的包跟 dsh 版本号走；pi-ai 是独立版本线，按表查。
  const plan = PACKAGES.map((p) => [`@deepseek-ai/${p}`, p, version]);
  const piVersion = PI_AI_BY_DSH[version];
  if (piVersion !== undefined) plan.push(["@earendil-works/pi-ai", "pi-ai", piVersion]);

  for (const [spec, folder, specVersion] of plan) {
    const target = path.join(outDir, folder);
    if (fs.existsSync(path.join(target, "lib")) || fs.existsSync(path.join(target, "dist"))) {
      reused += 1;
      continue;
    }
    // 这个包在该版本还没发布，跳过而不是算失败。
    const since = INTRODUCED_IN[folder];
    if (since !== undefined && !versionAtLeast(version, since)) {
      skipped.push(`${spec} (未在 ${version} 发布，最早 ${since})`);
      continue;
    }
    if (offline) {
      failed.push(`${spec}@${specVersion} (offline)`);
      continue;
    }
    try {
      const name = npmPack(`${spec}@${specVersion}`, workDir);
      const tgz = path.join(workDir, name);
      const pkgDir = unpack(tgz, path.join(workDir, folder));
      fs.rmSync(target, { recursive: true, force: true });
      fs.cpSync(pkgDir, target, { recursive: true });
      fs.rmSync(tgz, { force: true });
      fetched += 1;
      process.stdout.write(".");
    } catch (e) {
      failed.push(`${spec}@${version}: ${String(e.stderr || e.message).split(/\r?\n/)[0]}`);
    }
  }
  process.stdout.write("\n");
}

fs.rmSync(path.join(corpusRoot, ".work"), { recursive: true, force: true });

console.log(`fetch-corpus: fetched=${fetched} reused=${reused} skipped=${skipped.length} failed=${failed.length}`);
for (const s of skipped) console.log("  SKIP " + s);
for (const f of failed) console.log("  FAILED " + f);
console.log(`corpus at ${corpusRoot}`);
if (failed.length > 0) process.exit(1);
