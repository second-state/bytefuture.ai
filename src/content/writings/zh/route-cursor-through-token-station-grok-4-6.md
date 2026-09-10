---
slug: "route-cursor-through-token-station-grok-4-6"
lang: "zh"
title: "在 Cursor 中接入 Token Station：Grok 4.6"
summary: "Cursor 在设置里的 Models 面板支持自定义 OpenAI 兼容 provider。把它指向 Token Station，xAI 的 Grok 4.6 就会作为可选模型出现，通过你自己的 key 计费，并已确认支持 Agent 模式的文件编辑。这是 Claude Sonnet 5 和 Haiku 那篇文章的姐妹篇，介绍 Grok 有哪些不同之处。"
category: "tutorial"
date: "2026-08-26"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-grok-4-6-cover.png"
draft: false
---

Cursor 在 Settings → Models 里支持自定义 OpenAI 兼容 provider。把它指向 Token Station 的端点，就能把 xAI 的 Grok 4.6 添加为可选模型，通过你自己的 Token Station key 计费。这是我们 [Claude Sonnet 5 和 Haiku 配置](/blog/route-cursor-through-token-station-zh.html)那篇文章的姐妹篇：注册 provider 和定义 subagent 的过程完全一样，不管你要添加的是哪个模型，所以这篇会写得比较简短，具体的深入调查细节（一个和 Cursor 自带 agent 撞名的 subagent 命名问题，以及一个让 subagent 无法真正运行在与主对话不同模型上的 Cursor 平台 bug）请回那篇文章看。Grok 特有的内容在步骤 2 和下面关于 Agent 模式的部分。

在开始配置之前，有必要说清楚为什么要通过 Token Station 来路由 Cursor，而不是直接付费给 Cursor。有三个具体的理由。Cursor 的 Pro 计划把一部分模型（Grok 4.6、Grok 4.5、Composer 2.5）打包进一个共享的月度用量池，其余模型则从另一个池子里按各自的 API 价格计费，但这两个池子都不会给你一份按模型、按请求拆分的实际花费明细。Token Station 的 key 会绕开这两个池子：BYOK 请求直接发往 Token Station 的端点，完全不经过 Cursor 自己的计费，会按 provider 的真实费率、零加价，显示在你自己的控制台里。第二，如果 Cursor 只是你使用的多个编码工具之一（比如同时还用 Claude Code、Codex 或 OpenClaw），同一个 Token Station key 和同一批模型 ID 在所有这些工具里都能用：只需要一个账户、一个余额去追踪，而不必给每个工具单独准备 key、单独充值、单独对账。第三，Token Station 的模型目录已经超过 300 个模型、来自 30 多家 provider，远远超出 Cursor 自己打包进那些用量池里的范围。

有一个 Grok 特有的细节值得提前说明：Cursor 自己的 Pro 计划已经把 Grok 4.6 打包进了它原生的"Cursor Models"池，按 Cursor 自己的用量池定价计费。改由 Token Station 来路由 Grok 4.6，意味着你是在直接支付 xAI 的 API 费率，享受上面提到的成本可见性和统一管理的好处，而不是消耗 Cursor 打包好的那份额度。

## 开始之前需要准备什么

- 已安装 Cursor（[cursor.com/download](https://cursor.com/download)）。
- 一个 Token Station 账户和 API 密钥。免费注册：[models.bytefuture.ai](https://models.bytefuture.ai)，注册即送 1 美元额度，无需信用卡。
- Cursor Pro。免费版即使填了自己的 API key，Agent 模式下的自定义模型选择依然是锁死的，所以除了 Chat 模式之外的任何用法都需要 Pro（每月 20 美元）。

## 步骤 1：将 Token Station 注册为自定义 provider

打开 **Settings → Cursor Settings → Models**，滚动到 **API Keys**，设置两个字段：

- **OpenAI API Key**：填入你的 Token Station 密钥。
- **Override OpenAI Base URL**：打开开关，把默认值替换成 `https://models.bytefuture.ai/v1`。

这一步和你接下来要添加哪个模型无关，所以直接复用姐妹篇文章里的这段录屏：

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>在 Cursor 的 Models 设置里，把 Token Station 注册为自定义 OpenAI 兼容 provider。</figcaption>
</figure>

不要指望靠一个"Verify"按钮来确认密钥和地址是否正确。它不一定总会出现，即使出现了也不能覆盖所有路径。真正可靠的确认方式是步骤 2：添加模型，然后真的给它发一条消息。

## 步骤 2：将 Grok 4.6 添加为自定义模型

还是在 Models 设置里，点击 **+ Add Custom Model**，添加：

```
xai/grok-4.6
```

**和 Claude 配置一样的命名坑**：你在这里注册的名字，Cursor 会原样作为请求里的 `model` 字段发出去，而 Token Station 真实的路由名称里包含 `xai/` 前缀。注册成不带前缀的 `grok-4.6`，请求会全部失败，报错 `Model 'grok-4.6' not found`。带上前缀注册，立刻就能用。

要确认这套流程真的端到端跑通了，而不只是被 Cursor 接受了：打开一个对话，选中 Grok 4.6，发一条无关紧要的消息，然后去 [Token Station 控制台](https://models.bytefuture.ai/dashboard) 查看。真实的回复加上 Recent Activity 里对应的一条记录，说明密钥、base URL 和模型名都是对的。

<figure>
  <img src="/blog/route-cursor-through-token-station/grok-dashboard-activity.jpg" alt="Token Station 控制台 Recent Activity 显示一条 xai/grok-4.6 请求，费用 0.01 美元" />
  <figcaption>通过 Cursor 发出的一条真实请求，计费到 Token Station 密钥，在 Recent Activity 里显示为 xai/grok-4.6。</figcaption>
</figure>

| 模型 | 适用场景 |
|---|---|
| `xai/grok-4.6` | 主力编码模型：规划、实现、聊天，并已确认支持 Agent 模式下的文件编辑（见下文）。 |

Grok 4.6 通过 Token Station 支持 Agent 模式的文件编辑，是真正应用到文件上的改动，不只是聊天：

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/grok-agent-mode-edit.mp4" type="video/mp4">
  </video>
  <figcaption>Grok 4.6 通过 Token Station 路由，在 Cursor 的 Agent 模式下直接编辑一个文件。</figcaption>
</figure>

## 步骤 3：定义范围明确的 subagent

和姐妹篇文章里一样的两个 subagent，一个只读的研究者，一个测试验证者，在这里的用法完全相同。关于为什么 `model:` 字段不会真的让 subagent 路由到另一个模型，以及我们为什么最终选了这两个名字，完整细节见 [Claude Sonnet 5 和 Haiku 那篇文章](/blog/route-cursor-through-token-station-zh.html)；这里只写简化版。

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

这里我们明确用 `model: inherit`，而不是指定某个具体模型，因为 Cursor 的 Task 工具目前不会遵循 subagent 里指定的自定义模型，不管写什么，它们都会运行在主对话当前使用的模型上（在这套配置里就是 Grok 4.6）。用 `inherit` 直接说明这一点，而不是暗示一个其实并不存在的成本分层。

创建这两个 subagent 的过程和姐妹篇文章完全一样，所以直接复用那段录屏：

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>创建 bill-the-explorer 和 jill-the-test-runner 两个 subagent。</figcaption>
</figure>

同样值得从姐妹篇文章里重复一遍：给 subagent 起名时避免和 Cursor 自带的某个 agent 撞名。`explore` 就是一个真实存在的内置名字，会被悄悄路由到那个内置 agent 而不是你自己的定义，也没有任何报错来解释原因。`bill-the-explorer` 和 `jill-the-test-runner` 避开了这个问题。

## 自己试试看：同样的 httpie 任务

我们用 Claude Sonnet 5 跑过一次完整的会话，把研究和验证工作委派给这两个 subagent，针对 [httpie](https://github.com/httpie/httpie) 的一个真实功能：把跟随重定向后实际到达的 URL 加进 httpie 的 `--meta` 输出里，放在已有的耗时字段旁边。那次会话和录屏都在姐妹篇文章里。

我们还没有用 Grok 4.6 作为主模型跑过这个带 subagent 委派的完整多步骤会话，所以这一节还是"自己试试看"，而不是一份关于这个具体任务实际发生了什么的报告。上面已经确认的是：Grok 4.6 可以通过 Token Station 应用真实的 Agent 模式文件编辑，所以已经没有根本性的理由认为完整任务会失败。事实证明，显式调用才是触发 subagent 委派的可靠方式；用大白话说"用 explore subagent"并不会真的发生委派。同样的三条消息序列，原封不动，值得在选中 Grok 4.6 时试一遍：

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

单步的 Agent 模式编辑已经确认可行；这个序列真正要测试的是，带真实 subagent 委派的完整"研究-实现-验证"流程，是否也能像 Claude Sonnet 5 那样在多步骤会话里稳定跑通。

## 目前能用的

Chat 模式和 Agent 模式下，Grok 4.6 通过 Token Station 在 Cursor 里都能用：真实的回复、真实的文件编辑，正确计入你的 Token Station 密钥，并显示在控制台里。注册 provider 和定义 subagent 的过程和 Claude 配置完全一样，因为这些都和你添加的是哪个模型无关。

这让 Grok 4.6 和 Claude Sonnet 5、OpenAI 的 GPT-6 Astra 与 GPT-5.6 系列一样，成为能通过 Token Station 可靠驱动 Agent 模式编辑的路由。工具调用的兼容性最终被证明确实是因模型和 provider 而异的，所以 Grok 在这里是凭自己的实测证据被确认的，而不是简单地类比 Claude 就假定成立。OpenAI 的模型是怎么做到这一点的，参见我们的[GPT-6 Astra 和 GPT-5.6 配置指南](/blog/route-cursor-through-token-station-openai-zh.html)：靠的是绑定在你 Token Station API 密钥上的一个 adapter。

目前还没测试过的，具体来说，是把研究委派、实现和验证委派都串起来、针对一个真实任务、以 Grok 4.6 作为主模型的完整多步骤会话。支撑它的单步编辑能力已经确认；端到端的完整流程就是上面那个"自己试试看"。

subagent 层面的模型路由和姐妹篇文章里描述的限制一样，不管你用哪个模型都是如此：Cursor 的 Task 工具只接受 `inherit` 或它自己的 `composer-2.5-fast`，所以 subagent 总是运行在主对话所用的模型上。这是 Cursor 平台本身的限制，不是 Grok、Claude 或 Token Station 特有的问题。

## 开始使用

前往 [models.bytefuture.ai](https://models.bytefuture.ai/signup) 注册：1 美元免费额度，无需信用卡，首次充值最高可再获得 50 美元奖励。导出你的密钥，接入 Cursor 的 Models 设置，添加 `xai/grok-4.6`。

[试用 Token Station](https://models.bytefuture.ai/intro.html)
