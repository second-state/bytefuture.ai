---
slug: "route-cursor-through-token-station-openai"
lang: "zh"
title: "在 Cursor 中接入 Token Station：GPT-6 Astra 和 GPT-5.6"
summary: "OpenAI 正在逐步取消它在 Cursor 里的内置支持，往后要在 Cursor 里用 OpenAI 的模型，就只能走 BYOK。把 Cursor 指向 Token Station，GPT-6 Astra 和 GPT-5.6 系列就会作为可选模型出现；绑定在 API 密钥上的 WASM adapter 补上了 Cursor 在 BYOK 路径上没能正确处理的工具调用格式，Agent 模式的文件编辑才能真正生效。"
category: "tutorial"
date: "2026-09-08"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-openai-cover.png"
draft: false
---

<div class="note">

本教程中的步骤和说明，基于 [models.bytefuture.ai](https://models.bytefuture.ai/) 上的公共 Token Station。如果你想搭建自己的私有 Token Station 实例，通过共享订阅、折扣 API 密钥和智能路由来节省成本，欢迎[联系我们](/enterprise.html)。

</div>

Cursor 在 Settings → Models 里支持自定义 OpenAI 兼容 provider。把它指向 Token Station 的端点，就能把 OpenAI 的 GPT-6 Astra 和 GPT-5.6 系列（Sol、Terra、Luna）添加为可选模型，全部通过你自己的 Token Station key 计费。

OpenAI 正在逐步取消它在 Cursor 里的内置支持，所以往后要在 Cursor 里用 OpenAI 的模型，就得走 BYOK。有一点需要先说清楚：Cursor 的内置集成调用的是 OpenAI 的 `/responses` API，而 BYOK 这条路径调用的是 `/chat/completions`，但 Cursor 并没有正确解析 `/chat/completions` 响应里的工具调用。这是 Cursor 的 bug，不是 OpenAI 或 Token Station 的问题；你在步骤 1 里接入的那个 WASM adapter 是一个过渡方案，把 OpenAI 的响应转换成 Cursor 能接受的格式。

## 开始之前需要准备什么

- 已安装 Cursor（[cursor.com/download](https://cursor.com/download)）。
- 一个 Token Station 账户和 API 密钥。免费注册：[models.bytefuture.ai](https://models.bytefuture.ai)，注册即送 1 美元额度，无需信用卡。
- Cursor Pro。免费版即使填了自己的 API key，Agent 模式下的自定义模型选择依然是锁死的，所以除了 Chat 模式之外的任何用法都需要 Pro（每月 20 美元）。

## 步骤 1：创建接入 OpenAI adapter 的 Token Station API 密钥

在 Token Station 控制台里，打开 **API Keys**，点击 **Create new key**。给它起个名字（`Cursor` 就可以），然后点击 **Create key**。请立即复制保存：它只会显示一次，之后不会再显示。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-create-api-key.mp4" type="video/mp4">
  </video>
  <figcaption>创建一个 Token Station API 密钥，并为它接入 Cursor ↔ OpenAI adapter。</figcaption>
</figure>

回到 **API Keys**，找到你刚创建的这个密钥，点击 **Edit**。在 **WASM middleware** 下，它一开始显示为"No WASM middleware assigned."。打开 **Select WASM module** 下拉菜单，选择 **Cursor ↔ OpenAI adapter**，这一项会把 OpenAI 的工具调用响应重新格式化成 Cursor 的 Agent 模式期望的形状。点击 **Save changes**。你会看到一条确认提示（"WASM middleware installed and validated"），这个密钥在 **Active keys** 表格里对应的那一行，现在会在 **WASM** 列里列出这个 adapter。

<figure>
  <img src="/blog/route-cursor-through-token-station/openai-adapter-confirmed.png" alt="Token Station 的 API Keys 页面，显示确认提示 WASM middleware installed and validated，Cursor 密钥所在行的 WASM 列里列出了这个 adapter" />
  <figcaption>接入 adapter 后的 Token Station API Keys 页面：确认提示，以及密钥那一行在 WASM 列里列出的 adapter。</figcaption>
</figure>

这一步别跳过。不接入 adapter 的话，这篇文章里其他的一切依然会照常工作，但 Agent 模式只会读取和讨论代码，从来不会真正改动文件。

## 步骤 2：将 Token Station 注册为自定义 provider

打开 **Settings → Cursor Settings → Models**，滚动到 **API Keys**，设置两个字段：

- **OpenAI API Key**：填入你刚接入 adapter 的那个 Token Station 密钥。
- **Override OpenAI Base URL**：打开开关，把默认值（`https://api.openai.com/v1`）替换成 `https://models.bytefuture.ai/v1`。

打开"OpenAI API Key"这个开关时，会先弹出一个确认提示："Are you sure you want to enable your own OpenAI API key? Several of Cursor's features require custom models (Tab, Apply from Chat, Agent), which cannot be billed to an API key."确认继续即可，这是正常现象。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>在 Cursor 的 Models 设置里，把 Token Station 注册为自定义 OpenAI 兼容 provider。</figcaption>
</figure>

不要指望靠一个"Verify"按钮来确认密钥和地址是否正确。它不一定总会出现，即使出现了也不能覆盖所有路径。真正可靠的确认方式是添加一个模型，然后真的给它发一条消息，这一点接下来会讲到。

## 步骤 3：将 OpenAI 系列添加为自定义模型

还是在 Models 设置里，滚动到模型列表底部的自定义模型输入框，逐一输入下面每个完整路由，然后点击 **Add**：

```
openai/gpt-6-astra
openai/gpt-5.6-sol
openai/gpt-5.6-terra
openai/gpt-5.6-luna
```

**和我们 Claude、Grok 配置里一样的命名坑，这里尤其容易踩上**：你可能会以为，既然这些模型是注册在 Cursor 自己的"OpenAI API Key"字段下面，就可以直接输入不带前缀的模型名。并不能。Cursor 会把你在这里注册的名字原样作为请求里的 `model` 字段发出去，而 Token Station 真实的路由名称里都带着 provider 前缀。注册成不带前缀的 `gpt-6-astra`，请求会失败，报错 `Model 'gpt-6-astra' not found`；注册成 `openai/gpt-6-astra`，就能正常工作。

| 模型 | 费用（输入/输出，每百万 token） | 适用场景 |
|---|---|---|
| `openai/gpt-6-astra` | $10 / $50 | 最难、耗时最长的 agentic 会话：多文件重构和长时间的 Agent 模式运行，这类场景里减少纠错轮数比省 token 更重要。 |
| `openai/gpt-5.6-sol` | $5 / $30 | 大多数编码 agent 步骤的旗舰默认选择，价格只有 Astra 的一半。 |
| `openai/gpt-5.6-terra` | $2.50 / $15 | 反复的实现和调试循环。 |
| `openai/gpt-5.6-luna` | $1 / $6 | 直接切换主对话来处理较轻量的单轮问题、探索或分类。 |

## 步骤 4：确认 Agent 模式的文件编辑真的能生效

接入 adapter 之后，编辑才能真正落地。下面先添加全部四个路由，然后选中 `openai/gpt-5.6-luna`，让它对一个真实仓库（[httpie](https://github.com/httpie/httpie)）做一次真正的编辑：

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-add-models-and-edit.mp4" type="video/mp4">
  </video>
  <figcaption>把全部四个 OpenAI 路由添加为自定义模型，然后 openai/gpt-5.6-luna 在 Cursor 的 Agent 模式下应用了一次真正的文件编辑。</figcaption>
</figure>

提示词是："please update the edit at the top of the readme to say 'model: gpt-5.6-luna'."。Cursor 读取了 `README.md`，应用了改动，并回报："Worked for 8s. Edited README.md, explored 1 file, +1 -1,"，对应的 diff 把一个残留的测试标记替换成了 `<!-- model: gpt-5.6-luna -->`。这是真正落地到真实文件里的一次编辑，不是聊天里的一句描述。

Token Station 的控制台从计费这一侧也确认了同样的事情：

<figure>
  <img src="/blog/route-cursor-through-token-station/openai-dashboard-activity.jpg" alt="Token Station 控制台的 Recent Activity 显示多条 openai/gpt-5.6-luna 请求，每条几千个 token，费用只有几分之一美分" />
  <figcaption>Token Station 的 Recent Activity，显示测试期间 openai/gpt-5.6-luna 请求被正确计费。</figcaption>
</figure>

全部四个路由，`openai/gpt-6-astra`、`openai/gpt-5.6-sol`、`openai/gpt-5.6-terra` 和 `openai/gpt-5.6-luna`，都通过这种方式确认了端到端可用：真实的文件编辑，正确计费，都经过步骤 1 里接入的那同一个 adapter。

## 步骤 5：定义范围明确的 subagent

Cursor 支持 subagent：带 YAML frontmatter 的 markdown 文件，可以按项目放在 `.cursor/agents/` 下，也可以全局放在 `~/.cursor/agents/` 下。对编码场景来说，有两个角色很实用：一个只读的研究者，一个在改动之后负责验证的测试执行者。

**`.cursor/agents/bill-the-explorer.md`**
```markdown
---
name: bill-the-explorer
description: Searches and reads the codebase to answer questions about existing code. Use proactively before implementing anything unfamiliar.
model: inherit
readonly: true
---

You are a fast, read-only research agent. Find and summarize relevant
files, functions, and patterns. Never edit files or run mutating commands.
```

**`.cursor/agents/jill-the-test-runner.md`**
```markdown
---
name: jill-the-test-runner
description: Runs the test suite and reports pass/fail results with failure details. Use proactively after any code change.
model: inherit
---

You run the project's test command, capture output, and report which
tests passed or failed and why. Do not modify source files.
```

这里我们用 `model: inherit`，而不是指定某个具体路由：正如我们 Claude 那篇文章记录的，Cursor 的 Task 工具目前只接受 `inherit` 或它自己的 `composer-2.5-fast` 作为 subagent 的模型，不管自定义 agent 文件里写了什么都是如此。这是 Cursor 平台本身的限制，不是 OpenAI 模型特有的问题，所以这里的每个 subagent 都会运行在主对话当前使用的模型上。除此之外，subagent 的其他部分都会照常生效：`name`、`description` 和 `readonly` 都按文档所说正常工作，无论是自动调用（主 agent 读取每个 `description`，自行判断何时该交给它）还是显式调用（`/bill-the-explorer`），都会触发真正的委派。

**给 subagent 起名时，避免和 Cursor 自带的某个 agent 撞名。** `explore` 就是一个真实存在的内置名字，会被悄悄路由到那个内置 agent 而不是你自己的定义，也没有任何报错来解释原因。`bill-the-explorer` 和 `jill-the-test-runner` 避开了这个问题。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>创建 bill-the-explorer 和 jill-the-test-runner 两个 subagent。</figcaption>
</figure>

如果你是在对话里让 agent 帮你写这两个文件，而不是自己在终端里写，写完后侧边栏依然显示没有 subagent，重新加载一下窗口（**Ctrl+Shift+P → "Reload Window"**）：Cursor 不会总是实时重新扫描 `.cursor/agents/`。

## 自己试试看：同样的 httpie 任务

我们的 [Claude Sonnet 5 配置](/blog/route-cursor-through-token-station-zh.html)那篇跑过一次完整的编码会话，针对 httpie 里的一个真实功能：把跟随重定向后实际到达的 URL（effective URL）加进 httpie 的 `--meta` 输出里，放在已有的耗时字段旁边，并把研究和验证工作委派给上面这两个 subagent。

我们还没有针对 GPT-6 Astra 或 GPT-5.6 系列跑过这个具体的多步骤、多 agent 会话，所以这一节是"自己试试看"，而不是关于具体发生了什么的报告。步骤 4 已经确认全部四个路由都能通过 Token Station 应用真实的 Agent 模式文件编辑，所以同样的三条消息序列值得一试：

**消息 1**，委派研究工作：
```
/bill-the-explorer find how elapsed time is computed and displayed in HTTPie's --meta output, and identify where to add the effective URL, the URL actually reached after following any redirects, alongside it.
```

**消息 2**，研究结果出来后，回到主 agent：
```
Using what bill-the-explorer found, add the effective URL next to the existing elapsed time in HTTPie's --meta output. Add a test that confirms it works for both a redirected and a non-redirected request.
```

**消息 3**，委派验证工作：
```
/jill-the-test-runner verify the new effective-URL test passes, along with the rest of the test suite. Report any failures separately from the two known pre-existing Big5 charset-detection failures in tests/test_encoding.py, which are unrelated to this change.
```

## 目前能用的

Agent 模式下的文件编辑，在全部四个 OpenAI 路由 `openai/gpt-6-astra`、`openai/gpt-5.6-sol`、`openai/gpt-5.6-terra` 和 `openai/gpt-5.6-luna` 上，通过 Token Station 在 Cursor 里都已确认可用：真实的编辑应用到真实的文件上，正确计入你的 Token Station 密钥，并显示在控制台里。如果没有步骤 1 里那个 adapter，同样这些路由在 Agent 模式下只能读取和讨论代码，不会真正编辑文件。

subagent 在划分范围和权限方面是能用的：`name`、`description` 和 `readonly` 都会被正确识别，自动调用和显式调用（`/name`）都会触发真正的委派。subagent 层面的模型路由目前对自定义模型不起作用，不管是哪个 provider 都一样：Cursor 的 Task 工具只接受 `inherit` 或它自己的 `composer-2.5-fast`，所以每个 subagent 都运行在主对话所用的模型上。这和我们 Claude、Grok 配置里记录的是同一个 Cursor 平台限制，不是 OpenAI 模型特有的问题。

## 开始使用

前往 [models.bytefuture.ai](https://models.bytefuture.ai/signup) 注册：1 美元免费额度，无需信用卡，首次充值最高可再获得 50 美元奖励。导出你的密钥，接入 OpenAI adapter，接入 Cursor 的 Models 设置，添加上面的这些路由。

[试用 Token Station](https://models.bytefuture.ai/intro.html)
