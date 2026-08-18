---
slug: "codex-multi-model-subagents"
lang: "zh"
title: "用 Codex 编排多模型 Subagent：配置、路由与验收"
summary: "详细介绍如何让 Codex 主 Agent 按任务复杂度、风险和可验证性调度不同模型的 Subagent，包括 Provider、角色配置、权限边界、路由规则、完整案例和分阶段落地方法。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

很多人仍把 Codex 当作一个代码聊天框：提出问题，然后等待一个模型完成全部工作。面对较大的工程任务，更实用的方式是让能力较强的模型担任主 Agent，再把边界清晰的工作交给不同 Subagent。

例如，主 Agent 负责理解需求、拆解任务和最终验收；快速模型处理机械修改；编码模型完成批量实现；检索模型整理外部资料；另一个强模型独立审查高风险改动。

多模型工作流的重点不是同时运行更多模型，而是建立一条可控的链路：

```text
目标
  → 主 Agent 拆解与路由
  → Subagent 在限定范围内执行
  → 测试与独立审查
  → 主 Agent 汇总和验收
```

## 这种架构解决什么问题

模型在推理能力、速度、价格、上下文长度和工具调用稳定性上各有差异。把所有任务交给同一个旗舰模型虽然简单，但会产生几个问题：

1. 简单任务占用昂贵的推理资源；
2. 大量机械修改拉高成本；
3. 单一模型的能力短板会影响全部环节；
4. 同一模型既实现又审查，容易忽略自己的错误；
5. 可以并行的工作被迫串行执行。

多模型 Subagent 架构把“选哪个模型”变成主 Agent 的调度决策。用户描述最终目标，主 Agent判断是否拆分、哪些任务可以并行、每项工作需要什么上下文和权限，以及结果必须通过哪些检查。

## 三层结构：主 Agent、Subagent 和工具

### 主 Agent：负责决策和最终质量

主 Agent 不一定编写最多代码，但应该使用整体能力较强、可靠性较高的模型。它负责：

- 理解用户目标和仓库约束；
- 识别依赖关系和高风险环节；
- 将复杂目标拆成可验证的子任务；
- 为每个子任务选择角色和模型；
- 限制文件范围、工具和权限；
- 汇总结果并解决冲突；
- 运行测试并完成最终验收。

主 Agent 的价值主要来自规划、判断和纠错，而不是输出速度。

### Subagent：完成边界明确的任务

适合委派的任务通常有明确输入、范围和验收标准，例如：

- 检查 `src/auth` 的会话校验逻辑，只报告可复现问题；
- 为一个模块补充单元测试；
- 将指定目录中的接口迁移到新调用方式；
- 阅读官方文档并提取相关 API；
- 比较两种实现方案，不修改文件；
- 在限定文件内完成批量类型标注。

“看看整个项目有什么问题”不是好的子任务。范围模糊时，Subagent 会自行猜测优先级，输出也很难验收。

### 工具层：与真实环境交互

模型负责推理，工具负责读取文件、搜索代码、运行测试、控制浏览器、访问 MCP 服务和执行 Git 命令。即使模型选择正确，如果 Subagent 获得过宽的工具权限或文件范围，工作流仍然不可靠。

## 先区分 Profile 和 Agent 角色

Codex 的命名 profile 用来为一次会话叠加配置，例如选择模型、Provider 或 sandbox。它本身不等于一个会被主 Agent 自动选择的角色。

真正的多 Agent 配置还需要角色描述和委派边界。当前版本的 Codex 可能通过 `[agents.<name>]` 与独立配置文件定义角色；相关功能和字段仍可能随版本变化。配置后应使用本机版本验证，不要把示意代码当成永久不变的 schema。

先检查版本：

```bash
codex --version
```

启动时可用 `--strict-config` 让 Codex 对无法识别的配置字段直接报错：

```bash
codex --strict-config
```

如果某个字段在当前版本不受支持，应以该版本的 OpenAI Docs 和 CLI 帮助为准，而不是关闭严格检查继续运行。

## 第一步：配置模型 Provider

通过 Token Station 使用多个模型时，所有模型可以共享一个 Responses API Provider 和一枚 API key。`~/.codex/config.toml` 的基础配置如下：

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

密钥通过环境变量提供：

```bash
export TOKEN_STATION_API_KEY='你的真实密钥'
```

PowerShell 写法：

```powershell
$env:TOKEN_STATION_API_KEY = "你的真实密钥"
```

这里有四个必须保持一致的细节：

- `model_provider` 与 `[model_providers.token_station]` 的 ID 一致；
- `env_key` 与实际环境变量名一致；
- `base_url` 保持在 `/v1`，不要重复添加 `/responses`；
- `wire_api` 使用 `"responses"`。

模型 ID 必须使用 Token Station 当前提供的完整值，例如 `openai/gpt-5.6-sol`。不要省略 `openai/`、`glm/`、`google/` 等提供方前缀。

## 第二步：定义不同职责的 Agent

下面是一套详细的角色结构。具体的 feature flag、并发字段和 `config_file` 解析方式可能随 Codex 版本变化，因此请配合 `--strict-config` 和当前 OpenAI Docs 使用。

```toml
[features]
multi_agent = true

[agents]
max_threads = 4
max_depth = 1

[agents.researcher]
description = "只读调查代码与文档，返回证据、文件位置和结论"
config_file = "agents/researcher.toml"

[agents.implementer]
description = "在明确文件范围内实现功能，并运行指定测试"
config_file = "agents/implementer.toml"

[agents.test_writer]
description = "补充测试和失败场景，不改变产品行为"
config_file = "agents/test-writer.toml"

[agents.security_reviewer]
description = "只读审查高风险改动，给出可复现场景"
config_file = "agents/security-reviewer.toml"
```

`description` 是路由的重要依据。它应该写明角色擅长什么、允许做什么以及输出形式，而不是只写“帮助编码”。

### 只读研究 Agent

```toml
model = "openai/gpt-5.6-luna"
model_provider = "token_station"
model_reasoning_effort = "low"
sandbox_mode = "read-only"

developer_instructions = """
只调查指定范围。引用文件路径、行号或文档来源。
不要修改文件，不要扩大任务范围。
明确区分事实、推断和待验证事项。
"""
```

### 代码实现 Agent

```toml
model = "openai/gpt-5.6-terra"
model_provider = "token_station"
model_reasoning_effort = "medium"
sandbox_mode = "workspace-write"

developer_instructions = """
只修改任务中明确列出的目录和文件。
先阅读相邻代码和项目指令，再实现最小完整改动。
运行指定测试，并报告修改文件、测试结果和遗留风险。
"""
```

### 独立审查 Agent

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"
model_reasoning_effort = "high"
sandbox_mode = "read-only"

developer_instructions = """
独立审查实现，不沿用实现者的结论。
只报告可操作、可复现的问题，并给出准确文件位置。
重点检查权限、数据边界、错误处理和测试缺口。
"""
```

如果要使用 GLM、Gemini 或其他模型，只需将角色文件中的 `model` 换成 Token Station 模型列表里的完整 ID。先验证目标模型是否稳定支持 Responses API、多轮工具调用和当前任务需要的上下文长度。

## 如何为任务选择模型

| 任务类型 | 适合的模型特点 | 原因 |
| --- | --- | --- |
| 需求分析、架构设计 | 强推理、高可靠性 | 错误决策会影响后续全部工作 |
| 文件重命名、格式整理 | 快速、低成本 | 工作机械且容易验证 |
| 批量代码实现 | 编码能力强、上下文充足 | 需要处理多个文件和依赖 |
| 搜索与资料归纳 | 速度快、信息提取稳定 | 重点是覆盖面和证据 |
| 测试生成 | 指令遵循稳定、代码能力好 | 输出可以通过测试验证 |
| 安全审查 | 强推理、谨慎 | 漏报和误报成本都较高 |
| 最终代码审查 | 与实现者不同的模型 | 降低同源偏差 |

模型路由可以从四个维度判断。

### 复杂度

跨模块推理、需求取舍和冲突处理留给强模型。机械工作交给快速模型。

### 风险

认证、权限、数据库迁移、支付和数据删除属于高风险工作。它们需要更可靠的模型、收紧权限，并增加独立审查。

### 可验证性

越容易通过测试、类型检查或格式化工具验证的任务，越适合交给便宜、快速的模型。

### 上下文依赖

如果任务高度依赖此前讨论和大量隐含背景，委派可能造成上下文损失。主 Agent 直接完成往往更稳妥。

## 给主 Agent 写清楚路由规则

仅定义多个角色并不会自动产生良好分工。可以在项目的 `AGENTS.md` 中加入：

```markdown
当任务复杂、可并行或需要独立复核时，先判断是否需要 Subagent。

任务路由规则：
- 简单、机械、低风险工作交给 researcher 或快速角色；
- 批量代码实现交给 implementer；
- 外部资料调查交给 researcher，并要求给出来源；
- 测试补充交给 test_writer；
- 架构、安全、权限和最终验收由主 Agent 负责；
- 每个子任务必须包含明确范围、输出和验收标准；
- 不让两个可写 Agent 同时修改同一文件；
- Subagent 结果必须通过测试或独立检查；
- 小任务由主 Agent 直接完成，不为使用 Subagent 而拆分。
```

路由规则要短、明确、可以执行。过长的角色说明会挤占上下文，也容易产生互相冲突的优先级。

## 接入第三方模型后的验证顺序

“兼容 OpenAI API”不代表完整支持 Codex 所需的全部行为。第三方模型可能无法稳定处理工具参数、多轮工具结果、长上下文或控制指令。

每个新模型先按以下顺序测试：

1. 回答一个纯文本问题；
2. 读取一个文件并准确引用位置；
3. 执行一次只读代码搜索；
4. 在临时文件中完成小改动；
5. 根据一次测试失败继续修正；
6. 正确报告超时、权限拒绝和工具错误；
7. 在 Token Station 控制台核对实际模型和请求状态。

只有这些操作稳定后，才把模型加入自动路由。不要用一次成功的文本回复推断它能可靠完成 agentic 编码任务。

## 完整案例：实现文件上传功能

假设需求是：

> 为现有项目增加文件上传功能，支持图片格式检查、大小限制、对象存储和单元测试。

主 Agent 可以建立任务图：

```text
主 Agent
├── Researcher：调查框架上传接口和对象存储 SDK
├── Implementer：实现上传服务和 API
├── Test Writer：编写格式、大小和异常场景测试
└── Security Reviewer：检查路径穿越、MIME 欺骗和资源滥用
```

### Researcher 的任务

```text
阅读项目使用的 Web 框架和对象存储 SDK 文档。

只返回：
1. 推荐的上传处理方式；
2. 流式处理与内存限制；
3. 官方建议的错误处理方式；
4. 相关接口名称和来源。

不要修改代码。
```

### Implementer 的任务

```text
在 src/upload 范围内实现上传服务。

要求：
- 最大文件大小 10 MB；
- 只允许 JPEG、PNG 和 WebP；
- 不信任客户端提供的 Content-Type；
- 使用现有对象存储客户端；
- 不修改数据库结构；
- 完成后列出修改文件、测试结果和待验证事项。
```

### Test Writer 的任务

```text
为上传功能补充测试。

必须覆盖：
- 合法 JPEG；
- 超过大小限制；
- 扩展名和实际内容不一致；
- 空文件；
- 存储服务失败；
- 并发上传时文件名冲突。
```

### Security Reviewer 的任务

```text
只审查上传实现，不修改文件。

重点检查：
- 路径穿越；
- MIME 欺骗；
- 图片解析漏洞；
- 未限制的内存占用；
- 可预测文件名；
- 错误信息泄露。

所有结论必须给出文件位置和可复现场景。
```

最后由主 Agent 检查实际 diff、运行完整测试、解决子任务冲突，并对安全问题作最终判断。多 Agent 的价值来自计划、执行、审查和验收形成闭环，而不是几个模型各自给出答案。

## 常见问题和风险

### 不要无条件创建 Subagent

创建 Subagent 会产生上下文传递和沟通成本。适合拆分的任务通常可以并行、工作量较大、需要不同专业能力、需要独立复核，或有非常清晰的边界。

### 不要让多个可写 Agent 修改同一文件

按目录或模块划分写入范围。一个 Agent 实现、另一个只读审查；存在依赖的任务顺序执行；最终由主 Agent 统一整合。

### 主 Agent 不能盲目信任结果

Subagent 说“已完成”只代表它认为完成了。主 Agent 仍需检查 diff、运行测试、查看错误输出、确认没有越界修改，并验证结果是否满足原始需求。

### 保护 API key 和私有代码

API key 应通过环境变量、密钥管理系统或操作系统凭据存储提供。把任务交给第三方 Provider 时，提示词和代码上下文可能被发送到该服务。私有项目应先确认数据保留、训练使用、存储地区、企业合规要求和禁止外发的目录。

只向 Subagent 提供完成任务所需的最小上下文。

### 低价模型不一定降低总成本

如果便宜模型频繁失败、重试并由强模型返工，总成本可能更高。

```text
有效成本 =
调用成本
+ 重试成本
+ 主 Agent 复核成本
+ 错误修改的修复成本
```

应该记录每类任务的成功率、耗时、重试和返工情况，再调整路由，而不是只比较每百万 Token 的价格。

## 分阶段搭建

### 第一阶段：主 Agent 加只读研究 Agent

先验证仓库搜索、文档调查和结构化汇报。只读权限降低了试错风险。

### 第二阶段：增加快速执行 Agent

分配格式整理、测试样板、文档补全和明确范围内的批量替换，并要求工具验证。

### 第三阶段：增加代码实现 Agent

确认工具调用和文件修改稳定后，再授予工作区写权限。写入范围应按目录或文件明确限制。

### 第四阶段：增加独立审查 Agent

让不同模型分别承担实现和审查，比较它们发现问题的能力。

### 第五阶段：建立自动路由指标

记录成功率、延迟、Token 消耗、重试率和人工返工时间，逐步调整模型与任务的对应关系。

## 总结

成熟的多模型 Subagent 系统不会为每个任务都创建更多 Agent，也不会永远选择最强或最便宜的模型。它会根据复杂度、风险、可验证性和上下文依赖选择足够合适的执行者，并把关键决策、权限控制和最终质量留在主 Agent 手中。

先配置一个可靠的 Provider，再定义少量边界清晰的角色。用 `--strict-config` 检查当前 Codex 版本能否识别字段，从只读任务开始验证，最后再开放自动路由和写入权限。

## 参考资料

- [OpenAI Docs：Codex Multi-agent](https://developers.openai.com/codex/multi-agent/)
- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station 模型列表](https://bec.bytefuture.ai/models)
- [Token Station 控制台](https://bec.bytefuture.ai/dashboard)
