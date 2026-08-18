---
slug: "configure-claude-code-app-with-cc-switch-and-token-station"
lang: "zh"
title: "用 CC Switch 和 Token Station 配置 Claude Code App"
summary: "为 Claude Code App 配置 Token Station Provider，开启模型映射、CC Switch 本地路由和 Claude 路由，再通过真实请求验证完整链路。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

CC Switch 可以保存多组 Claude Code Provider，让你在不同服务之间切换，而不必反复手动修改配置文件。本文将 Claude Code App 接入 Token Station，把 Claude 的 Sonnet、Opus 和 Haiku 角色映射到 Token Station 中可用的模型，并通过 CC Switch 的本地服务转发请求。

> 本文针对 CC Switch 中的 **Claude Code App** 面板。Claude Desktop 和 Claude Code CLI 使用不同的配置路径，不要直接套用它们的步骤。

## 开始之前

请准备：

- 已安装的 CC Switch 和 Claude Code App
- 有效的 Token Station API Key
- 目标模型的调用权限或可用额度

打开 [Token Station 控制台](https://bec.bytefuture.ai/dashboard)，复制模型的完整 ID。不要在截图、聊天记录或 Git 仓库中暴露真实 API Key。

## 完整配置流程

整个过程包括：

1. 在 CC Switch 中新建 Claude Code Provider
2. 填写 Token Station 地址和 API Key
3. 开启 **需要模型映射（Needs model mapping）**
4. 将 Sonnet、Opus、Haiku 映射到 Token Station 模型 ID
5. 开启 CC Switch 本地路由和 Claude 路由
6. 启用 Provider，并完全重启 Claude Code App
7. 发起真实请求，在 Token Station 中核对记录

如果遗漏模型映射或本地路由，即使 CC Switch 显示 Token Station 是当前 Provider，App 仍可能继续使用原来的服务。

## 添加 Token Station Provider

不同版本的 CC Switch 按钮名称可能略有不同，但核心设置一致。

### 1. 新建 Provider

打开 CC Switch，选择 **Claude Code**，进入 Provider 管理页，然后点击“添加”“新建 Provider”或加号按钮。建议使用容易辨认的名称：

```text
Token Station
```

如果界面要求选择 Provider 类型或 API 格式，请选择 Claude、Anthropic 或 **Anthropic Messages（原生）**。

### 2. 填写连接设置

| 字段 | 填写内容 |
| --- | --- |
| 请求地址 / Base URL | `https://bec.bytefuture.ai` |
| API Key / Auth Token | 你的 Token Station API Key |
| API 格式 | Anthropic Messages（原生） |
| 需要模型映射 | 开启 |

<figure>
  <img src="/blog/cc-switch-token-station-provider-settings.png" alt="CC Switch 中的 Token Station Provider 设置，已填写 API Key、请求地址和 Anthropic Messages 格式，并开启模型映射" />
  <figcaption>请求地址使用 Token Station 根地址，API 格式选择 Anthropic Messages（原生）。</figcaption>
</figure>

Base URL 后不要追加 `/v1/messages`。客户端会自动拼接请求路径，重复添加可能返回 404。

如果当前版本以环境变量方式展示配置，请使用：

```text
ANTHROPIC_BASE_URL=https://bec.bytefuture.ai
ANTHROPIC_AUTH_TOKEN=<你的 Token Station API Key>
ANTHROPIC_MODEL=<完整模型 ID>
```

部分模板使用 `ANTHROPIC_API_KEY` 而不是 `ANTHROPIC_AUTH_TOKEN`。应以当前模板显示的字段为准，不要同时填写多个来源不明的密钥字段。

### 3. 必须开启“需要模型映射”

**需要模型映射（Needs model mapping）** 必须保持开启。Claude Code App 会以 Sonnet、Opus、Haiku 等 Claude 角色请求模型，CC Switch 需要把这些角色转换成 Token Station 能识别的完整模型 ID。

<figure>
  <img src="/blog/cc-switch-needs-model-mapping.png" alt="CC Switch Provider 表单中已开启需要模型映射选项" />
  <figcaption>保存 Token Station Provider 前，明确开启“需要模型映射”。</figcaption>
</figure>

如果关闭该选项，Claude 角色名可能未经映射直接发出，导致“模型不存在”，也可能让 App 继续走非预期的链路。

## 配置模型映射

进入 Token Station Provider 的模型映射区域，把每个 Claude 角色指向一个完整的 Token Station 模型 ID。可以先使用下面这组配置：

| Claude 角色 | Token Station 模型 |
| --- | --- |
| Sonnet | `openai/gpt-5.6-terra` |
| Opus | `openai/gpt-5.6-sol` |
| Haiku | `openai/gpt-5.6-luna` |

这些 ID 是配置示例。模型供应会变化，保存前应在 Token Station 中确认当前可用的模型 ID 和账号权限。必须保留 `openai/` 这样的提供方前缀：

```text
openai/gpt-5.6-sol
```

通常可以让 Sonnet 承担默认通用任务，Opus 处理更复杂的工作，Haiku 处理更快、更轻的任务。你也可以根据价格、速度和模型可用性调整映射。关键是每个会被请求的角色都要解析到有效的 Token Station 模型。

## 开启 CC Switch 本地路由

模型映射由本机运行的 CC Switch 服务完成，因此只启用 Provider 还不够。

1. 打开 **CC Switch 设置 → 路由**
2. 开启 **在主页显示本地路由开关**
3. 启动并保持路由总开关运行
4. 在路由启用列表中打开 **Claude**
5. 回到 Claude Code 面板，把本地路由开关切换为 On

<figure>
  <img src="/blog/cc-switch-local-routing-settings.png" alt="CC Switch 路由设置，本地路由正在运行，并已启用 Claude 路由" />
  <figcaption>保持路由服务运行，显示主页开关，并明确启用 Claude 路由。</figcaption>
</figure>

使用这条链路期间，CC Switch 必须保持运行。退出 CC Switch 会停止本地网关，Claude Code App 也就无法通过该配置访问 Token Station。

实际请求路径是：

```text
Claude Code App
  → CC Switch local routing
  → model mapping
  → Token Station
  → selected model
```

## 保存、启用并重启

保存前确认：地址没有多余路径，API Key 前后没有空格，**需要模型映射** 已开启，并且每个模型 ID 都包含提供方前缀。

保存 Provider，选择 **Token Station**，点击“启用”“应用”或“切换”。然后完全退出 Claude Code App 再重新打开。只关闭窗口可能仍会保留使用旧配置的后台进程。

Windows 用户应检查系统托盘，必要时选择“退出”；macOS 用户可以使用 `Command + Q`。重新打开 App 时，CC Switch 和路由服务都要保持运行。

## 验证完整链路

在 Claude Code App 中新建会话并发送：

```text
请只回复：Token Station 测试成功
```

收到回复后，打开 [Token Station 控制台](https://bec.bytefuture.ai/dashboard)，进入 `Recent Activity` 或请求记录，确认：

- 对应时间出现了新请求
- 请求状态为成功
- 实际记录的模型与 CC Switch 中的角色映射一致

App 正常回复，并且 Token Station 出现匹配记录，才能证明整条链路已经生效。仅看到 CC Switch 的“当前 Provider”标签并不足以完成验证。

## 切回原 Provider

建议保留官方 Provider，不要覆盖唯一配置。需要恢复时，选择原 Provider，点击“应用”或“切换”；如果不再需要 Token Station 路由，可以关闭相应开关；然后完全退出并重新打开 Claude Code App。

## 常见问题

### App 仍在使用旧 Provider

完全退出 App，重新应用 Token Station Provider，确认本地路由和 Claude 路由均已开启，再启动 App。

### 没有开启模型映射

编辑 Provider，开启 **需要模型映射**，并检查 Sonnet、Opus、Haiku 是否指向有效的 Token Station 模型 ID。保存后重新应用 Provider。

### 本地路由未开启

进入 **设置 → 路由**，启动路由服务，开启 Claude 路由，再回到 Claude Code 面板打开本地路由开关。

### CC Switch 没有运行

本地网关只在 CC Switch 运行时存在。重新打开 CC Switch，启动路由服务后再测试。

### 提示缺少 API Key，或返回 401、403

检查模板要求的是 `ANTHROPIC_AUTH_TOKEN` 还是 `ANTHROPIC_API_KEY`。确认密钥有效、没有多余空格，并且账号对目标模型有权限和额度。

### 返回 404

Base URL 应为 `https://bec.bytefuture.ai`。删除手动追加的 `/messages`、`/v1/messages` 或其他重复路径。

### 返回模型不存在或无权限

从 Token Station 复制完整模型 ID，并检查对应的 Sonnet、Opus 或 Haiku 映射。不要根据 App 的展示名称猜测模型 ID。

### App 有回复，但 Token Station 没有记录

请求可能仍在使用原服务。逐项检查当前 Provider、模型映射、两个路由开关、App 是否已重启，以及 Token Station 账号和活动记录的时间筛选。

## 安全建议

- 不要在教程截图中显示真实 API Key
- 不要把 CC Switch 配置文件或密钥提交到 Git
- 密钥疑似泄露时，立即撤销并重新生成
- 升级 CC Switch 或 Claude Code App 前备份可用 Provider

## 总结

这套配置需要四部分共同生效：Token Station Provider、**需要模型映射**、CC Switch 本地路由与 Claude 路由，以及 Claude Code App 的完全重启。最后应在 Token Station 活动记录中核对请求，确认实际处理请求的服务和模型。

## 参考资料

- [Token Station 控制台](https://bec.bytefuture.ai/dashboard)
- [CC Switch 项目](https://github.com/farion1231/cc-switch)
