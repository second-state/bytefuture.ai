---
slug: "route-cursor-through-token-station"
lang: "zh"
title: "在 Cursor 中接入 Token Station：Claude Sonnet 5 和 Haiku"
summary: "Cursor 在设置里的 Models 面板支持自定义 OpenAI 兼容 provider。把它指向 Token Station，Claude Sonnet 5 和 Haiku 就会作为可选模型出现，并且完整支持 Agent 模式：真正的文件编辑，不只是聊天，还带有用于委派研究和验证的专门 subagent。"
category: "tutorial"
date: "2026-08-26"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-cover.png"
draft: false
---

Cursor 在 Settings → Models 里支持自定义 OpenAI 兼容 provider。把它指向 Token Station 的端点，就能把 Claude Sonnet 5 和 Haiku 添加为可选模型，全部通过你自己的 Token Station key 计费。和 Token Station 上的其他一些模型家族不同，这两个模型完整支持 Cursor 的 Agent 模式：真正的文件编辑，不只是聊天。下面是完整的配置流程，包括我们自己踩过的一个命名坑，最后还会跑一次真实的编码会话：Sonnet 5 在一个开源项目里实现一个真实功能，把研究和验证工作委派给两个专门定制的 subagent。

在开始配置之前，有必要说清楚为什么要通过 Token Station 来路由 Cursor，而不是直接付费给 Cursor。有三个具体的理由。Cursor 的 Pro 计划把一部分模型（Grok 4.6、Grok 4.5、Composer 2.5）打包进一个共享的月度用量池，其余模型则从另一个池子里按各自的 API 价格计费，但这两个池子都不会给你一份按模型、按请求拆分的实际花费明细。Token Station 的 key 会绕开这两个池子：BYOK 请求直接发往 Token Station 的端点，完全不经过 Cursor 自己的计费，会按 provider 的真实费率、零加价，显示在你自己的控制台里。第二，如果 Cursor 只是你使用的多个编码工具之一（比如同时还用 Claude Code、Codex 或 OpenClaw），同一个 Token Station key 和同一批模型 ID 在所有这些工具里都能用：只需要一个账户、一个余额去追踪，而不必给每个工具单独准备 key、单独充值、单独对账。第三，Token Station 的模型目录已经超过 300 个模型、来自 30 多家 provider，远远超出 Cursor 自己打包进那些用量池里的范围。

## 开始之前需要准备什么

- 已安装 Cursor（[cursor.com/download](https://cursor.com/download)）。
- 一个 Token Station 账户和 API 密钥。免费注册：[models.bytefuture.ai](https://models.bytefuture.ai)，注册即送 1 美元额度，无需信用卡。
- Cursor Pro。免费版即使填了自己的 API key，Agent 模式下的自定义模型选择依然是锁死的，所以除了 Chat 模式之外的任何用法都需要 Pro（每月 20 美元）。

## 步骤 1：将 Token Station 注册为自定义 provider

打开 **Settings → Cursor Settings → Models**，滚动到 **API Keys**，设置两个字段：

- **OpenAI API Key**：填入你的 Token Station 密钥。
- **Override OpenAI Base URL**：打开开关，把默认值替换成 `https://models.bytefuture.ai/v1`。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>在 Cursor 的 Models 设置里，把 Token Station 注册为自定义 OpenAI 兼容 provider。</figcaption>
</figure>

不要指望靠一个"Verify"按钮来确认密钥和地址是否正确。它不一定总会出现，即使出现了也不能覆盖所有路径。真正可靠的确认方式是步骤 2：添加一个模型，然后真的给它发一条消息。

## 步骤 2：将 Claude Sonnet 5 和 Haiku 添加为自定义模型

还是在 Models 设置里，点击 **+ Add Custom Model** 两次，依次添加：

```
anthropic/claude-sonnet-5
anthropic/claude-haiku-4-5
```

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/add-models.mp4" type="video/mp4">
  </video>
  <figcaption>添加 anthropic/claude-sonnet-5 和 anthropic/claude-haiku-4-5 两个自定义模型。</figcaption>
</figure>

**这里的坑**：你在这里注册的名字，Cursor 会原样作为请求里的 `model` 字段发出去。Token Station 真实的路由名称里包含 `anthropic/` 前缀。如果你把模型注册成不带前缀的 `claude-sonnet-5`，每个请求都会失败，报错 `Model 'claude-sonnet-5' not found`，因为不带前缀的这个模型确实不存在。带上前缀注册，立刻就能用。

要确认这套流程真的端到端跑通了，而不只是被 Cursor 接受了：打开一个对话，选中新添加的某个模型，发一条无关紧要的消息，然后去 [Token Station 控制台](https://models.bytefuture.ai/dashboard) 查看。真实的回复加上 Recent Activity 里对应的一条记录，说明密钥、base URL 和模型名都是对的。

| 模型 | 适用场景 |
|---|---|
| `anthropic/claude-sonnet-5` | 主力编码模型：规划、实现，以及 Agent 模式下的文件编辑。 |
| `anthropic/claude-haiku-4-5` | 一个更便宜的模型，可以直接把主对话切换过去处理较轻量的单轮问题。至于为什么它目前还不能作为 subagent 的低成本档位，见步骤 3。 |

## 步骤 3：定义范围明确的 subagent

Cursor 支持 subagent：带 YAML frontmatter 的 markdown 文件，可以按项目放在 `.cursor/agents/` 下，也可以全局放在 `~/.cursor/agents/` 下。对编码场景来说，有两个角色很实用：一个只读的研究者，一个在改动之后负责验证的测试执行者。

**`.cursor/agents/bill-the-explorer.md`**
```markdown
---
name: bill-the-explorer
description: Searches and reads the codebase to answer questions about existing code. Use proactively before implementing anything unfamiliar.
model: anthropic/claude-haiku-4-5
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
model: anthropic/claude-haiku-4-5
---

You run the project's test command, capture output, and report which
tests passed or failed and why. Do not modify source files.
```

**给 subagent 起名时，避免和 Cursor 自带的某个 agent 撞名。** 我们最初用的是 `explore`，结果 Cursor 悄悄路由到了它自己同名的内置 agent，而不是我们定义的这个，也没有任何报错来解释为什么我们指定的东西完全不起作用。`bill-the-explorer` 和 `jill-the-test-runner` 避免了这个撞名问题。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>创建 bill-the-explorer 和 jill-the-test-runner 两个 subagent。</figcaption>
</figure>

`bill-the-explorer` 上的 `readonly: true` 会阻止文件编辑和会改变状态的 shell 命令，这正好符合纯研究角色的定位。`jill-the-test-runner` 需要真正执行测试命令，所以没有加这个限制，而是在指令里告诉它不要碰源代码文件。

**关于那一行 `model:`。** 这是有效的、文档化的 Cursor 语法，我们把两个 subagent 都设成了 `anthropic/claude-haiku-4-5`，本来预期它们的计费能和主对话分出档位。但并没有发生。直接问负责这次会话的 agent 为什么，它给出了一个很精确的答案：它用来运行 subagent 的 Task 工具，只接受来自一个固定白名单的 `model` 参数，目前是 `inherit` 或者 Cursor 自己的 `composer-2.5-fast`，根本不会读取自定义 agent 文件里的 `model:` frontmatter。既然没有可用的自定义值可传，它就默认用 `inherit`，也就是说每个 subagent 都运行在主对话当前所用的模型上，在这套配置里就是 Sonnet 5，而不是 Haiku。`name`、`description` 和 `readonly` 都会被正确识别并生效；`model` 目前不会，而且不只是 Haiku，任何自定义模型都是如此。这和 Cursor 自己社区论坛上的多份独立反馈是一致的，所以这是一个已知的、当前存在的限制，不是这套设置特有的问题。

这样一来，subagent 依然对按角色和权限划分委派任务很有用：一个只读的研究者，一个只负责报告的测试执行者，既可以自动委派（主 agent 读取每个 `description` 字段自行判断何时该交给它），也可以用 `/bill-the-explorer` 或 `/jill-the-test-runner` 显式调用。只是目前它还不能给这部分委派工作带来更便宜的模型。

如果你是在对话里让 agent 帮你写这两个文件，而不是自己在终端里写，写完后侧边栏依然显示没有 subagent，重新加载一下窗口（**Ctrl+Shift+P → "Reload Window"**）：Cursor 不会总是实时重新扫描 `.cursor/agents/`。

## 步骤 4：看它实现一个真实功能

有了 provider、模型和 subagent，Sonnet 5 就能跑一次完整的编码会话：研究、实现、验证，中间的只读和验证步骤都交给对应的 subagent。

我们用 [httpie](https://github.com/httpie/httpie) 作为目标，一个真实的、规模适中、测试完善的开源项目。httpie 的 `--meta`/`-m` 参数会打印请求的耗时，但目前还不会显示跟随重定向后实际到达的 URL。这是一个很小、范围明确、真正有用的功能，也正是那种需要先看一眼现有代码，再动手实现的任务。

事实证明，显式调用才是触发委派的可靠方式。用大白话说"用 explore subagent 来做"并不会真的发生委派；主 agent 只是一边在自己的上下文里干活，一边口头上说自己委派了。把 subagent 名字加上斜杠前缀、作为独立的一条消息发出去，这样才管用：

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

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/demo-httpie.mp4" type="video/mp4">
  </video>
  <figcaption>Sonnet 5 把研究工作委派给 bill-the-explorer，自己实现改动，再把验证工作委派给 jill-the-test-runner，全程通过 Token Station。</figcaption>
</figure>

由于 subagent 的模型路由目前还不会被遵循，整场会话在 [Token Station 控制台](https://models.bytefuture.ai/dashboard) 上都计费为 `anthropic/claude-sonnet-5`，研究和验证也不例外，而不是我们最初想展示的那种成本分层。这段视频真正展示出来的是：`bill-the-explorer` 严格只读地运行，在任何代码改动之前先汇报情况；`jill-the-test-runner` 在改动之后运行来验证结果；两个角色分工明确、依序执行，只是暂时还没有体现在价格上。

## 目前能用的

Chat 模式和 Agent 模式下，Sonnet 5 和 Haiku 通过 Token Station 在 Cursor 里都能用：真实的回复、真实的文件编辑，正确计入你的 Token Station 密钥，并显示在控制台里。

subagent 在角色划分和权限控制上是能用的，`name`、`description` 和 `readonly` 都会被正确识别，自动委派和显式调用（`/name`）也都能触发真正的委派。但目前 subagent 层面的模型路由对自定义模型不起作用：Cursor 的 Task 工具只接受 `inherit` 或它自己的 `composer-2.5-fast`，所以不管 frontmatter 里的 `model:` 写的是什么，每个 subagent 都运行在主对话所用的模型上。这是 Cursor 平台本身的限制，由 agent 本身直接证实，也和其他地方的独立反馈一致，并不是 Token Station 或 Haiku 特有的问题。

OpenAI 的 GPT-6 Astra 和 GPT-5.6 系列（Sol、Terra、Luna）现在也已确认可用，包括真正的 Agent 模式文件编辑，通过绑定在你的 Token Station API 密钥上的一个 adapter 实现。具体配置请参见我们的[GPT-6 Astra 和 GPT-5.6 配置指南](/blog/route-cursor-through-token-station-openai-zh.html)。

Token Station 的 xAI 路由 `xai/grok-4.6`，也可以通过同样的自定义 provider 设置在 Cursor 里使用，如果你想让 Grok 来担任主力编码模型的话。具体配置见姐妹篇文章：[在 Cursor 中运行 Grok 4.6](/blog/route-cursor-through-token-station-grok-4-6-zh.html)。

## 开始使用

前往 [models.bytefuture.ai](https://models.bytefuture.ai/signup) 注册：1 美元免费额度，无需信用卡，首次充值最高可再获得 50 美元奖励。导出你的密钥，接入 Cursor 的 Models 设置，添加这两个路由。

[试用 Token Station](https://models.bytefuture.ai/intro.html)
