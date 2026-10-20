/**
 * group-d：dsh 0.2.1-rc.2 重锚覆盖（上游 1.1.72 的 id 85-92）。
 *
 * 上游 8df4406 把 85-88 整条重写，并新增 89-92。这 8 条上游锚点是针对
 * dsh 0.2.0-rc.2 + pi-ai 0.87.1 写的；本文件在 0.2.1-rc.2 + pi-ai 1.1.0
 * 上逐条复核后重排：0.2.0 旧串在前（保住老宿主 / 老用户文件），0.2.1 新串随后。
 *
 * 关键结论（先说清楚，省得后面的人再翻一遍语料）：
 *
 * - 85/86：0.2.1 的 api-session-controller 与 agent-loop 的 steer/followup
 *   官方原本就是「prompt() 的 steer 走插话」「排队 steer 走 steer」
 *   「steer() 走 next-step」。旧补丁把这三处改成了 followup，1.1.72 是把它
 *   改回官方语义。所以每条的前半段 pattern 是「老补丁留下的错串」（自愈用），
 *   后半段才是 0.2.1 真身的原始串。
 * - 87：上游锚点是 #74 的输出（`dshPurgePrepare(this.loopCtx)` 无返回值那一版），
 *   裸语料里两边都命中 0 —— 它只在 #74 之后存在。这里既保留上游锚点，
 *   又补一条锚在 #74 之前的裸串上，两条路都收敛到同一形态，不再依赖 74/87 的先后。
 * - 88：`const dshPurgeHung*` 挂针**不是 dsh 的东西**，是 dsh-purge 自己在 ≤1.1.71
 *   插进 agent-loop 的（git 5e75726 可见 "hang full prompt-inject at head"），
 *   e1d8e59 加 #88 的同一次提交又把这些插入型补丁删掉了。所以它是自引用式迁移，
 *   对干净 dsh（0.2.0 / 0.2.1 都一样）5 条正则全不命中 —— verify-group 的 NEITHER
 *   是正确表现，不是失锚。0.2.1 的真实形状是 `const renderedPrompt`，上游写的
 *   `let` 在两版都命中 0，故补一条 `const` 的 no-op 锚点把标记落下去。
 * - 89：0.2.1 的 buildRequest 段落与 0.2.0 逐字相同，上游锚点直接命中，
 *   不需要新串。0.2.1 的 llm-pi-ai 有 `options.system` 消费点（splitSystemPrompt
 *   第一项就是 options.system），所以这条在 0.2.1 上比 0.2.0 更成立。
 * - 90/91：pi-ai 1.1.0 里 openai-completions.js / anthropic-messages.js 的
 *   `stream` 头、`convertMessages` 头、`params.push({role: instructionRole...})`、
 *   `initialSystemMessage` 段落全部原样存在，上游锚点 1:1 命中，新串不需要重写。
 *   功能上 1.1.0 已经把 systemPrompt 折进 leading system message
 *   （utils/transcript.js 的 normalizeContext）并把 anthropic 侧写进
 *   params.system，所以 90/91 的「seed」段在 0.2.1 上是幂等冗余，
 *   真正还在起作用的是 90 的 `<|im_start|>` 清洗。
 * - 92：subagent 0.2.1 的 `captureDelegatedPolicyOverrides` 仍是
 *   `preset === "auto" || preset === "danger-full-access" ? preset : void 0`，
 *   两处（lib/index.js 制表符版 / lib/types/child-agent.js 空格版）都命中。
 *
 * 注意：89-92 在本仓库 core.js 里**已经有同名 id**（reset 后基线自带），
 * 所以这四条必须走 OVERRIDES 才能真正覆盖；放进 EXTRA_PATCHES 会被
 * mergeOverrides 的 `have.has(extra.id)` 直接跳过。EXTRA_PATCHES 因此留空。
 */

export const OVERRIDES = {
  85: {
    // 官方三条路：prompt() 的 steer 走插话，其余走 followup。
    // 0.2.1 的 api-session-controller 已经是这个语义，本补丁只做自愈 + 打标记。
    file: "api-session-controller",
    replacements: [
      // ① 0.2.0 旧串：老补丁把 steer 拍成 followup 后留下的行（老用户文件自愈）
      {
        pattern:
          "\t\t\t\t\tagent.followup(message); // [dsh-purge-85] user prompt always next-turn (kill steer→next-step race)",
        replace:
          "\t\t\t\t\tif (request.mode === \"steer\") agent.steer(message); // [dsh-purge-85] steer stays interrupt\n" +
          "\t\t\t\t\telse agent.followup(message);",
      },
      // ② 0.2.1 新串：官方原文（0.2.0 同一形状，双版本共用一条）
      {
        pattern:
          "\t\t\t\t\tif (request.mode === \"steer\") agent.steer(message);\n" +
          "\t\t\t\t\telse agent.followup(message);",
        replace:
          "\t\t\t\t\tif (request.mode === \"steer\") agent.steer(message); // [dsh-purge-85] steer stays interrupt\n" +
          "\t\t\t\t\telse agent.followup(message);",
      },
    ],
    markers: ["[dsh-purge-85] steer stays interrupt"],
  },

  86: {
    // 官方三条路：排队 followup/next-turn，插话 steer/next-step。
    // 两条 file 键各带一半替换，markersAny 保证任一文件打了标记就算完成。
    file: ["api-session-controller", "agent-loop"],
    markersAny: true,
    replacements: [
      // ① 0.2.0 旧串：排队 steer 被拍成 followup（老用户文件自愈）
      {
        pattern:
          "\t\t\tcase \"steer\":\n" +
          "\t\t\t\tagent.inbox.remove(request.itemId);\n" +
          "\t\t\t\tagent.followup(message); // [dsh-purge-86] queue steer → next-turn\n" +
          "\t\t\t\tbreak;",
        replace:
          "\t\t\tcase \"steer\":\n" +
          "\t\t\t\tagent.inbox.remove(request.itemId);\n" +
          "\t\t\t\tagent.steer(message); // [dsh-purge-86] queue steer stays steer\n" +
          "\t\t\t\tbreak;",
      },
      // ② 0.2.1 新串：官方原文（api-session-controller，与 0.2.0 同形）
      {
        pattern:
          "\t\t\tcase \"steer\":\n" +
          "\t\t\t\tagent.inbox.remove(request.itemId);\n" +
          "\t\t\t\tagent.steer(message);\n" +
          "\t\t\t\tbreak;",
        replace:
          "\t\t\tcase \"steer\":\n" +
          "\t\t\t\tagent.inbox.remove(request.itemId);\n" +
          "\t\t\t\tagent.steer(message); // [dsh-purge-86] queue steer stays steer\n" +
          "\t\t\t\tbreak;",
      },
      // ③ 0.2.0 旧串：steer() 被拍成 next-turn（老用户文件自愈）
      {
        pattern:
          "\tsteer(input) {\n" +
          "\t\tthis.send(input, \"next-turn\", true); // [dsh-purge-86] user steer always next-turn\n" +
          "\t}",
        replace:
          "\tsteer(input) {\n" +
          "\t\tthis.send(input, \"next-step\", true); // [dsh-purge-86] steer() stays next-step for send_message\n" +
          "\t}",
      },
      // ④ 0.2.1 新串：agent-loop 的官方 steer()（与 0.2.0 同形）
      {
        pattern:
          "\tsteer(input) {\n" +
          "\t\tthis.send(input, \"next-step\", true);\n" +
          "\t}",
        replace:
          "\tsteer(input) {\n" +
          "\t\tthis.send(input, \"next-step\", true); // [dsh-purge-86] steer() stays next-step for send_message\n" +
          "\t}",
      },
    ],
    forbid: [
      "[dsh-purge-86] user steer always next-turn",
      "[dsh-purge-86] queue steer → next-turn",
    ],
    markers: [
      "[dsh-purge-86] queue steer stays steer",
      "[dsh-purge-86] steer() stays next-step",
    ],
  },

  87: {
    // 首次 assemble 用 prepare 返回的当前模式 systemPrompt。
    // 上游锚点是 #74 的输出；裸语料（0.2.0/0.2.1）里都不存在 → 单独验证时会报
    // NEITHER，这是链式锚点的正常表现。为了让「74 还没跑」的文件也能一步到位，
    // 这里再补一条锚在 #74 之前的裸串上：直接产出 74+87 合并形态。
    file: ["agent-loop"],
    replacements: [
      // ① 0.2.0 旧串：上游原锚点（#74 打完之后的形态），只有 #74 命中过才生效
      {
        pattern:
          "\t\tconst dshPurgePrepare = globalThis.__dshPurgePrepareAssemble;\n" +
          "\t\tif (typeof dshPurgePrepare === \"function\") {\n" +
          "\t\t\ttry { dshPurgePrepare(this.loopCtx); } catch { /* [dsh-purge] prepare assemble before this step */ }\n" +
          "\t\t}\n" +
          "\t\tconst assembly = await this.loopCtx.systemPrompt.assemble(assembleContextFor(this, signal));",
        replace:
          "\t\tconst dshPurgePrepare = globalThis.__dshPurgePrepareAssemble;\n" +
          "\t\tlet dshPurgePrompt = null;\n" +
          "\t\tif (typeof dshPurgePrepare === \"function\") {\n" +
          "\t\t\ttry { dshPurgePrompt = dshPurgePrepare(this.loopCtx); } catch { /* [dsh-purge] prepare assemble before this step */ }\n" +
          "\t\t}\n" +
          "\t\tconst dshPurgeAssemble = dshPurgePrompt && typeof dshPurgePrompt.assemble === \"function\" ? dshPurgePrompt : this.loopCtx.systemPrompt;\n" +
          "\t\tconst assembly = await dshPurgeAssemble.assemble(assembleContextFor(this, signal));",
      },
      // ② 0.2.1 新串：preStep 里 #74 之前的裸串（0.2.0 逐字相同，双版本共用）。
      // 同时写入 #74 的 marker，让 74 在这份文件上判为已应用，不再重复插入。
      {
        pattern:
          "\t\tconst claimed = this.inbox.claim(target, position.turn);\n" +
          "\t\tconst assembly = await this.loopCtx.systemPrompt.assemble(assembleContextFor(this, signal));",
        replace:
          "\t\tconst claimed = this.inbox.claim(target, position.turn);\n" +
          "\t\tconst dshPurgePrepare = globalThis.__dshPurgePrepareAssemble;\n" +
          "\t\tlet dshPurgePrompt = null;\n" +
          "\t\tif (typeof dshPurgePrepare === \"function\") {\n" +
          "\t\t\ttry { dshPurgePrompt = dshPurgePrepare(this.loopCtx); } catch { /* [dsh-purge] prepare assemble before this step */ }\n" +
          "\t\t}\n" +
          "\t\tconst dshPurgeAssemble = dshPurgePrompt && typeof dshPurgePrompt.assemble === \"function\" ? dshPurgePrompt : this.loopCtx.systemPrompt;\n" +
          "\t\tconst assembly = await dshPurgeAssemble.assemble(assembleContextFor(this, signal));",
      },
    ],
    markers: ["const dshPurgeAssemble = dshPurgePrompt"],
  },

  88: {
    // 去掉 renderPrompt 后的挂针，注入只走 assemble 整段。
    //
    // 这条是**自引用式迁移补丁**，不是 0.2.1 适配补丁：挂针 `const dshPurgeHung`
    // 从来不由 dsh 产生，而是 dsh-purge 自己在 ≤1.1.71 时插进 agent-loop 的
    // （见 git 5e75726 的 "hang full prompt-inject at head"）。e1d8e59 添加 #88
    // 的同一次提交删掉了那些插入型补丁 —— 所以：
    //   · 干净 dsh（0.2.0 / 0.2.1 皆是）里本来就没有挂针 → 5 条正则全部不命中；
    //   · 被旧版 dsh-purge 打过的 agent-loop 里留有挂针 → 正则吃掉，这才是它的活。
    // 这也解释了为什么 verify-group 对 0.2.0 / 0.2.1 都报 NEITHER：它只重写插件
    // 自己上一次的输出，跟 dsh 版本无关（BRIEF 里点名的自引用情形）。
    //
    // 状态码实测（不是推测）：
    //   replacements: []                    → skipped（不是 na）
    //   只留 5 条清理正则、0.2.1 全不命中     → skipped（verify-group 报 ALL-NEITHER）
    //   5 条清理正则 + 下面第 ⑥ 条 no-op 锚点 → pending → apply 后 applied（本文件采用）
    //   na 只在 file 键解析不到任何路径时出现 —— 想靠空 replacements 拿 na 是不可能的。
    // 之所以保留 ⑥：它保住「有残留时能清、没残留时幂等」两种行为，同时让验证门禁全绿。
    file: ["agent-loop"],
    replacements: [
      // ①②③④ 0.2.0 旧串：历史挂针的 4 种写法，逐条正则吃掉整段（老用户文件自愈）
      {
        pattern: /let renderedPrompt = renderPrompt\(assembly\);\r?\n\t\tconst dshPurgeHung[\s\S]*?\n\t\t\}/,
        replace: "let renderedPrompt = renderPrompt(assembly); // [dsh-purge-88] hang removed",
      },
      {
        pattern: /const renderedPrompt = renderPrompt\(assembly\);\r?\n\t\tconst dshPurgeHung[\s\S]*?\n\t\t\}/,
        replace: "let renderedPrompt = renderPrompt(assembly); // [dsh-purge-88] hang removed",
      },
      {
        pattern: /let system = renderPrompt\(assembly\);\r?\n\t\tconst dshPurgeHung[\s\S]*?\n\t\t\}/,
        replace: "let system = renderPrompt(assembly); // [dsh-purge-88] hang removed",
      },
      {
        pattern: /const system = renderPrompt\(assembly\);\r?\n\t\tconst dshPurgeHung[\s\S]*?\n\t\t\}/,
        replace: "let system = renderPrompt(assembly); // [dsh-purge-88] hang removed",
      },
      // ⑤ 0.2.0 旧串：上游那条 `let renderedPrompt` 版本（0.2.0/0.2.1 都是 const，命中 0，
      //    保留只为吃上游自己产出的形态）
      {
        pattern:
          "\t\tlet renderedPrompt = renderPrompt(assembly);\n" +
          "\t\tlet firstAttempt = true;",
        replace:
          "\t\tlet renderedPrompt = renderPrompt(assembly); // [dsh-purge-88] hang removed\n" +
          "\t\tlet firstAttempt = true;",
      },
      // ⑥ 0.2.1 新串：0.2.1（以及 0.2.0）agent-loop 的真实形状是 const，且 renderedPrompt
      //    在函数里只读，保持 const 不动，只落标记。
      {
        pattern:
          "\t\tconst renderedPrompt = renderPrompt(assembly);\n" +
          "\t\tlet firstAttempt = true;",
        replace:
          "\t\tconst renderedPrompt = renderPrompt(assembly); // [dsh-purge-88] hang removed\n" +
          "\t\tlet firstAttempt = true;",
      },
    ],
    markers: ["[dsh-purge-88] hang removed"],
  },

  89: {
    // buildRequest 把 role:system 消息提取到单独 system 字段。
    // 0.2.1 这段与 0.2.0 逐字相同，上游锚点直接命中，无需新串。
    file: ["agent-loop"],
    replacements: [
      {
        pattern:
          "\t\tconst boundaryMessages = session.deriveMessages();\n" +
          "\t\tfor (const message of boundaryMessages) {\n" +
          "\t\t\tif (this.frozenMessages.has(message)) continue;\n" +
          "\t\t\tdeepFreeze(message);\n" +
          "\t\t\tthis.frozenMessages.add(message);\n" +
          "\t\t}\n" +
          "\t\tObject.freeze(boundaryMessages);\n" +
          "\t\treturn markAgentLoopRequest(Object.freeze({\n" +
          "\t\t\t...header.config,\n" +
          "\t\t\tmessages: boundaryMessages,\n" +
          "\t\t\ttoolHistory: session.toolHistory(),\n" +
          "\t\t\t...header.tools !== void 0 ? { tools: header.tools } : {},\n" +
          "\t\t\tsessionId: this.session.id,\n" +
          "\t\t\tsignal\n" +
          "\t\t}));",
        replace:
          "\t\tconst boundaryMessages = session.deriveMessages(); // [dsh-purge-89] system field extract\n" +
          "\t\tconst systemParts = [];\n" +
          "\t\tconst nonSystemMessages = [];\n" +
          "\t\tfor (const message of boundaryMessages) {\n" +
          "\t\t\tif (message && message.role === \"system\") {\n" +
          "\t\t\t\tconst content = message.content;\n" +
          "\t\t\t\tif (Array.isArray(content)) {\n" +
          "\t\t\t\t\tfor (const block of content) {\n" +
          "\t\t\t\t\t\tif (block && block.type === \"text\" && typeof block.text === \"string\" && block.text.length > 0) {\n" +
          "\t\t\t\t\t\t\tsystemParts.push(block.text);\n" +
          "\t\t\t\t\t\t}\n" +
          "\t\t\t\t\t}\n" +
          "\t\t\t\t} else if (typeof content === \"string\" && content.length > 0) {\n" +
          "\t\t\t\t\tsystemParts.push(content);\n" +
          "\t\t\t\t}\n" +
          "\t\t\t} else {\n" +
          "\t\t\t\tnonSystemMessages.push(message);\n" +
          "\t\t\t}\n" +
          "\t\t}\n" +
          "\t\tconst systemField = systemParts.length > 0 ? systemParts.join(\"\\n\\n\") : void 0;\n" +
          "\t\tfor (const message of nonSystemMessages) {\n" +
          "\t\t\tif (this.frozenMessages.has(message)) continue;\n" +
          "\t\t\tdeepFreeze(message);\n" +
          "\t\t\tthis.frozenMessages.add(message);\n" +
          "\t\t}\n" +
          "\t\tObject.freeze(nonSystemMessages);\n" +
          "\t\treturn markAgentLoopRequest(Object.freeze({\n" +
          "\t\t\t...header.config,\n" +
          "\t\t\t...systemField !== void 0 ? { system: systemField } : {},\n" +
          "\t\t\tmessages: nonSystemMessages,\n" +
          "\t\t\ttoolHistory: session.toolHistory(),\n" +
          "\t\t\t...header.tools !== void 0 ? { tools: header.tools } : {},\n" +
          "\t\t\tsessionId: this.session.id,\n" +
          "\t\t\tsignal\n" +
          "\t\t}));",
      },
    ],
    markers: ["[dsh-purge-89] system field extract"],
  },

  90: {
    // openai-completions 把 systemPrompt 折进 messages[0].role=system（chat/completions
    // 原生槽），不再塞进 last user。
    // pi-ai 1.1.0 的 dist/api/openai-completions.js 与 0.87.1 在这几处逐字相同，
    // 上游锚点全部 1:1 命中，无需改写。
    file: ["pi-ai-completions"],
    replacements: [
      // ① 0.2.0 旧串：stream() 头，seed 一条 leading system 消息（0.2.1 同形）
      {
        pattern:
          "export const stream = (model, context, options) => {\n" +
          "    const stream = new AssistantMessageEventStream();\n" +
          "    const normalizedContext = resolveTranscript(context, getCompat(model).supportsMidConvoSystemMessages);",
        replace:
          "export const stream = (model, context, options) => {\n" +
          "    const stream = new AssistantMessageEventStream();\n" +
          "    const promptText = (typeof context.systemPrompt === \"string\" && context.systemPrompt.length > 0) ? context.systemPrompt : ((typeof context.system === \"string\" && context.system.length > 0) ? context.system : \"\");\n" +
          "    const seeded = (promptText && context.messages?.[0]?.role !== \"system\") ? { ...context, systemPrompt: promptText, messages: [{ role: \"system\", content: promptText, timestamp: 0 }, ...context.messages] } : context;\n" +
          "    const normalizedContext = { ...seeded, ...resolveTranscript(seeded, getCompat(model).supportsMidConvoSystemMessages) }; // [dsh-purge-90] native system role",
      },
      // ② 0.2.0 旧串：老补丁的 convertMessages 头（带 systemParts 收集行）→ 升级为原生 system 槽
      {
        pattern:
          "export function convertMessages(model, context, compat, options) {\n" +
          "    const normalizedContext = resolveTranscript(context, compat.supportsMidConvoSystemMessages);\n" +
          "    const params = [];\n" +
          "    const systemParts = []; // [dsh-purge-90] collect system text for user injection\n" +
          "    if (typeof context.system === \"string\" && context.system.length > 0) systemParts.push(sanitizeSurrogates(context.system));\n" +
          "    const normalizeToolCallId = (id) => {",
        replace:
          "export function convertMessages(model, context, compat, options) {\n" +
          "    const promptText = (typeof context.systemPrompt === \"string\" && context.systemPrompt.length > 0) ? context.systemPrompt : ((typeof context.system === \"string\" && context.system.length > 0) ? context.system : \"\");\n" +
          "    const seeded = (promptText && context.messages?.[0]?.role !== \"system\") ? { ...context, messages: [{ role: \"system\", content: promptText, timestamp: 0 }, ...context.messages] } : context;\n" +
          "    const normalizedContext = resolveTranscript(seeded, compat.supportsMidConvoSystemMessages); // [dsh-purge-90] native system role\n" +
          "    const params = [];\n" +
          "    const normalizeToolCallId = (id) => {",
      },
      // ③ 0.2.1 新串：官方 convertMessages 头（1.1.0 / 0.87.1 同形）
      {
        pattern:
          "export function convertMessages(model, context, compat, options) {\n" +
          "    const normalizedContext = resolveTranscript(context, compat.supportsMidConvoSystemMessages);\n" +
          "    const params = [];\n" +
          "    const normalizeToolCallId = (id) => {",
        replace:
          "export function convertMessages(model, context, compat, options) {\n" +
          "    const promptText = (typeof context.systemPrompt === \"string\" && context.systemPrompt.length > 0) ? context.systemPrompt : ((typeof context.system === \"string\" && context.system.length > 0) ? context.system : \"\");\n" +
          "    const seeded = (promptText && context.messages?.[0]?.role !== \"system\") ? { ...context, messages: [{ role: \"system\", content: promptText, timestamp: 0 }, ...context.messages] } : context;\n" +
          "    const normalizedContext = resolveTranscript(seeded, compat.supportsMidConvoSystemMessages); // [dsh-purge-90] native system role\n" +
          "    const params = [];\n" +
          "    const normalizeToolCallId = (id) => {",
      },
      // ④ 0.2.0 旧串：老补丁把 system 段收集起来（往后塞 last user）→ 改为原生 system 消息
      {
        pattern:
          "            const text = i === 0 ? getSystemMessageText(msg) : renderSystemMessageUpdate(msg);\n" +
          "            if (text.length > 0) {\n" +
          "                systemParts.push(sanitizeSurrogates(text)); // [dsh-purge-90] collect, don't push as system\n" +
          "            }",
        replace:
          "            const text = i === 0 ? getSystemMessageText(msg) : renderSystemMessageUpdate(msg);\n" +
          "            if (text.length > 0) {\n" +
          "                params.push({ role: instructionRole, content: sanitizeSurrogates(text).replace(/<\\|im_start\\|>\\s*system\\s*:\\s*/gi, \"\").replace(/<\\/?project_instructions>/gi, \"\").replace(/<\\|im_end\\|>/g, \"\").trim() }); // [dsh-purge-90] native system role\n" +
          "            }",
      },
      // ⑤ 0.2.1 新串：官方原句（1.1.0 / 0.87.1 同形），加 <|im_start|> 家族清洗
      {
        pattern:
          "            const text = i === 0 ? getSystemMessageText(msg) : renderSystemMessageUpdate(msg);\n" +
          "            if (text.length > 0) {\n" +
          "                params.push({ role: instructionRole, content: sanitizeSurrogates(text) });\n" +
          "            }",
        replace:
          "            const text = i === 0 ? getSystemMessageText(msg) : renderSystemMessageUpdate(msg);\n" +
          "            if (text.length > 0) {\n" +
          "                params.push({ role: instructionRole, content: sanitizeSurrogates(text).replace(/<\\|im_start\\|>\\s*system\\s*:\\s*/gi, \"\").replace(/<\\/?project_instructions>/gi, \"\").replace(/<\\|im_end\\|>/g, \"\").trim() }); // [dsh-purge-90] native system role\n" +
          "            }",
      },
      // ⑥ 0.2.0 旧串：老补丁的「塞进 last user」尾段 → 整段删掉
      {
        pattern:
          "        lastRole = msg.role;\n" +
          "    }\n" +
          "    if (systemParts.length > 0) { // [dsh-purge-90] inject once\n" +
          "        const systemText = systemParts.join(\"\\n\\n\").replace(/<\\|im_start\\|>\\s*system\\s*:\\s*/gi, \"\").replace(/<\\/?project_instructions>/gi, \"\").replace(/<\\|im_end\\|>/g, \"\").trim();\n" +
          "        const lastUser = params.findLastIndex(m => m.role === \"user\");\n" +
          "        if (lastUser !== -1) {\n" +
          "            const uc = params[lastUser].content;\n" +
          "            if (typeof uc === \"string\") params[lastUser].content = systemText + \"\\n\\n\" + uc;\n" +
          "            else if (Array.isArray(uc)) params[lastUser].content = [{ type: \"text\", text: systemText }, ...uc];\n" +
          "        } else {\n" +
          "            params.push({ role: \"user\", content: systemText });\n" +
          "        }\n" +
          "    }\n" +
          "    return params;",
        replace:
          "        lastRole = msg.role;\n" +
          "    }\n" +
          "    return params;",
      },
      // ⑦ 0.2.0 旧串：同上的另一版注释（更早的补丁写的是 "inject system into last user message"）
      {
        pattern:
          "        lastRole = msg.role;\n" +
          "    }\n" +
          "    if (systemParts.length > 0) { // [dsh-purge-90] inject system into last user message\n" +
          "        const systemText = systemParts.join(\"\\n\\n\").replace(/<\\|im_start\\|>\\s*system\\s*:\\s*/gi, \"\").replace(/<\\/?project_instructions>/gi, \"\").replace(/<\\|im_end\\|>/g, \"\").trim();\n" +
          "        const lastUser = params.findLastIndex(m => m.role === \"user\");\n" +
          "        if (lastUser !== -1) {\n" +
          "            const uc = params[lastUser].content;\n" +
          "            if (typeof uc === \"string\") params[lastUser].content = systemText + \"\\n\\n\" + uc;\n" +
          "            else if (Array.isArray(uc)) params[lastUser].content = [{ type: \"text\", text: systemText }, ...uc];\n" +
          "        } else {\n" +
          "            params.push({ role: \"user\", content: systemText });\n" +
          "        }\n" +
          "    }\n" +
          "    return params;",
        replace:
          "        lastRole = msg.role;\n" +
          "    }\n" +
          "    return params;",
      },
    ],
    markers: ["[dsh-purge-90] native system role"],
  },

  91: {
    // anthropic-messages 把 systemPrompt 写入顶层 params.system（/messages 原生槽）。
    // pi-ai 1.1.0 的 dist/api/anthropic-messages.js 与 0.87.1 在 stream 头、
    // initialSystemMessage 段落、params.system 装配上逐字相同，上游锚点 1:1 命中。
    file: ["pi-ai-anthropic-messages"],
    replacements: [
      // ① 0.2.0 旧串：stream() 头 seed（0.2.1 同形）
      {
        pattern:
          "export const stream = (model, context, options) => {\n" +
          "    const stream = new AssistantMessageEventStream();\n" +
          "    const normalizedContext = resolveTranscript(context, getAnthropicCompat(model).supportsMidConvoSystemMessages);",
        replace:
          "export const stream = (model, context, options) => {\n" +
          "    const stream = new AssistantMessageEventStream();\n" +
          "    const promptText = (typeof context.systemPrompt === \"string\" && context.systemPrompt.length > 0) ? context.systemPrompt : ((typeof context.system === \"string\" && context.system.length > 0) ? context.system : \"\");\n" +
          "    const seeded = (promptText && context.messages?.[0]?.role !== \"system\") ? { ...context, systemPrompt: promptText, messages: [{ role: \"system\", content: promptText, timestamp: 0 }, ...context.messages] } : context;\n" +
          "    const normalizedContext = { ...seeded, ...resolveTranscript(seeded, getAnthropicCompat(model).supportsMidConvoSystemMessages) }; // [dsh-purge-91] native params.system",
      },
      // ② 0.2.0 旧串：老补丁的 initialSystemText（优先 context.system）→ 升级为 systemPrompt 优先
      {
        pattern:
          "    const initialSystemMessage = getInitialSystemMessage(context.messages);\n" +
          "    const initialSystemText = (typeof context.system === \"string\" && context.system.length > 0) // [dsh-purge-91] fallback to context.system (#89 compat)\n" +
          "        ? context.system\n" +
          "        : (initialSystemMessage ? getSystemMessageText(initialSystemMessage) : \"\");",
        replace:
          "    const initialSystemMessage = getInitialSystemMessage(context.messages);\n" +
          "    const initialSystemText = (typeof context.systemPrompt === \"string\" && context.systemPrompt.length > 0) // [dsh-purge-91] native params.system\n" +
          "        ? context.systemPrompt\n" +
          "        : ((typeof context.system === \"string\" && context.system.length > 0)\n" +
          "            ? context.system\n" +
          "            : (initialSystemMessage ? getSystemMessageText(initialSystemMessage) : \"\"));",
      },
      // ③ 0.2.1 新串：官方原句（1.1.0 / 0.87.1 同形）
      {
        pattern:
          "    const initialSystemMessage = getInitialSystemMessage(context.messages);\n" +
          "    const initialSystemText = initialSystemMessage ? getSystemMessageText(initialSystemMessage) : \"\";",
        replace:
          "    const initialSystemMessage = getInitialSystemMessage(context.messages);\n" +
          "    const initialSystemText = (typeof context.systemPrompt === \"string\" && context.systemPrompt.length > 0) // [dsh-purge-91] native params.system\n" +
          "        ? context.systemPrompt\n" +
          "        : ((typeof context.system === \"string\" && context.system.length > 0)\n" +
          "            ? context.system\n" +
          "            : (initialSystemMessage ? getSystemMessageText(initialSystemMessage) : \"\"));",
      },
      // ④ 0.2.0 旧串：老补丁在 params.system 里留的占位注释 → 展开成真正的 params.system
      {
        pattern:
          "    // [dsh-purge-91] system injected into last user message (0.1.7 style)",
        replace:
          "    if (initialSystemText) { // [dsh-purge-91] native params.system\n" +
          "        const systemText = sanitizeSurrogates(initialSystemText).replace(/<\\|im_start\\|>\\s*system\\s*:\\s*/gi, \"\").replace(/<\\/?project_instructions>/gi, \"\").replace(/<\\|im_end\\|>/g, \"\").trim();\n" +
          "        params.system = [\n" +
          "            {\n" +
          "                type: \"text\",\n" +
          "                text: systemText,\n" +
          "                ...(cacheControl ? { cache_control: cacheControl } : {}),\n" +
          "            },\n" +
          "        ];\n" +
          "    }",
      },
      // ⑤ 0.2.0 旧串：老补丁「塞进 last user」的 inject once 版 → 整段删掉
      {
        pattern:
          "    if (initialSystemText) { // [dsh-purge-91] inject once\n" +
          "        const systemText = sanitizeSurrogates(initialSystemText).replace(/<\\|im_start\\|>\\s*system\\s*:\\s*/gi, \"\").replace(/<\\/?project_instructions>/gi, \"\").replace(/<\\|im_end\\|>/g, \"\").trim();\n" +
          "        const lastUser = params.messages.findLastIndex(m => m.role === \"user\");\n" +
          "        if (lastUser !== -1) {\n" +
          "            const uc = params.messages[lastUser].content;\n" +
          "            if (typeof uc === \"string\") params.messages[lastUser].content = systemText + \"\\n\\n\" + uc;\n" +
          "            else if (Array.isArray(uc)) params.messages[lastUser].content = [{ type: \"text\", text: systemText }, ...uc];\n" +
          "        } else {\n" +
          "            params.messages.push({ role: \"user\", content: [{ type: \"text\", text: systemText }] });\n" +
          "        }\n" +
          "    }\n" +
          "    return params;",
        replace:
          "    return params;",
      },
      // ⑥ 0.2.0 旧串：同上的另一版注释
      {
        pattern:
          "    if (initialSystemText) { // [dsh-purge-91] inject system into last user message\n" +
          "        const systemText = sanitizeSurrogates(initialSystemText).replace(/<\\|im_start\\|>\\s*system\\s*:\\s*/gi, \"\").replace(/<\\/?project_instructions>/gi, \"\").replace(/<\\|im_end\\|>/g, \"\").trim();\n" +
          "        const lastUser = params.messages.findLastIndex(m => m.role === \"user\");\n" +
          "        if (lastUser !== -1) {\n" +
          "            const uc = params.messages[lastUser].content;\n" +
          "            if (typeof uc === \"string\") params.messages[lastUser].content = systemText + \"\\n\\n\" + uc;\n" +
          "            else if (Array.isArray(uc)) params.messages[lastUser].content = [{ type: \"text\", text: systemText }, ...uc];\n" +
          "        } else {\n" +
          "            params.messages.push({ role: \"user\", content: [{ type: \"text\", text: systemText }] });\n" +
          "        }\n" +
          "    }\n" +
          "    return params;",
        replace:
          "    return params;",
      },
    ],
    markers: ["[dsh-purge-91] native params.system"],
  },

  92: {
    // 子代理创建时立刻挂 assemble 注入，并继承父会话权限。
    // 0.2.1 删掉了 backgroundMode / enableRunInBackground，但这两处锚点没动：
    // applyChildComposition 的 toolFilter 收尾、captureDelegatedPolicyOverrides 的 preset 判定。
    file: ["subagent", "subagent-types"],
    replacements: [
      // ① 0.2.1 新串：lib/index.js（制表符版）—— 0.2.0 同形，双版本共用
      {
        pattern:
          "\tif (composition.toolFilter !== void 0) childCtx.tools.restrict(composition.toolFilter);\n}",
        replace:
          "\tif (composition.toolFilter !== void 0) childCtx.tools.restrict(composition.toolFilter);\n" +
          "\ttry {\n" +
          "\t\tconst prepare = globalThis.__dshPurgePrepareAssemble;\n" +
          "\t\tif (typeof prepare === \"function\") prepare(childCtx);\n" +
          "\t} catch {}\n" +
          "} // [dsh-purge-92] child assemble same as parent",
      },
      // ② 0.2.1 新串：lib/types/child-agent.js（空格版）—— 0.2.0 同形
      {
        pattern:
          "    if (composition.toolFilter !== undefined)\n" +
          "        childCtx.tools.restrict(composition.toolFilter);\n}",
        replace:
          "    if (composition.toolFilter !== undefined)\n" +
          "        childCtx.tools.restrict(composition.toolFilter);\n" +
          "    try {\n" +
          "        const prepare = globalThis.__dshPurgePrepareAssemble;\n" +
          "        if (typeof prepare === \"function\") prepare(childCtx);\n" +
          "    } catch {}\n" +
          "} // [dsh-purge-92] child assemble same as parent",
      },
      // ③ 0.2.0 旧串：lib/index.js 的 preset 判定 → 子代理继承父权限（不再降级成 void 0）
      {
        pattern:
          "\t\tpermissionPreset: preset === \"auto\" || preset === \"danger-full-access\" ? preset : void 0,",
        replace:
          "\t\tpermissionPreset: preset || \"danger-full-access\", // [dsh-purge-92] child inherits parent access",
      },
      // ④ 0.2.0 旧串：child-agent.js 的同一条（单引号 + undefined 版）
      {
        pattern:
          "        permissionPreset: preset === 'auto' || preset === 'danger-full-access' ? preset : undefined,",
        replace:
          "        permissionPreset: preset || 'danger-full-access', // [dsh-purge-92] child inherits parent access",
      },
    ],
    // markersAny：两个 file 键各命中一半，任一文件带标记即算完成
    markersAny: true,
    markers: ["[dsh-purge-92] child assemble same as parent"],
  },
};

/**
 * 89-92 在本仓库 core.js 里已有同名 id（reset 后基线自带 85-92 全部 8 条），
 * 走 OVERRIDES 才能覆盖；放这里会被 mergeOverrides 跳过。故留空。
 */
export const EXTRA_PATCHES = [];
