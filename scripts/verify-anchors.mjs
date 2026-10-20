#!/usr/bin/env node
/**
 * 锚点体检：把每条补丁的 pattern 拿去真实 dsh 包文件里试，报 OK / LOST / NEITHER。
 *
 * 为什么要有这个脚本：dsh 每次发版都可能改宿主源码，补丁的 pattern 是长串精确匹配，
 * 一失锚就是静默失效 —— 状态面板显示 skipped，用户以为打过了。CI 跑一遍能提前发现。
 *
 * 语料从哪来（按优先级）：
 *   1. `--corpus <dir>` 指定的目录
 *   2. `.anchor-corpus/`（scripts/fetch-corpus.mjs 下载的）
 *   3. 本机真实安装（$DSH_BASE / profiles 下解析）
 * 三者都没有就报「无可用语料」并退出 0（除非给了 --strict）。
 *
 * 用法：
 *   node scripts/verify-anchors.mjs                     # 用本地语料/本机安装
 *   node scripts/verify-anchors.mjs --corpus .anchor-corpus
 *   node scripts/verify-anchors.mjs --strict            # 没有语料也算失败
 *   node scripts/verify-anchors.mjs --offline-ok        # CI 里允许没有语料（跳过）
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

/** 补丁 file 键 → 包内相对路径。新增包时只改这张表。 */
const TARGETS = {
  "agent-instructions": [["dsh-agent-instructions", "lib/index.js"]],
  "agent-instructions-bootstrap": [["dsh-agent-instructions", "lib/bootstrap.js"]],
  "web-app": [["dsh-web-app", "cordis.patch.yml"]],
  "web-app-lib": [["dsh-web-app", "lib/index.js"]],
  "harness-dev-context": [["dsh-harness-dev-context", "lib/index.js"]],
  "working-directory": [["dsh-working-directory", "lib/index.js"]],
  headless: [["dsh-headless", "cordis.patch.yml"]],
  "agent-preset": [["dsh-web-app", "presets/standard.patch.yml"]],
  "user-approval": [["dsh-user-approval", "lib/types/index.js"]],
  "user-approval-code": [["dsh-user-approval", "lib/index.js"]],
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

/**
 * 语料目录约定：`<corpus>/<包名>/<相对路径>`。
 * fetch-corpus.mjs 会按这个形状铺开；手放也一样能用。
 */
function corpusText(corpusDir, pkg, rel) {
  if (!corpusDir) return null;
  const bases = [
    path.join(corpusDir, pkg),
    path.join(corpusDir, "@deepseek-ai", pkg),
    path.join(corpusDir, "node_modules", "@deepseek-ai", pkg),
  ];
  for (const base of bases) {
    const fp = path.join(base, rel);
    if (fs.existsSync(fp)) return fs.readFileSync(fp, "utf8");
  }
  return null;
}

function liveAiBase() {
  const env = String(process.env.DSH_BASE || "").trim();
  if (env && fs.existsSync(env)) return env;
  return "";
}
function liveText(aiBase, pkg, rel) {
  if (!aiBase) return null;
  const fp = path.join(aiBase, pkg, rel);
  return fs.existsSync(fp) ? fs.readFileSync(fp, "utf8") : null;
}

function matches(pat, s) {
  if (typeof pat === "string") return s.includes(pat);
  const re = new RegExp(pat.source, pat.flags.replace(/[gy]/g, ""));
  return re.test(s);
}
function applyOnce(pat, repl, s) {
  if (typeof pat === "string") return s.replace(pat, repl);
  return s.replace(new RegExp(pat.source, pat.flags.replace("g", "")), repl);
}

const corpusDir = opt("--corpus") || path.join(root, ".anchor-corpus");
const hasCorpus = fs.existsSync(corpusDir) && fs.readdirSync(corpusDir).length > 0;
const aiBase = liveAiBase();

const { ALL_PATCHES } = await import(new URL("../lib/core.js", import.meta.url).href);

if (!hasCorpus && !aiBase) {
  const msg = "verify-anchors: 没有可用语料（既没有 .anchor-corpus/，也没有 DSH_BASE），跳过锚点体检";
  console.log(msg);
  console.log("  先用 dsh 装一份宿主，或跑 node scripts/fetch-corpus.mjs 拉语料");
  process.exit(strict ? 1 : 0);
}

const read = (pkg, rel) => corpusText(hasCorpus ? corpusDir : "", pkg, rel) ?? liveText(aiBase, pkg, rel);

const rows = [];
for (const p of ALL_PATCHES) {
  const keys = Array.isArray(p.file) ? p.file : [p.file];
  const files = [];
  const missingKeys = [];
  for (const k of keys) {
    const entries = TARGETS[k];
    if (!entries) { missingKeys.push(`${k}(unmapped)`); continue; }
    let found = false;
    for (const [pkg, rel] of entries) {
      const t = read(pkg, rel);
      if (t === null) continue;
      found = true;
      files.push({ key: k, pkg, rel, text: t });
    }
    if (!found) missingKeys.push(k);
  }
  const detail = [];
  for (const [i, rep] of (p.replacements ?? []).entries()) {
    const hit = files.some((f) => matches(rep.pattern, f.text));
    let idem = true;
    if (hit) {
      const src = files.find((f) => matches(rep.pattern, f.text)).text;
      const once = applyOnce(rep.pattern, String(rep.replace ?? ""), src);
      if (once !== src) idem = applyOnce(rep.pattern, String(rep.replace ?? ""), once) === once;
    }
    detail.push({ i, hit, idem });
  }
  const total = detail.length;
  const hit = detail.filter((d) => d.hit).length;
  const nonIdem = detail.filter((d) => !d.idem).length;
  rows.push({
    id: p.id,
    name: p.name,
    optional: !!p.optional,
    total,
    hit,
    nonIdem,
    missingKeys,
    // 一条也打不中且不是 optional：真失锚，需要修。
    status: total === 0 ? "no-rules"
      : nonIdem > 0 ? "NON-IDEMPOTENT"
        : hit === 0 ? (p.optional ? "optional-miss" : "LOST")
          : hit < total ? "partial"
            : "OK",
  });
}

rows.sort((a, b) => a.id - b.id);
const counts = {};
for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;

console.log(`verify-anchors: ${rows.length} patches`);
console.log(`  corpus: ${hasCorpus ? corpusDir : "(none)"}  live: ${aiBase || "(none)"}`);
console.log(`  ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join("  ")}`);

const bad = rows.filter((r) => r.status === "LOST" || r.status === "NON-IDEMPOTENT");
for (const r of rows) {
  if (r.status === "OK" || r.status === "optional-miss") continue;
  console.log(`  ${r.status.padEnd(15)} #${r.id} ${r.name} hit=${r.hit}/${r.total}${r.missingKeys.length ? " missing=" + r.missingKeys.join(",") : ""}`);
}

if (bad.length > 0) {
  console.error(`\nverify-anchors: ${bad.length} 条补丁在目标版本上失锚或不幂等，需要重锚`);
  process.exit(1);
}
console.log("\nverify-anchors: OK");
