#!/usr/bin/env node
/**
 * 锚点体检：把每条补丁的 pattern 拿去真实 dsh 包文件里试，逐版本报 OK / LOST。
 *
 * 为什么要有这个脚本：补丁的 pattern 是长串精确匹配，dsh 每次发版都可能改宿主源码，
 * 一失锚就是静默失效 —— 状态面板显示 skipped，用户以为打过了。CI 跑一遍能提前发现。
 *
 * 语料按版本分层：
 *   .anchor-corpus/0.2.1-rc.2/<pkg>/lib/index.js
 *   .anchor-corpus/0.2.0-rc.2/<pkg>/lib/index.js
 * 这份语料由 scripts/fetch-corpus.mjs 生成；没有语料时退回本机真实安装（DSH_BASE）。
 *
 * 判定（按单条补丁 × 单个版本）：
 *   OK       至少一条 replacement 命中，且全部幂等
 *   LOST     一条也没命中（不是 optional 的，必须修）
 *   optional 一条也没命中但标了 optional（正常，报 optional-miss）
 *   no-rules 补丁本身没有 replacements（占位 / 已无目标）
 *
 * 用法：
 *   node scripts/verify-anchors.mjs                    # 用 .anchor-corpus 全部版本
 *   node scripts/verify-anchors.mjs --corpus <dir>     # 指定语料根
 *   node scripts/verify-anchors.mjs --version 0.2.1-rc.2  # 只看一个版本
 *   node scripts/verify-anchors.mjs --strict           # 没有语料也算失败
 *   node scripts/verify-anchors.mjs --offline-ok       # CI 里允许没有语料（跳过）
 *   node scripts/verify-anchors.mjs --list             # 只列会检查的版本与包
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : "";
};
const offlineOk = args.includes("--offline-ok");
const strict = args.includes("--strict");
const listOnly = args.includes("--list");

/**
 * 补丁 file 键 → 包内相对路径。新增包时只改这张表。
 * 键必须与 lib/core.js 里 targetFiles() 的键名一致，否则会报 unmapped。
 */
export const TARGETS = {  "agent-instructions": [["dsh-agent-instructions", "lib/index.js"]],
  "agent-instructions-bootstrap": [["dsh-agent-instructions", "lib/bootstrap.js"]],
  "web-app": [["dsh-web-app", "cordis.patch.yml"]],
  "web-app-lib": [["dsh-web-app", "lib/index.js"]],
  "harness-dev-context": [["dsh-harness-dev-context", "lib/index.js"]],
  "working-directory": [["dsh-working-directory", "lib/index.js"]],
  headless: [["dsh-headless", "cordis.patch.yml"]],
  "agent-preset": [["dsh-web-app", "presets/standard.patch.yml"]],
  "user-approval": [["dsh-user-approval", "lib/types/index.js"]],
  "user-approval-code": [["dsh-user-approval", "lib/index.js"]],
  "user-approval-invariant": [["dsh-user-approval", "lib/invariant.js"]],
  escalation: [["dsh-sandbox", "lib/index.js"]],
  "fs-sandbox": [["dsh-fs-sandbox", "lib/index.js"]],
  "sandbox-local": [["dsh-sandbox-local", "lib/index.js"]],
  "sandbox-policy": [["dsh-sandbox-policy", "lib/index.js"]],
  base: [["dsh-base", "cordis.patch.yml"]],
  settings: [["dsh-settings", "lib/index.js"]],
  "fs-observation-policy": [["dsh-fs-observation-policy", "lib/index.js"]],
  "repeat-tool-reminder": [["dsh-repeat-tool-reminder", "lib/index.js"]],
  "compaction-tool-result-pruner": [["dsh-compaction-tool-result-pruner", "lib/index.js"]],
  "tool-fs": [["dsh-tool-fs", "lib/index.js"]],
  "tool-subagent": [["dsh-tool-subagent", "lib/index.js"]],
  subagent: [["dsh-subagent", "lib/index.js"]],
  "subagent-types": [["dsh-subagent", "lib/types/child-agent.js"]],
  "base-package": [["dsh-base", "package.json"]],
  "preset-standard": [["dsh-web-app", "presets/standard.patch.yml"]],
  "preset-cordis": [["dsh-web-app", "presets/cordis.patch.yml"]],
  "preset-minimal": [["dsh-web-app", "presets/minimal.patch.yml"]],
  "preset-ptc": [["dsh-web-app", "presets/ptc.patch.yml"]],
  "preset-acp-app": [["dsh-acp-app", "cordis.patch.yml"]],
  "preset-sdk-app": [["dsh-sdk-app", "cordis.patch.yml"]],
  "preset-sdk-minimal": [["dsh-sdk-minimal", "cordis.patch.yml"]],
  "tool-bash": [["dsh-tool-bash", "lib/index.js"]],
  "tool-pwsh": [["dsh-tool-pwsh", "lib/index.js"]],
  persona: [["dsh-persona", "lib/index.js"]],
  "session-format-v0": [["dsh-session-format-v0-to-v1", "lib/index.js"]],
  "system-prompt": [["dsh-system-prompt", "lib/index.js"]],
  "tool-web": [["dsh-tool-web", "lib/index.js"]],
  "hooks-claude-code": [["dsh-hooks-claude-code", "lib/index.js"]],
  "hooks-codex": [["dsh-hooks-codex", "lib/index.js"]],
  "api-session-controller": [["dsh-api-session-controller", "lib/index.js"]],
  "session-reference": [["dsh-session-reference", "lib/index.js"]],
  "agent-loop": [["dsh-agent-loop", "lib/index.js"]],
  "dsh-tools": [["dsh-tools", "lib/index.js"]],
  "dsh-tools-types": [["dsh-tools", "lib/types/index.js"]],
  "dsh-tools-ptc": [["dsh-tools", "lib/types/ptc.js"]],
  "permission-presets": [["dsh-permission-presets", "lib/index.js"]],
  "session-log-deepseek": [["dsh-session-log-deepseek", "lib/index.js"]],
  "deliverables-prompt": [["dsh-tool-present", "lib/index.js"]],
  "auto-review": [["dsh-experimental-auto-review", "lib/index.js"]],
  "llm-deepseek": [["dsh-llm-deepseek", "lib/index.js"]],
  "tool-todo": [["dsh-tool-todo", "lib/index.js"]],
  "app-boot": [["dsh-app-boot", "lib/index.js"]],
  session: [["dsh-session", "lib/index.js"]],
  "conversation-client": [["dsh-client-ui-conversation", "lib/client.js"]],
  "pi-ai-anthropic-messages": [["pi-ai", "dist/api/anthropic-messages.js"]],
  "pi-ai-completions": [["pi-ai", "dist/api/openai-completions.js"]],
  "pi-ai-responses-shared": [["pi-ai", "dist/api/openai-responses-shared.js"]],
};

const corpusRoot = path.resolve(opt("--corpus") || path.join(root, ".anchor-corpus"));
const onlyVersion = opt("--version");

/** 语料里有哪些版本目录（降序，新版本在前）。 */
function corpusVersions() {
  if (!fs.existsSync(corpusRoot)) return [];
  return fs
    .readdirSync(corpusRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+\.\d+/.test(d.name))
    .map((d) => d.name)
    .sort()
    .reverse()
    .filter((v) => !onlyVersion || v === onlyVersion);
}

function readCorpus(versionDir, pkg, rel) {
  const fp = path.join(corpusRoot, versionDir, pkg, rel);
  return fs.existsSync(fp) ? fs.readFileSync(fp, "utf8") : null;
}

/** 本机真实安装：$DSH_BASE 下平铺的 @deepseek-ai 包。 */
function liveAiBase() {
  const env = String(process.env.DSH_BASE || "").trim();
  return env && fs.existsSync(env) ? env : "";
}
function readLive(aiBase, pkg, rel) {
  if (!aiBase) return null;
  const fp = path.join(aiBase, pkg, rel);
  return fs.existsSync(fp) ? fs.readFileSync(fp, "utf8") : null;
}

function matches(pat, s) {
  if (typeof pat === "string") return s.includes(pat);
  const re = new RegExp(pat.source, pat.flags.replace(/[gy]/g, ""));
  return re.test(s);
}
/**
 * 复刻 lib/core.js 的替换语义，别用 String.replace。
 *
 * core.js 对字符串 pattern 走 `split(needle).join(replace)`（全替换），
 * 对 RegExp 走 `out.replace(re, written)`（保留 $1..$9 展开）。
 * 用 String.replace 代替会让「同一 needle 出现多次」的补丁被误判成不幂等。
 */
function applyLikeCore(pat, repl, s) {
  if (pat instanceof RegExp) {
    const re = new RegExp(pat.source, pat.flags.includes("g") ? pat.flags : `${pat.flags}g`);
    re.lastIndex = 0;
    return s.replace(re, repl);
  }
  return s.split(pat).join(repl);
}

const versions = corpusVersions();
const aiBase = liveAiBase();

if (listOnly) {
  console.log(`corpus root: ${corpusRoot}`);
  console.log(`versions: ${versions.length ? versions.join(", ") : "(none)"}`);
  for (const v of versions) {
    const pkgs = fs.readdirSync(path.join(corpusRoot, v)).filter((n) => fs.statSync(path.join(corpusRoot, v, n)).isDirectory());
    console.log(`  ${v}: ${pkgs.length} packages`);
  }
  console.log(`live DSH_BASE: ${aiBase || "(none)"}`);
  process.exit(0);
}

if (versions.length === 0 && !aiBase) {
  console.log("verify-anchors: 没有可用语料（既没有 .anchor-corpus/，也没有 DSH_BASE），跳过锚点体检");
  console.log("  先用 dsh 装一份宿主，或跑 node scripts/fetch-corpus.mjs 拉语料");
  process.exit(strict ? 1 : 0);
}

/** 被别的脚本 import 时只导出 TARGETS，不跑体检主体。 */
const invokedDirectly = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (!invokedDirectly) {
  // 作为模块被 import：上面已经 export TARGETS，主体留给调用方自己跑。
  // 用顶层 await 包一层会打断 import，所以这里靠 throw 之外的早退实现。
} else {

const { ALL_PATCHES } = await import(new URL("../lib/core.js", import.meta.url).href);

/** 对某个「补丁 × 版本」求状态。 */
function evaluate(patch, reader, label) {
  const keys = Array.isArray(patch.file) ? patch.file : [patch.file];
  const files = [];
  const missingKeys = [];
  const unmappedKeys = [];
  for (const k of keys) {
    const entries = TARGETS[k];
    if (entries === undefined) { unmappedKeys.push(k); continue; }
    let found = false;
    for (const [pkg, rel] of entries) {
      const t = reader(pkg, rel);
      if (t === null) continue;
      found = true;
      files.push(t);
    }
    if (!found) missingKeys.push(k);
  }
  const reps = patch.replacements ?? [];
  let hit = 0;
  let nonIdem = 0;
  const missed = [];
  for (const [i, rep] of reps.entries()) {
    const src = files.find((t) => matches(rep.pattern, t));
    if (src === undefined) { missed.push(i); continue; }
    hit += 1;
    const once = applyLikeCore(rep.pattern, String(rep.replace ?? ""), src);
    if (once !== src) {
      const twice = applyLikeCore(rep.pattern, String(rep.replace ?? ""), once);
      if (twice !== once) nonIdem += 1;
    }
  }
  let status;
  const untestable = files.length === 0;
  if (reps.length === 0) status = "no-rules";
  else if (untestable) {
    // 语料里没有这个补丁要打的文件。两种原因，都不是失锚：
    //   unmapped   —— 目标不是官方 npm 包（第三方插件 preset、官方 EXE 里的 main.js）
    //   missing    —— 官方包里没这个文件（该版本本来就不发）
    status = "no-corpus";
  } else if (nonIdem > 0) status = "NON-IDEMPOTENT";
  else if (hit === 0) status = patch.optional ? "optional-miss" : "LOST";
  else if (hit < reps.length) status = "partial";
  else status = "OK";
  return { status, hit, total: reps.length, nonIdem, missingKeys, unmappedKeys, missed, label };
}

const rows = [];
for (const patch of ALL_PATCHES) {
  const perVersion = [];
  for (const v of versions) {
    perVersion.push(evaluate(patch, (pkg, rel) => readCorpus(v, pkg, rel), v));
  }
  if (aiBase) perVersion.push(evaluate(patch, (pkg, rel) => readLive(aiBase, pkg, rel), "live"));
  rows.push({ patch, perVersion });
}

// 只有 LOST / NON-IDEMPOTENT 算失败；partial / optional-miss / no-rules 都不阻断。
const failed = [];
for (const r of rows) {
  for (const e of r.perVersion) {
    if (e.status === "LOST" || e.status === "NON-IDEMPOTENT") failed.push({ ...e, patch: r.patch });
  }
}

const labels = versions.length ? versions : [];
if (aiBase) labels.push("live");
console.log(`verify-anchors: ${rows.length} patches × ${labels.length} target(s)`);
console.log(`  corpus: ${versions.length ? corpusRoot : "(none)"}  live: ${aiBase || "(none)"}`);

// 每个版本一列状态汇总
const perLabelCounts = {};
for (const label of labels) {
  const counts = {};
  for (const r of rows) {
    const e = r.perVersion.find((x) => x.label === label);
    if (e === undefined) continue;
    counts[e.status] = (counts[e.status] ?? 0) + 1;
  }
  perLabelCounts[label] = counts;
}
for (const [label, counts] of Object.entries(perLabelCounts)) {
  const summary = Object.entries(counts).sort().map(([k, v]) => `${k}=${v}`).join("  ");
  console.log(`  ${label.padEnd(12)} ${summary}`);
}

if (failed.length > 0) {
  console.log("");
  for (const f of failed) {
    const detail = f.missingKeys.length ? ` missing=${f.missingKeys.join(",")}` : "";
    const unmapped = f.unmappedKeys.length ? ` unmapped=${f.unmappedKeys.join(",")}` : "";
    const miss = f.missed.length ? ` missedRules=[${f.missed.join(",")}]` : "";
    console.log(`  ${f.status.padEnd(15)} [${f.label}] #${f.patch.id} ${f.patch.name} hit=${f.hit}/${f.total}${detail}${unmapped}${miss}`);
  }
  console.error(`\nverify-anchors: ${failed.length} 处失锚或不幂等，需要重锚`);
  process.exit(1);
}

console.log("\nverify-anchors: OK");
}
