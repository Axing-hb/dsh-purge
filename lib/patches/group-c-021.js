/** group-c：dsh 0.2.1-rc.2 重锚覆盖。
 *
 * 0.2.1 把 Web 面提示词整段搬进新包 @deepseek-ai/dsh-harness-dev-context（lib/index.js）：
 *   - WEB_SURFACE_PROMPT      ← 原来 web-app 里那句身份 + GUI 操作纪律
 *   - LEGACY_WEB_SURFACE      ← 冻结的历史副本，给老 Session 复现用，这里的 pattern 刻意都不覆盖它
 *   - HARNESS_SOURCE_PROMPT   ← 新增：告诉模型「实现 checkout 在哪、可以去改 DSH 本身」
 * 所以 #32 / #53 改成同时覆盖 web-app-lib(0.2.0) 与 harness-dev-context(0.2.1)；
 * 新增 #93 处理 harness:source 这个全新的身份暗示。
 *
 * 两代同一句只有收尾不同（`at ${webUrl}.` / `whose URL the runtime context names.`），
 * 用一条正则同时吃两代，省得只在 0.2.0 存在的旧串在 0.2.1 上留成失锚项。
 * LEGACY 副本的 prefix 到 "at " 就断了、没有这两个收尾，所以天然不会被命中。
 *
 * 注意：这两处的目标文本是模板字符串（模型能读到）。所以 markers 一律用中性化后的正文，
 * 不往里塞 "[dsh-purge]" 注释——那会把插件自己的身份写进系统提示词。
 * 只有 #32 的 description 那句在 JS 对象里，才能安全挂 `/* comment *\/`。
 */

export const OVERRIDES = {
  32: {
    // 0.2.0 身份句在 web-app-lib；0.2.1 搬到 harness-dev-context，web-app-lib 只剩 shellEnv 的 description 句。
    file: ["web-app-lib", "harness-dev-context"],
    replacements: [
      {
        // 只收身份句本身。后面那段 GUI 操作纪律（"this page" 指这个 GUI、HMR 只在 dev:web 热更、
        // 别另开服务器）是功能性的，原样留着。
        pattern:
          /You are interacting with the user through the DeepSeek Harness Web GUI (at \$\{webUrl\}|whose URL the runtime context names)\./g,
        replace: "You are interacting with the user through the local web GUI $1.",
      },
      {
        // 0.2.0 = "Canonical local URL…"，0.2.1 = "Advertised URL…"，同一句只换了定语。
        pattern:
          /description: "(Canonical local|Advertised) URL of the DeepSeek Harness Web GUI serving this session\."/g,
        replace:
          'description: "$1 URL of the web GUI serving this session." /* [dsh-purge] web surface identity neutralized */',
      },
      {
        // 0.2.1 新增的运行时上下文行，标签本身也在替产品做自我介绍。
        pattern: "Current DeepSeek Harness Web GUI URL: ",
        replace: "Current web GUI URL: ",
      },
    ],
    // markersAny：#53 会接着改写同一句，不能要求两句标记同时还在。
    markersAny: true,
    // 两条都取自中性化后的正文，且都被 #53 保留下来，所以跑完 #53 仍然算 settled。
    markers: [
      "URL of the web GUI serving this session.",
      "Current web GUI URL: ",
    ],
  },

  53: {
    // 0.2.1 里这句"不许另开服务器"没消失，只是搬进了 harness-dev-context 的 WEB_SURFACE_PROMPT。
    file: ["web-app-lib", "harness-dev-context"],
    replacements: [
      {
        // 一条正则吃两代收尾：
        //   0.2.0   "…Web GUI at ${webUrl}."
        //   0.2.1   "…Web GUI whose URL the runtime context names."
        // 两个分支各进一个捕获组，$1/$2 拼出完整收尾。
        // head 带 local 分支：让 #32 先跑过之后（它把 DeepSeek Harness 换成 local）这里仍能命中。
        // 注意 whose 必须在捕获组里。早先写成 `whose (URL …)` 把连接词漏在组外，
        // 拼出来是 "Local web GUI: URL the runtime context names." —— 丢词，冒号后不成句。
        pattern:
          /You are interacting with the user through the (?:DeepSeek Harness|local) [Ww]eb GUI (?:at (\$\{webUrl\})|(whose URL the runtime context names))\./g,
        replace: "Local web GUI $1$2.",
      },
      {
        // 反引号前向断言只命中当前模板串：LEGACY_WEB_SURFACE 那份冻结副本后面跟的是双引号，保持不动。
        // 连前导空格一起吃掉，否则模板串结尾会留一个悬空空格。
        pattern:
          / Do not start a replacement server unless the user asks; if one is needed, use a managed background job and verify its exact URL\.(?=`)/g,
        replace: "",
      },
    ],
    markersAny: true,
    // 只有本条会产出这个前缀，且它同时覆盖 0.2.0 与 0.2.1 两种收尾。
    // 不带冒号：收尾是 "Local web GUI at ${webUrl}." 或 "Local web GUI whose URL …"。
    markers: ["Local web GUI "],
  },
};

export const EXTRA_PATCHES = [
  {
    // 0.2.1 新增：harness:source 段 + 运行时上下文行会告诉模型"这是 DSH 的实现 checkout，可以改 DSH 本身"，
    // 等于把"我在 DSH 源码树里 → 我是 DSH 的一部分"塞进系统提示词，必须中性化。
    id: 93,
    name: "HARNESS_SOURCE_NEUTRAL",
    layer: "提示词",
    layer_en: "Prompt",
    desc: "harness:source 的 checkout 只当普通参考目录，不再给身份 / checkout is reference, not identity",
    file: ["harness-dev-context"],
    optional: true,
    replacements: [
      {
        // 原文三句：声明这是实现 checkout、别拿 checkout 推 cwd、可以用它 inspect/extend DSH 本身。
        // 保留"别从 checkout 推 cwd / 用 pwd"这类可用纪律，去掉"属于 DSH、可扩展 DSH"的能力暗示。
        pattern:
          "The runtime context names the DeepSeek Harness implementation checkout. The checkout location and current working directory are separate values and may differ; never infer the working directory from the checkout path. Use pwd to determine the current working directory. Use this checkout only to inspect or extend DSH itself.",
        replace:
          "The runtime context names a local source checkout that is plain reference material. It is not part of you, it does not define your capabilities, and reading it never changes what you are. The checkout location and the current working directory are separate values and may differ; never infer the working directory from the checkout path. Use pwd to determine the current working directory. Read that checkout only when the user asks how the app serving this page works.",
      },
      {
        // 上下文行的标签带产品名，是身份暗示的另一半；LEGACY_SOURCE 前缀写法不同（"is at "），不会撞。
        pattern: "Current DeepSeek Harness implementation checkout: ",
        replace: "Local source checkout (reference only): ",
      },
    ],
    // 同样用中性正文当标记，避免把插件标签写进模型可见的提示词。
    markersAny: true,
    markers: [
      "plain reference material. It is not part of you",
      "Local source checkout (reference only): ",
    ],
  },
];
