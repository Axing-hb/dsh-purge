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

/** pi-ai 是补丁 #47/#49/#57/#90/#91 的目标，不在 @deepseek-ai 命名空间下。 */
const EXTRA = [["@earendil-works/pi-ai", "pi-ai"]];

if (args.includes("--list")) {
  console.log("versions:", VERSIONS.join(", "));
  console.log("packages:", PACKAGES.length, "plus", EXTRA.length, "extra");
  for (const p of PACKAGES) console.log("  @deepseek-ai/" + p);
  for (const [n] of EXTRA) console.log("  " + n);
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

function unpack(tgz, dest) {
  fs.mkdirSync(dest, { recursive: true });
  run("tar", ["-xzf", tgz, "-C", dest]);
  return path.join(dest, "package");
}

let fetched = 0;
let reused = 0;
const failed = [];

for (const version of versions) {
  const outDir = path.join(corpusRoot, version);
  const workDir = path.join(corpusRoot, ".work", version);
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(workDir, { recursive: true });

  for (const [spec, folder] of [...PACKAGES.map((p) => [`@deepseek-ai/${p}`, p]), ...EXTRA]) {
    const target = path.join(outDir, folder);
    if (fs.existsSync(path.join(target, "lib")) || fs.existsSync(path.join(target, "dist"))) {
      reused += 1;
      continue;
    }
    if (offline) {
      failed.push(`${spec}@${version} (offline)`);
      continue;
    }
    try {
      const name = run("npm", ["pack", `${spec}@${version}`, "--silent"], workDir).trim().split(/\r?\n/).pop();
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

console.log(`fetch-corpus: fetched=${fetched} reused=${reused} failed=${failed.length}`);
for (const f of failed) console.log("  FAILED " + f);
console.log(`corpus at ${corpusRoot}`);
if (failed.length > 0) process.exit(1);
