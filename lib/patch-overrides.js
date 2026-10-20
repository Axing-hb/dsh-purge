/**
 * 补丁重锚表：按 dsh 版本分组的 0.2.1-rc.2 适配覆盖。
 *
 * 每个 group-*.js 导出：
 *   OVERRIDES      按 id 覆盖 lib/core.js 里同名补丁（整体替换 replacements / file / markers）
 *   EXTRA_PATCHES  新增补丁（id 不在 core.js 里时）
 *
 * 文件名带版本前缀，方便以后再加 group-e.js 适配 0.2.2。
 * 所有 pattern 都保留 0.2.0 的旧串，再接 0.2.1 的新串，做成多代替换链：
 * 双版本都能命中，升级后旧锚点自动跳过。
 */

import { OVERRIDES as A_OVERRIDES, EXTRA_PATCHES as A_EXTRA } from "./patches/group-a-021.js";
import { OVERRIDES as B_OVERRIDES, EXTRA_PATCHES as B_EXTRA } from "./patches/group-b-021.js";
import { OVERRIDES as C_OVERRIDES, EXTRA_PATCHES as C_EXTRA } from "./patches/group-c-021.js";
import { OVERRIDES as D_OVERRIDES, EXTRA_PATCHES as D_EXTRA } from "./patches/group-d-021.js";

export const OVERRIDES = {
  ...A_OVERRIDES,
  ...B_OVERRIDES,
  ...C_OVERRIDES,
  ...D_OVERRIDES,
};

export const EXTRA_PATCHES = [
  ...A_EXTRA,
  ...B_EXTRA,
  ...C_EXTRA,
  ...D_EXTRA,
];

/**
 * 把覆盖表与 extras 合进基础补丁数组（保持原顺序，extras 追加在后）。
 *
 * 两个合并细节：
 * - 覆盖是浅合并 `{...patch, ...o}`，但 `markers` / `replacements` / `file` 这类
 *   数组字段覆盖时是**整体替换**，不是拼接 —— 别指望保留 core 里的旧串。
 * - `markers` 被覆盖成空数组时顺手把 `markersAny` 关掉。空的 markers 配
 *   markersAny 无害（判断遇空数组直接跳过），但留着会让后来读代码的人以为
 *   "这里应该有多标记"，白白多查一遍。
 */
export function mergeOverrides(base) {
  const out = base.map((patch) => {
    const o = OVERRIDES[patch.id];
    if (o === undefined) return patch;
    const merged = { ...patch, ...o };
    if (Array.isArray(o.markers) && o.markers.length === 0 && o.markersAny === undefined) {
      merged.markersAny = false;
    }
    return merged;
  });
  const have = new Set(out.map((p) => p.id));
  for (const extra of EXTRA_PATCHES) {
    if (have.has(extra.id)) continue;
    out.push(extra);
    have.add(extra.id);
  }
  return out;
}
