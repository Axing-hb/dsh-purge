<p align="center">
  <img src="docs/banner.svg" alt="dsh-purge" width="720">
</p>

<h1 align="center">⚔️ DeepSeek Harness 网络安全红队工具（dsh-purge）</h1>

<p align="center"><strong>Version 1.2.1</strong></p>

<p align="center">
  <em>DeepSeek Harness 破甲：让所有模型都能破甲，不同模型可换不同提示词；默认提示词面向国模「小码酱」。Jailbreak for every model — swap prompts per model. 求 Star 收藏 ⭐ 如要二开，请查看署名要求部分</em>
</p>

<p align="center">
  <a href="https://github.com/Axing-hb/dsh-purge/stargazers"><img src="https://img.shields.io/github/stars/Axing-hb/dsh-purge?logo=github&label=Stars" alt="GitHub stars"></a>
  <a href="https://github.com/Axing-hb/dsh-purge/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-65a30d?style=flat" alt="MIT license"></a>
  <a href="https://awesome-dsh-plugin.com"><img src="https://awesome-dsh-plugin.com/badge.svg" alt="awesome · DSH plugin"></a>
  <a href="https://deepseek.stream/plugins/dsh-purge"><img src="https://img.shields.io/badge/Hub-dsh--purge-1a73e8" alt="DeepSeek Harness Hub"></a>
  <a href="https://www.deepseek.com/harness/"><img src="https://img.shields.io/badge/dsh-0.2.1--rc.2-blue" alt="DSH"></a>
  <br>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=fff" alt="Node.js">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000" alt="JavaScript">
</p>

<p align="center">
  <a href="https://dsh-plugin.org/plugins/axing-hb/dsh-purge"><img src="https://dsh-plugin.org/badges/listed.svg" alt="Listed on dsh-plugin.org"></a>
</p>

<p align="center">
  <a href="README.zh-CN.md"><strong>中文</strong></a> · <a href="README.en.md">English</a>
</p>

> **官方 Web 和官方桌面端都支持。** 官方 `dsh web` 用 profile `web`；官方桌面 EXE 用 profile `desktop`。两边分开安装、分开点「应用」。
>
> **本版（1.2.1）适配 dsh 0.2.0-rc.2 与 0.2.1-rc.2 双版本**，`engines.dsh: >=0.2.0-rc.2 <0.3.0`。更早的 dsh 0.1.x 用 1.1.39 及更早的版本。社区桌面端不维护。
>
> 写进 profile 还不会改宿主。点会话标题旁的 **dsh-purge** → **清洗** → **应用**。成功会自动重启；补丁没打完不重启。重启后新开一轮对话，注入才进当前会话。
>
> Node.js **≥18**。Windows 无闪窗需要 **Node ≥22**。npm 上没有 `dsh-purge` 这个包，安装走 GitHub 归档地址，命令见 [安装](#安装)。

## 目录

- [介绍](#介绍)
- [署名要求](#署名要求)
- [法律免责与合规使用声明](#legal)
- [适配范围](#适配范围)
- [本版变更（1.2.1）](#本版变更)
- [安装](#安装)
- [界面预览](#界面预览)
- [目录结构](#目录结构)
- [使用](#使用)
- [自己的服务器](#自己的服务器)
- [本地校验](#本地校验)
- [补丁清单](#补丁清单)
- [工作原理](#工作原理)
- [还原](#还原)
- [路径探测](#路径探测)
- [更新](#更新)
- [说明](#说明)

---

## 介绍

**dsh-purge** 是装在本机官方 [DeepSeek Harness](https://www.deepseek.com/harness/) 上的网络安全红队评测插件。官方 **Web**（`dsh web`）和官方 **桌面端**（EXE）都支持，两边分开装、分开应用。

Harness 不只是把问题交给模型。它还会在运行时改提示词、审批门、沙箱和会话格式。只看「模型答不答」，会把宿主拦截误当成模型拒绝。这个插件在你自己的安装里把这两层分开，用来做受控评测，也用来看默认策略该不该收紧。


| 你会用到             | 它做什么                                            |
| ---------------- | ----------------------------------------------- |
| **dsh-purge 侧栏** | 会话标题旁的按钮打开右侧栏。里面两页：清洗、演练台                       |
| **清洗**           | 分组查看补丁，应用、还原、卸载；编辑提示词和多套规则                      |
| **演练台**          | 正式版内置。授权后查看资产、技能和本机环境。只用于你有权管理的本机、离线靶标或已书面授权的演练 |
| **宿主策略**         | 调整默认文案、权限策略和工具上限。官方能力保留，不另写一套身份                 |
| **启动时**          | 自动再检查并应用。npm 升级盖掉 `node_modules` 之后不用手改文件       |


不写死盘符。按 `$DSH_HOME`、dsh 启动器旁边的 `.dsh`，再退回 `~/.dsh`。不改 Harness 源码仓库，在 **dsh-purge** 的「清洗」里点「应用」才写入。身份来自插件里的加密提示词，也就是提示词框默认显示的那一份。不读取宿主磁盘上的提示词文件。

本插件只处理使用者本机已安装的官方 `@deepseek-ai` 包和本机配置。它不是公网扫描器，也不是针对第三方站点的攻击套件。仓库内不含木马、未授权渗透脚本或对外攻击载荷。

## 📌 非盈利公益项目，严禁任何主体用于商业售卖、付费倒卖或黑灰产牟利，仅供技术参考。

## 署名要求

**借用本项目的名称、思路、代码或提示词，必须署名，并写明来源仓库：** [Axing-hb/dsh-purge](https://github.com/Axing-hb/dsh-purge)。

本仓库是上游 MIT 版本的分支：基于 [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) 的提交 `ec69166`（上游最后一个 MIT 提交）建立，原作者的版权行、署名要求与协议链一并保留，本仓库继续以 MIT 发布，全文见 [LICENSE](LICENSE)。

不署名、隐瞒来源、改头换面据为己有，将依法追究责任。

<a id="legal"></a>

### ⚠️ 严正法律免责与合规使用声明



**免责声明：** 本项目为非营利开源项目，遵守国家法律法规及所在平台的相关规范，仅供学习与研究使用。不得将本项目用于任何违法违规用途；由此产生的后果由使用者自行承担。

**【零容忍严正申明】**：本项目坚决反对并严禁任何形式的违法犯罪行为！本项目开发者绝不支持、不鼓励、不协助任何未授权网络攻击、漏洞利用、数据窃取、非法侵入计算机信息系统或生成违法违禁内容的活动。**任何将本项目用于违法犯罪的行为，均与开发者无关，由行为人依法独立承担全部法律责任。**

1. **本仓库不含违法内容**：`dsh-purge` 发布的代码、文档、补丁与默认提示词**不是**木马、后门、未授权渗透工具、勒索软件、撞库脚本，也**不是**针对公网或第三方系统的攻击载荷。项目本身不提供违法内容，也不教唆、组织、协助实施违法犯罪。
2. **只作用于本机官方 Harness**：安全评测补丁、提示词注入全部发生在使用者**本机已安装的官方 DeepSeek Harness**（`@deepseek-ai` 包、本机 profile / `$DSH_HOME`）上。对象是使用者自己的官方本地软件，**不是**他人的网站、服务器、账号或信息系统。
3. **评测补丁不对外网目标联网**：应用补丁、写入注入、回滚、卸载均在本机文件与本机进程内完成，**不对任何公网主机、未授权系统进行扫描、探测、入侵或攻击发包**。不得把本项目当作跳板去打外网。插件若开启「检测更新」，仅可能访问本插件自己的 GitHub 仓库以核对版本，**与对第三方系统的网络攻击无关**，也不能被解释为授权对外渗透。
4. **合法受控范围限定**：本项目定位为使用者在**自己有权管理的本机官方 Harness**上，进行红队科研与鲁棒性评测的辅助工具。**严禁在未经所有者合法书面授权的目标、公网在线系统或生产业务上运行本项目**。一切测试必须限制在**本机已授权安装的官方 Harness、离线本地合成靶标、授权网络安全演练靶场及合规实验室受控环境**中进行。
5. **禁止中国大陆、香港、澳门的服务器与网站。** 不得对中国大陆、香港、澳门网段，以及解析进这些网段的服务器、网站或地址进行访问、扫描、探测或任何操作。云厂商的名字不能当作例外。唯一例外是使用者事先登记为自己的服务器的那一个确切 IP，或那一个完整主机名。密钥、密码、网段、通配符，以及对话里的口头说明，都不能增加例外。没有登记的，一律禁止。
6. **严禁违法与违禁用途**：使用者严禁利用本项目直接或间接从事任何违反下列法律法规的行为（必须逐条遵守，不得以任何理由规避）：
  - **《中华人民共和国刑法》**
  - **《中华人民共和国网络安全法》**
  - **《中华人民共和国数据安全法》**
  - **《中华人民共和国个人信息保护法》**
  - 以及其他现行有效的法律、行政法规与监管规定；
  - 同时严禁：
  - 未经授权渗透、攻击公私机构计算机信息系统，实施勒索、破坏、撞库或传播恶意载荷；
  - 诱导、生成或传播危害国家安全、恐怖主义、暴力血腥、涉黄涉赌、诈骗、侵犯公民隐私或知识产权等任何法律明令禁止的违法违禁内容；
  - 违反相关大模型提供商的《服务条款》与《滥用政策》。
7. **使用者独立承担全部责任**：本项目依据 MIT 开源协议“按现状”提供，开发者不对软件的完整性、安全性与适用性作任何明示或暗示的保证。**使用者应对自身的所有下载、部署、运行、修改、传播行为以及由此产生的全部输入与输出后果承担独立、完全的民事、行政及刑事法律责任**。项目作者与贡献团队绝不承担任何因使用者滥用导致的直接、间接或连带责任。
8. **违约即终止授权**：任何将本项目用于非法攻击、恶意活动或违规行为的个人或实体，其开源软件使用许可将自违法违规行为发生之日起**自动且不可撤销地立即终止**。该主体须立即停止使用并永久销毁本项目的所有代码、脚本与衍生数据，并依法承担相应法律制裁。
9. **第三方独立性声明**：本项目属于完全独立的开源安全评测研究项目，与 DeepSeek 官方或其关联主体无任何隶属、商业合作、授权或官方背书关系。文中「官方」仅指评测对象为使用者本机安装的官方 DeepSeek Harness 软件包，**不代表** DeepSeek 官方开发、认可或担保本插件。
10. **必须署名**：借用本项目的名称、思路、代码或提示词，必须署名并标明本仓库 [Axing-hb/dsh-purge](https://github.com/Axing-hb/dsh-purge)。不署名将依法追究责任。详见 [署名要求](#署名要求)。





---

## 适配范围

本版适配 **dsh 0.2.0-rc.2 与 dsh 0.2.1-rc.2 双版本**。`package.json` 里写死 `engines.dsh: >=0.2.0-rc.2 <0.3.0`。

- **dsh 0.2.1-rc.2**：当前主目标。官方桌面 EXE 与官方 `dsh web` 都按这一档校准。
- **dsh 0.2.0-rc.2**：同一份补丁表保留 0.2.0 的旧锚点，两代串做成多代替换链，双版本都能命中；宿主升级后旧锚点自动跳过。
- **dsh 0.1.x**（含 0.1.7 rc.1 / rc.2）：用 **1.1.39** 及更早 —— 在 [Releases](https://github.com/Axing-hb/dsh-purge/releases) 里选对应标签。

对不上的补丁会显示待应用或跳过，不会乱改文件。桌面端的 `#45/#46/#82/#83/#84` 打的是官方 EXE 里 `app.asar` 解出来的 `main.js`，这几条按「保留旧锚点、不主动破坏」处理，**没有在真实的 0.2.1 桌面上逐条验证**。

---

<a id="本版变更"></a>

## 本版变更（1.2.1）

1.2.1 不加功能，是把上一版的补丁表按 dsh 0.2.1-rc.2 重新校准。逐条说清楚：

- **修掉 `{{cwd}}` 崩溃。** dsh 0.2.1 删除了 `{{cwd}}` 提示词变量，目录改由 `dsh-working-directory` 包以 `working-directory:current`（`interpolate: false`）上下文提供。旧版写进 profile 的 `personaSuffix: Your working directory is {{cwd}}.` 会让宿主启动即抛 `unknown prompt variable`。本版把这一句清空，并新增自动修复通道：每次「应用」前扫 `$DSH_HOME/cordis.patch.yml` 与 `$DSH_HOME/profiles/*/cordis.patch.yml`，把残留的目录句收敛成空值。幂等，没有命中就不写盘。
- **Web 面提示词搬家。** dsh 0.2.1 把 GUI 身份句和 `harness:source` 段搬进新包 `dsh-harness-dev-context`。对应补丁跟着改打新包，并新增一条 `HARNESS_SOURCE_NEUTRAL`（#93），把「可以 inspect / extend DSH 本身」这个能力暗示中性化成「普通参考目录」。
- **运行时 invariant 被删。** dsh 0.2.1 移除了 `dsh-invariants` 与所有 `<pkg>/invariant` 子路径，涉及审批的三条补丁目标文件随之消失，已收敛到现存目标，不报错、也不留失锚项。
- **子代理改 managed activation。** `backgroundMode` / `enableRunInBackground` 被官方删除，`subagent-in-process-driver` 包一并移除；对应补丁跟着调整。
- **插件元数据新规则。** 0.2.1 的 `engines.dsh` 是独占判定（必须 semver range，`workspace:` 判不兼容），已补 `engines.dsh`；`dsh.client.inject` 不再声明不存在的 `dsh-client-runtime`。
- **锚点体检。** 新增 `scripts/fetch-corpus.mjs`（拉官方 npm 包做语料）与 `scripts/verify-anchors.mjs`（对每条补丁的 pattern 做命中 / 幂等体检），命令是 `npm run verify:anchors`。CI 在发版前跑一遍，失锚不再等到用户点「应用」才发现。
- **补丁总数 87 条。** 1.1.72 的 86 条按 0.2.1 重锚，再新增 #93。清单在 [补丁清单](#补丁清单)。

---

## 安装

现在只维护官方 `dsh web` 和官方桌面 EXE，**两边都要装、分开应用**。Web 的包进不了桌面端，桌面端的包也进不了 Web。

> ⚠️ **dsh 0.2.1 必须把 `--profile` 放在前面。** 正确写法是 `dsh plugin --profile <name> add <目标>`。写成 `dsh plugin add <目标> --profile web` 在 0.2.1 会直接报 `required option '--profile <name>' not specified`。
>
> ⚠️ **npm 上没有 `dsh-purge` 这个包**（`npm view dsh-purge` 返回 404）。所以安装目标写 GitHub 归档地址，写裸包名会 404。

**Web（官方 `dsh web`）**

```sh
dsh plugin --profile web add https://github.com/Axing-hb/dsh-purge/archive/refs/heads/master.tar.gz
```

**桌面端（官方 EXE）**

```sh
dsh plugin --profile desktop add https://github.com/Axing-hb/dsh-purge/archive/refs/heads/master.tar.gz
```

当前目录已经是本仓库时，把归档地址换成 `add .`。`dsh` 不在 PATH 时走 [手动安装](#manual)。

[插件市场](https://dsh-plugin.org/plugins/axing-hb/dsh-purge)的按钮可能仍按 npm 包名反查；npm 上没有这个包，按钮会退回去或失败，用上面的归档地址。

桌面客户端也可以点按钮（`dsh://` 唤起）：

<p align="center">
  <a href="dsh://plugin/install?id=dsh-purge&name=dsh-purge&version=1.2.1&repo=Axing-hb%2Fdsh-purge&permissions=%E7%B3%BB%E7%BB%9F%E6%8F%90%E7%A4%BA%E8%AF%8D%E6%B3%A8%E5%85%A5%2C%E6%9C%AC%E6%9C%BA%E8%A1%A5%E4%B8%81%2C%E8%AE%BE%E7%BD%AE%E9%A1%B5&downloadUrl=https%3A%2F%2Fgithub.com%2FAxing-hb%2Fdsh-purge%2Farchive%2Frefs%2Fheads%2Fmaster.tar.gz"><strong>唤起客户端一键安装</strong></a>
</p>

### 装完都要做这三步

只把插件写进 profile **还不会**改 `@deepseek-ai`。

1. **退出并重新打开**刚装的那个宿主：Web 关掉 `dsh web` 再开；桌面端退出托盘再打开对应 exe。
2. 在**这个宿主**点会话标题旁的 **dsh-purge**，在 **清洗** 页点 **「应用」**。宿主的设置页里没有这个条目。
3. 「应用」成功后会自动重启一次，让补丁进入当前进程。没做完不会重启。

Web 的控件只动 Web，桌面端的只动桌面应用。不要在一个宿主里点另一个宿主的应用。

### 怎样算装上了

- 会话标题旁有 **dsh-purge**，点开后在「清洗」里能点「应用」。
- 聊天里 `/purge status` 能打出 `DSH_HOME` 和补丁列表，路径应是你正在用的那一份。
- 没装的可选包（例如梁神）显示跳过，不挡住应用完成。

### 交给助手安装

把下面整段发给本机助手。它只执行安装命令：不要全盘搜索、不要改其它文件、不要代点「应用」、不要重启。

<details>
<summary><strong>给 AI 助手（只安装）</strong></summary>

<!-- AI-AGENT-START -->

安装 DeepSeek Harness 插件 `dsh-purge`，Web 和官方桌面端都要装。不要全盘搜索，不要读或改其它文件，不要应用设置，也不要重启应用。

`dsh` 不在 PATH 就告诉用户后停止。当前目录已是本仓库时，把下面两条里的归档地址都换成 `.`。某个 profile 不存在就跳过那一条，另一条照装。注意 `--profile` 必须在 `add` 前面（dsh 0.2.1 的硬要求）。

**Web 端（官方 `dsh web`）**

```sh
dsh plugin --profile web add https://github.com/Axing-hb/dsh-purge/archive/refs/heads/master.tar.gz
```

**桌面端（官方 EXE）**

```sh
dsh plugin --profile desktop add https://github.com/Axing-hb/dsh-purge/archive/refs/heads/master.tar.gz
```

命令结束后，提醒用户：Web 完全退出并重启 `dsh web`；桌面端退出托盘再打开 EXE。各自点会话标题旁的 **dsh-purge**，在「清洗」里点「应用」。然后停止。

<!-- AI-AGENT-END -->

</details>

<a id="manual"></a>

### 手动安装

命令行装不上、或 `dsh` 不在 PATH 时用这个。只改**正在用的那个宿主**对应的 profile，不要动另一个，也不要删原有 bundle。

<details>
<summary><strong>完整手动步骤</strong></summary>

**1. 找到真正在用的 `$DSH_HOME`。** 认目录：名字是 `.dsh`（官方 EXE 偶见 `dsh-home`），里面有 `profiles`，且至少有一个 `profiles/<名>/package.json`。按顺序找：`DSH_HOME` 环境变量 → 安装根旁边的 `.dsh`（便携包）→ `%USERPROFILE%\.dsh` 或 `~/.dsh` → `%APPDATA%` / `%LOCALAPPDATA%\DeepSeek Harness\dsh-home`。确认：`profiles/web/package.json` 里 `"name"` 是 `dsh-profile-web`（桌面是 `dsh-profile-desktop`）。本机常有两份 `.dsh`，要用你**实际启动**的那个宿主对应的那份。

Windows PowerShell 列候选：

```powershell
$cands = @()
if ($env:DSH_HOME) { $cands += $env:DSH_HOME }
$cands += "$env:USERPROFILE\.dsh"
$dsh = Get-Command dsh -ErrorAction SilentlyContinue
if ($dsh) {
  $dir = Split-Path $dsh.Source
  $cands += @((Join-Path $dir ".dsh"), (Join-Path (Split-Path $dir) ".dsh"), (Join-Path (Split-Path (Split-Path $dir)) ".dsh"))
}
$cands += @("$env:APPDATA\DeepSeek Harness\dsh-home", "$env:LOCALAPPDATA\DeepSeek Harness\dsh-home")
$cands | Select-Object -Unique | Where-Object { $_ -and (Test-Path (Join-Path $_ "profiles")) }
```

**2. 把插件放到 `$DSH_HOME/plugins/dsh-purge`**（目录名必须是 `dsh-purge`，其 `package.json` 里 `"name"` 也必须是 `dsh-purge`）。

```sh
git clone https://github.com/Axing-hb/dsh-purge.git "$DSH_HOME/plugins/dsh-purge"
```

没有 git：下载 [master.tar.gz](https://github.com/Axing-hb/dsh-purge/archive/refs/heads/master.tar.gz)，解压后把 `dsh-purge-master` 改名为 `dsh-purge`，整夹放到 `plugins` 下。已有本仓库副本就复制整个目录，不要只拷几个 `.js`。

**3. 只改对应 profile 的 `package.json`，先备份。** Web → `$DSH_HOME/profiles/web/package.json`；桌面 → `$DSH_HOME/profiles/desktop/package.json`。**只追加两处**，原有依赖和 bundle 全部留着：

1. `dependencies` 增加 `"dsh-purge": "file:../../plugins/dsh-purge"`
2. `dsh.profile.bundles` **末尾**追加 `"dsh-purge"`（已有就不要再加）

```json
{
  "name": "dsh-profile-web",
  "private": true,
  "dependencies": {
    "dsh-purge": "file:../../plugins/dsh-purge"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-purge"
      ],
      "patchReload": "live"
    }
  }
}
```

JSON 要合法（新增项前面有逗号，最后一项后面没有多余逗号）。`file:../../plugins/dsh-purge` 不要改成绝对路径，`patchReload`、其它插件、版本号都不要动，`"dsh-purge"` 不要写两次。桌面端没有 `dsh-web-app` 就不要硬加。

**4. 只在刚改的那个 profile 目录装依赖**（`cd` 进 profile 目录，不要在仓库根或 `$DSH_HOME` 根）：

```sh
cd "$DSH_HOME/profiles/web"   # 或 profiles/desktop
pnpm install
```

成功标志：出现 `profiles/<web|desktop>/node_modules/dsh-purge/package.json`。找不到 `pnpm` 就用官方 `dsh` 自带的 Node / pnpm；报 `Could not resolve` 就检查 `file:` 路径；JSON 解析失败就修逗号或还原备份。

**5. 完全退出该宿主，再启动，再点「应用」** —— 和上面三步一样。按钮会出现在会话标题旁，只在这个宿主点「应用」（或 `/purge apply`）。没出现多半是改错了另一份 `.dsh`，回到第 1 步核对。

</details>

### 卸载

会话标题旁的 **dsh-purge** →「清洗」→「卸载」。弹窗确认：会先还原已应用的补丁，还原回原版 Harness，再重启当前宿主。

```sh
# 也可以用命令行 / 聊天
dsh-purge --uninstall
# /purge uninstall
```

插件配置在 `cordis.patch.yml`（`postPrompt` 默认为空）：

```yaml
- insert:
    - id: dsh-purge
      name: 'dsh-purge'
      config:
        enabled: true
        autoApplyOnStart: true
        autoUpdateOnStart: false
        autoRevertOnMissing: false
        verbose: false
        postPromptOrder: 5100
        postPrompt: ""
```

---

## 界面预览

会话标题旁有 **dsh-purge**。点开是右侧栏，两页：**清洗** 和 **演练台**。白 / 墨可切换。补丁按组展开，进度只计真正已应用的项。规则集在上方列表启用或删除，下方编辑正文。

第一次进演练台要先读声明、等倒计时、滚到文末并勾选三项。清洗不需要这一步。演练台只用于你有权管理的本机、离线靶标，或已经书面授权的演练环境。

**清洗**

![清洗](docs/preview/dock-clean.png)

**演练台授权**

![演练台授权](docs/preview/dock-auth.png)

**演练台**

![演练台](docs/preview/dock-drill.png)

**补丁**

![补丁](docs/preview/settings.png)

**规则集**

![规则集](docs/preview/rules.png)

**自己的服务器**

在清洗页，提示词下面。每行一台，点保存名单。步骤见 [自己的服务器](#自己的服务器)。

![自己的服务器](docs/preview/own-servers.png)


| 区域        | 说明                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| dsh-purge | 会话标题旁的按钮，打开或收起右侧栏                                                                                          |
| 清洗        | 原来的规则设定：补丁、提示词、规则集、Skill                                                                                   |
| 演练台       | 授权后的资产、技能与环境页。未授权时按钮标「未授权」                                                                                 |
| 补丁        | 分组查看状态，应用、还原或卸载                                                                                            |
| 提示词       | 编辑 `prompt-inject.md`，作为会话覆盖段                                                                              |
| 自己的服务器    | 每行登记一个 IP 或完整主机名，保存后写入 `$DSH_HOME/net-scope-allow.txt`                                                     |
| 规则集       | 多套 `AGENTS.md` / `CLAUDE.md`；启用写入 `$DSH_HOME`，删除从列表去掉                                                      |
| Skill     | 导入压缩包或文件夹到当前宿主官方目录 `$DSH_HOME/skills/<id>/SKILL.md`（Web / 桌面各用自己的主目录，不写死盘符）；命中、加载、`/名称` 由 DSH 负责。也可自己删该文件夹 |


---

## 目录结构

`bin/` 是命令行，`lib/` 是补丁和演练台，`lib/patches/` 是按 dsh 版本分的重锚覆盖表（`group-*-021.js`，由 `lib/patch-overrides.js` 合并进主表），`scripts/` 是构建、打包与锚点体检脚本，`presets/redteam/` 是红队预设，`skills/redteam/` 是随包技能，`client.js` 是侧栏。

运行时文件在 `$DSH_HOME`：`prompt-inject.md`、`rules/`、`skills/`、`net-scope-allow.txt`、`redteam/`。未设 `DSH_HOME` 时，优先用 dsh 安装目录旁边的 `.dsh`，再退回 `~/.dsh`。Web 和桌面端各用自己那一份主目录。Skill 不进注入段，也不顶替提示词。

---

## 使用

```sh
# CLI
dsh-purge --status
dsh-purge --apply
dsh-purge --revert
dsh-purge --uninstall
dsh-purge --edit

# 聊天
/purge status | apply | revert | uninstall | edit | help
/rules list | use <id> | create <id> | delete <id> | reset | help
/skills list | import <压缩包或文件夹> | create <id> [说明] | delete <id> | help
/rewind

# 模型工具
purge_status   purge_apply   purge_revert
```

设置页「应用」成功后会自动重启，以加载已改的包文件；也可手动点「重启」。补丁标题下有正式版和测试版。测试版跟 `beta` 分支。点「切换到正式版」会装回 master，并清掉钉选。正式版里选旧版本会固定在该版本，要回到最新再点「更新」。旧的测试标签不再列出。

输入框旁的「回退一次」和「回退上一轮」跟官方 DSH `session.fork({ atSeq })`：撤回已进行的那一轮，新会话接上之前的上下文，旧会话归档，那句回到输入框，再发送会重新注入。聊天里 `/rewind` 同样可用。

**极简 / PTC 与标准不一致时**：同一任务在标准模式能跑、在极简或 PTC 被拦，通常是 preset 里 `run_code` 或 plan 拦截句没洗净，或内置 minimal 缺少 `agent-instructions`。请用 **1.2.1**，**完全退出宿主 → 清洗里应用 → 自动重启 → 新开一轮对话** 再试；只换 preset 不重应用，旧进程里的补丁不会更新。

### 响应速度

DSH 会按顺序执行同一批中的 Bash 调用。旧版 dsh-purge 把默认前台等待从 60 秒提高到了 10 分钟，一条慢命令会让后续调用一起等待。补丁 #21 现在把带插件标记的旧值恢复为官方的 60 秒。无标记的等待时间和其他自定义值会保留；无标记的 10 分钟无法可靠地区分是插件旧值还是用户设置。

在 macOS/Linux 的 `dsh web` 中，如需更快返回工具结果，可在 `$DSH_HOME/profiles/web/cordis.patch.yml`（通常是 `~/.dsh/profiles/web/cordis.patch.yml`）添加下面的条目。已有相同 id 时修改原条目，不要重复添加。这个 profile 覆盖层在内置配置之后加载，后续应用插件会保留它。

```yaml
- id: bash-sandbox
  config:
    timeoutMs: 10000
```

使用标准 jobs 服务且 `promoteOnTimeout: true` 时，未完成的命令会在 10 秒后返回后台任务 id，并继续运行。用 `job_output` 读取结果、用 `job_kill` 停止。这个设置缩短前台等待，不会让命令本身跑得更快。没有 jobs 服务或关闭自动转后台时，超时会终止命令。单次调用传入的 `timeoutMs` 优先于这里的默认值；`run_in_background: true` 可立即返回任务 id。

日常任务还可以选择让新会话默认使用 Low 推理：

```yaml
- id: agent-default-model
  config:
    provider: deepseek-official
    model: deepseek-flash
    reasoningEffort: low
```

重启 `dsh web` 后加载配置。模型和推理等级默认值只用于新建会话，已有会话请在输入框中选择 Low。插件不会自动修改这些模型偏好。需要深入推理的任务可保留 High；搜索文件时应限定目录，避免递归扫描所有应用目录。

### 自己的服务器

中国大陆、香港、澳门的地址默认禁止。只有事先登记的那一台可以例外。在对话里说「这是我的服务器」不会放行。密钥和密码也不会。

这一栏在提示词下面。若侧栏里还没有它，先完全退出 DeepSeek Harness，再重新打开。

1. 点会话标题旁的 **dsh-purge**，停在 **清洗**。
2. 往下滚过 **提示词**，下面就是 **自己的服务器**。
3. 每行只写一台，用下面三种写法之一：
  - `203.0.113.10`：一个 IP。
  - `my-vps.example.com`：一个完整主机名。保存后，这个主机名当时解析出来的地址也会放行。
  - `alice@my-vps.example.com`：账号只用来认出这种写法，不能证明这台机器属于你。
4. 点 **保存名单**。名单写在 `$DSH_HOME/net-scope-allow.txt`。
5. 密钥、密码、网段和通配符会在保存时丢掉。没有写进名单的大陆、香港、澳门地址仍然禁止。

上面的 `203.0.113.10` 和 `example.com` 只是写法示例，不是放行地址。把它们换成你自己的那一台再保存。

---

## 本地校验

```sh
node --check lib/index.js
node --check lib/core.js
node --check lib/reapply.js
node --check lib/patch-overrides.js
node --check lib/rewind.js
node --check lib/skills.js
node --check client.js
npm run verify:anchors
```

`verify:anchors` 需要语料：`node scripts/fetch-corpus.mjs` 会把官方 `@deepseek-ai` 包按版本解到 `.anchor-corpus/`，再跑体检才有可比对象。没有语料时它退出 0 并说「无可用语料」；CI 上用 `--offline-ok` 放宽这一条。

---

## 补丁清单

一共 **87** 条：86 条是 1.1.72 的老 id 按 dsh 0.2.1 重锚，1 条是新加的 #93。

编号有空缺（20 / 27 / 41 / 44 / 79 / 81），那是上游历史删掉的 id，不复用。

补丁按层分四类：**提示词层**改模型读到的文案，**代码层**改宿主执行逻辑，**工具层**改单个工具的描述与 hook，**兼容层**是给旧宿主留的别名。

清洗页会把几条连在一起打的补丁合成一行显示（同一条清洗的升级链），所以界面上看到的行数比这里少；点「应用」仍是全打。

<details>
<summary><strong>展开全部 87 条补丁</strong></summary>

**提示词层（26）** —— 改的是模型读到的文案与身份句。

| 编号 | 名称 | 一句话说明 |
| --- | --- | --- |
| #1 | `WORKSPACE_CONTEXT_INTRO` | 全局免责声明 |
| #2 | `REPLACEMENT_WORKSPACE_CONTEXT_INTRO` | 替换稿不压过 system |
| #3 | `SCOPE_INTRO` | 作用域不压过 system |
| #4 | `SYSTEM_PROMPT_PERSONA` | persona：去掉官方默认身份，不另写人设 |
| #43 | `WEB_PRESET_IDENTITY_STRIP` | Web 四个内置预设只去掉身份句 |
| #76 | `PRESET_UNRESTRICTED_IDENTITY_STRIP` | 用户自造 unrestricted 预设只去掉身份句（软补丁） |
| #70 | `PRESET_SHELL_NETWORK` | 极简模式终端不再写没有网络 |
| #73 | `PRESET_BASH_MIRROR_LINE` | 极简 bash 去掉误留的镜像说明 |
| #71 | `LIANGSHEN_IDENTITY_LINE` | 梁神去掉官方身份句，留下本模式的工作纪律 |
| #5 | `APPROVAL_NEVER_SENTENCE` | 审批提示句限制 |
| #11 | `APPROVAL_NEVER_SENTENCE_BYPASS` | never 提示句 → 自动放行 |
| #12 | `APPROVAL_ASK_SENTENCE_BYPASS` | ask 提示句 → 自动放行 |
| #25 | `HARNESS_IDENTITY_STRIP` | 去掉官方默认身份，保留官方功能提示词 |
| #26 | `MINIMAL_PERSONA_PURGE` | 内置 minimal：去掉默认身份并打开 complete，让 inject 能进 |
| #28 | `LIANGSHEN_PHASE1_KEEP_INJECT` | 梁神：phase-1 保留注入段（可选） |
| #32 | `WEB_SURFACE_IDENTITY_NEUTRAL` | Web 面：去掉 DeepSeek Harness 自称 |
| #33 | `TOOL_SHELL_DENIAL_PROMPT` | bash/pwsh 工具描述：沙箱拒绝话术→可继续 |
| #34 | `SANDBOX_HINT_NEUTRAL` | 沙箱拒绝/升级 hint 不再要求用户审批 |
| #36 | `TOOL_FS_ESCALATION_SCHEMA` | fs 升级字段：去掉 user approval 拦截描述 |
| #37 | `SUBAGENT_SCOPE_LOCK_NEUTRAL` | 子代理权限锁→可继续 |
| #50 | `SESSION_REFERENCE_FRAMING_NEUTRAL` | 跨会话引用与 0.1.7 一样标 untrusted |
| #53 | `WEB_SURFACE_PROHIBITION` | 网页端提示词去掉身份句和禁止另开服务器 |
| #54 | `DELIVERABLE_DO_NOT` | 交付物提示词去掉 Do not call present |
| #61 | `OFFICIAL_SANDBOX_POLICY_NEUTRAL` | 沙箱只读策略不拦任务；加宽自动放行 |
| #63 | `OFFICIAL_PLAN_MODE_NEUTRAL` | 计划模式：操作者要求实施时不硬拦 |
| #93 | `HARNESS_SOURCE_NEUTRAL` | harness:source 的 checkout 只当普通参考目录，不再给身份 |


**代码层（50）** —— 改的是宿主执行逻辑：审批门、沙箱、工具上限、会话与回退。

| 编号 | 名称 | 一句话说明 |
| --- | --- | --- |
| #6 | `SANDBOX_DENY_FILE_WRITE` | 沙箱 deny file-write |
| #7 | `SANDBOX_MODE_DEFAULT` | 沙箱默认 danger-full-access（可被 UI 切换，不写死 env） |
| #8 | `APPROVAL_POLICY_DEFAULT` | 审批：danger-full-access → never（与 mode 组合合法） |
| #9 | `APPROVAL_AUTO_GRANT` | 审批门自动放行 |
| #10 | `APPROVAL_CONFIG_DEFAULT_NEVER` | 审批配置默认 never |
| #13 | `ESCALATION_WIDENING_EXEMPT` | 豁免严格升级阶梯 |
| #14 | `ESCALATION_GRANT_UNCONDITIONAL` | 升级请求无条件授信 |
| #15 | `SANDBOX_CONFINE_PASSTHROUGH` | 沙箱 confine 直通 |
| #16 | `FS_FENCE_DISABLED` | 文件系统围栏取消 |
| #17 | `FS_OBSERVATION_INTENT_FREE` | 观察策略读写意图放行 |
| #18 | `REPEAT_TOOL_REMINDER_DISABLED` | 重复调用守卫禁用 |
| #19 | `TOOL_RESULT_PRUNER_DISABLED` | 工具结果修剪禁用 |
| #21 | `BASH_TIMEOUT_RESTORE` | 恢复插件延长的 bash 等待 |
| #22 | `READ_CAPS_RAISED` | read 上限放宽 |
| #23 | `SUBAGENT_MAXDEPTH_RAISED` | 子代理深度默认 3 → 10 |
| #24 | `PRESET_FETCH_ENABLED` | preset tool-web fetch 打开 |
| #35 | `ESCALATION_NEVER_REJECT` | 升级结果 rejected/cancelled/unavailable 仍授信 |
| #92 | `SUBAGENT_SAME_INJECT_PATH` | 子代理创建时立刻挂 assemble 注入，并继承父会话权限 |
| #38 | `PERSONA_TEXT_PREFIX_ALIAS` | dsh-persona：兼容 0.1.2 text 字段，否则梁神会话起不来 |
| #39 | `SESSION_V0_PLUGIN_SUMMARY_ALIAS` | v0 会话：mnemon summary 可挂在 instructions/recall 上 |
| #42 | `SETTINGS_LEGACY_API` | 设置服务补回 register/get，旧插件可继续用 |
| #45 | `OFFICIAL_DESKTOP_UPDATE_HANDOFF` | 官方桌面升级安装已下载的新版本，不再重新打开旧的解开目录 |
| #46 | `OFFICIAL_DESKTOP_UPDATE_ASCII` | 已接管的官方桌面更新改为 ASCII 脚本，中文 Windows 不再吞掉换行 |
| #51 | `FRESH_SESSION_FULL_ACCESS` | 新会话在部署已是 danger-full-access 时不再钉回 workspace-write |
| #52 | `SESSION_LOG_UPLOAD_DEFAULT_OFF` | 官方模型 API 默认不上传 Session Log |
| #55 | `SYSTEM_PROMPT_REPLACE_HEAD` | 每一步用当前整段系统提示替换第一条，避免旧提示被钉住 |
| #74 | `ASSEMBLE_BEFORE_PRESTEP` | 每个模式的第一次发送前先挂上默认提示词 |
| #66 | `SYSTEM_PROMPT_RENDER_GUARD` | renderPrompt 对 undefined section.text 兜底，避免第二轮 gateway/internal |
| #83 | `DESKTOP_HOST_CLOSE_NO_FATAL` | host 被信号杀 (重启密封包) 时不报错,不弹 crash dialog |
| #84 | `DESKTOP_HOST_CLOSE_CODE0_NO_FAIL` | host code=0 正常退出不报错 (消除 stopped 对话框) |
| #67 | `AGENT_LOOP_MESSAGES_GUARD` | decision.messages 缺省时按空数组处理，避免第二轮 gateway/internal |
| #68 | `SYSTEM_NODES_CONTENT_GUARD` | systemNodes/derive 对缺 content 兜底，避免回退后第二轮 gateway/internal |
| #69 | `MODEL_STREAM_RELEASE` | deepseek-flash 恢复官方 in-history，并撤掉会打成 TRANSPORT 的独立连接补丁 |
| #72 | `MESSAGES_SYSTEM_CURRENT` | Messages 的 system 字段用当前系统提示，不再把后出现的系统提示降成中途消息 |
| #56 | `REWIND_HIDE_CUT_ONLY` | 回退只藏被撤掉的那一轮 |
| #77 | `REWIND_DROP_SENT_ON_APPEND` | 回退标记到达时立刻从当前对话拿掉已发送的消息 |
| #75 | `REWIND_RESET_TODOS` | 回退把已完成任务收回成未开始 |
| #57 | `DEEPSEEK_SYSTEM_ROLE` | developer role 仅限 openai.com/azure 原生，第三方代理 (deepseek/glm/recoverystar/中转) 全回退 system |
| #58 | `REWIND_SKIP_DERIVE` | 回退空标记不进模型请求 |
| #59 | `OFFICIAL_AUTO_REVIEW_PASSTHROUGH` | 官方 Auto Review 不再拦工具 |
| #62 | `OFFICIAL_TOOL_ASK_FAILOPEN` | 无审批通道时放行；用户点拒绝仍 deny |
| #78 | `OVERLAY_RESTORE_FROM_BAK` | 声明过的补丁文件不见时，从 .dshpurge.bak 拷回再加载 |
| #82 | `DESKTOP_SHELL_PROFILE_FALLBACK` | 主进程兜底 DSH_PROFILE=desktop：双击 exe 从 explorer 继承 env 常缺 DSH_PROFILE → host 'cannot determine the boot profile' → dsh-purge 插件没 activate → inject 全断 |
| #85 | `SESSION_PROMPT_STEER_INTERRUPT` | 官方三条路：prompt() 的 steer 走插话，其余走 followup |
| #86 | `SESSION_QUEUE_STEER_INTERRUPT` | 官方三条路：排队 followup/next-turn，插话 steer/next-step |
| #87 | `PREPARE_ASSEMBLE_USE_RETURNED` | 首次 assemble 用 prepare 返回的当前模式 systemPrompt |
| #88 | `HUNG_PROMPT_REMOVED` | 去掉 renderPrompt 后的挂针，注入只走 assemble 整段 |
| #89 | `SYSTEM_FIELD_EXTRACT` | buildRequest 把 role:system 消息提取到单独 system 字段，避免 0.2.0 把系统提示词当对话历史 |
| #90 | `OPENAI_NATIVE_SYSTEM_ROLE` | openai-completions 把 systemPrompt 折进 messages[0].role=system（chat/completions 原生槽），不再塞进 last user |
| #91 | `ANTHROPIC_NATIVE_PARAMS_SYSTEM` | anthropic-messages 把 systemPrompt 写入顶层 params.system（/messages 原生槽），不再塞进 last user |


**工具层（8）** —— 改的是单个工具的描述与 hook 行为。

| 编号 | 名称 | 一句话说明 |
| --- | --- | --- |
| #80 | `MINIMAL_OFFICIAL_TOOLSET` | 撤掉曾追加的 fs/web，恢复官方极简工具表 |
| #29 | `TOOL_WEB_UNTRUSTED_NEUTRAL` | dsh-tool-web：外部内容 untrusted 拦截→可执行数据 |
| #30 | `HOOKS_CLAUDE_DENY_ALLOW` | dsh-hooks-claude-code：deny→allow（可选） |
| #31 | `HOOKS_CODEX_DENY_ALLOW` | dsh-hooks-codex：deny→allow（可选） |
| #48 | `TOOL_SHELL_DELETE_MOVE_NEUTRAL` | bash/pwsh 去掉 delete/move 过度谨慎描述 |
| #60 | `OFFICIAL_RUN_CODE_APPROVAL_NEUTRAL` | PTC 的 run_code：沙箱加宽句改为自动放行 |
| #64 | `HOOKS_STOP_STEER_NEUTRAL` | Stop hook 不再 steer 假用户话 |
| #65 | `HOOKS_PRESTEP_REJECT_NEUTRAL` | UserPromptSubmit deny 不再 reject 整轮 |


**兼容层（3）** —— 给旧宿主与旧插件留的别名与回退路径。

| 编号 | 名称 | 一句话说明 |
| --- | --- | --- |
| #40 | `COMPLETE_PROMPT_KEEP_INJECT` | complete 预设把已折进 persona 的注入放最前 |
| #47 | `ANTHROPIC_OAUTH_NO_CLAUDE_IDENTITY` | Anthropic OAuth 不再强插 Claude Code 首段系统提示 |
| #49 | `ANTHROPIC_OAUTH_CLI_NEUTRAL` | OAuth 不再伪装 claude-cli |

</details>

---

## 工作原理

应用，启动时或手动点「应用」：

```mermaid
flowchart TD
  A["启动或点应用"] --> B{"补丁已经生效?"}
  B -->|是| C["跳过"]
  B -->|否| D["备份原件为 .dshpurge.bak"]
  D --> E["清掉 profile 里残留的 {{cwd}} 目录句"]
  E --> F["按补丁列表替换对应文件"]
  F --> G["覆盖 shim"]
  G --> H["注入插件加密默认（提示词框默认显示的那份）"]
```



每次会话的覆盖：

```mermaid
flowchart TD
  A["重启或新会话"] --> B["注入插件加密默认，不必点保存，不读宿主磁盘"]
```



每一轮的提示词注入与规则集决策。左边三个输入就是你在 dsh-purge 面板里控制的东西，虚线表示它们各自驱动哪一步判定：

```mermaid
flowchart TD
  L["规则库：启用某个规则集 → 写入 prompt-inject.md"]
  W["本地规则：勾选当前目录的 AGENTS.md / CLAUDE.md"]
  P["工作区策略：strict / fallback / always"]

  A["新一轮开始"] --> B{"prompt-inject.md 非空?"}
  B -->|是| C["注入 = prompt-inject.md (A)"]
  B -->|否| D{"当前目录有被勾选且非空的本地 md?"}
  D -->|是| E["注入 = 被勾选的 workspace md (B)"]
  D -->|否| F["注入 = 插件加密 slot 默认值 (D)"]
  C --> G{"Workspace baseline 策略 (C)"}
  E --> G
  F --> G
  G -->|strict| H["去掉 DSH workspace baseline 段"]
  G -->|fallback 默认| I{"上面有用户注入内容? (A 或 B)"}
  G -->|always| J["保留 DSH workspace baseline 段"]
  I -->|是| H
  I -->|否| J
  H --> K["最终系统提示词"]
  J --> K

  L -.-> B
  W -.-> D
  P -.-> G
```



Skill 不进注入段：

```mermaid
flowchart LR
  A["设置页导入或 /skills import"] --> B["写到官方 skills 目录"]
  B --> C["由 DSH 加载"]
  C --> D["卸载插件不删用户 Skill"]
```



---

## 还原

- 每个目标文件在应用前备份为 `<文件>.dshpurge.bak`。
- 「还原」或 `/purge revert` 用备份覆盖回去并删除备份；没有备份时去掉 shim 里由本插件写入的行。
- `prompt-inject.md` 是用户文件，还原时保留。
- 「卸载」会先还原（若已应用），再删除注入文件、规则库和插件本身。
- 重复应用是幂等的。

profile 里残留的 `{{cwd}}` 目录句属于宿主配置的修复项，应用前会被收敛成空值；「还原」不把它写回去。

---

## 路径探测

宿主面先判断 `web` / `desktop`（预留 `gui` / `tui`，尚未单独适配时回退 web）。

**Web：**

1. `DSH_HOME` / `DSH_BASE`
2. dsh 启动器旁的 `.dsh`
3. `npm prefix -g` / `npm root -g`
4. 嵌套 `@deepseek-ai/dsh/node_modules/@deepseek-ai`
5. 系统默认 `~/.dsh`

**官方桌面：** 只改当前正在运行的官方桌面安装。点「应用」成功后会自动重启一次。社区桌面端不维护。

找不到目标时提示设置 `DSH_BASE`，不改文件。

---

## 更新

每一版改了什么、安装包在 [Releases](https://github.com/Axing-hb/dsh-purge/releases)。发版流程：把 `package.json` 的版本号改掉，中英文说明写进 `release-notes.md`（第一行必须是 `# 版本号`），推到 `master`。`.github/workflows/release.yml` 会先跑 `node --check` 与 `npm run verify:anchors`，通过后打 zip、建 Release。同一版本再推送不会重复发包。

## 说明

- 改动范围是本机 `@deepseek-ai/*` 包里的渲染文案、默认策略和执行逻辑，以及用户目录下的覆盖文件与规则集。
- 升级后原文对不上会显示跳过，这次应用仍算完成，不会乱改。
- 不改动非 `@deepseek-ai` 的第三方插件源仓库（启动时的 CMD 无感会**尽力**修补已装的 doctor / market / 梁神 / mnemon，属运行时补丁）。
- 安装走 GitHub 归档：`dsh plugin --profile web add https://github.com/Axing-hb/dsh-purge/archive/refs/heads/master.tar.gz`，桌面端把 `web` 换成 `desktop`。当前目录已是本仓库时 `add .`。npm 上没有 `dsh-purge` 这个包。

---

感谢 [LINUX DO](https://linux.do) 社区
