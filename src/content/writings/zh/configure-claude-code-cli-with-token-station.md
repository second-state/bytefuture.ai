---
slug: "configure-claude-code-cli-with-token-station"
lang: "zh"
title: "Claude Code CLI 接入 Token Station：跨平台配置与验证"
summary: "介绍如何在 Windows、macOS 和 Linux 中配置 Claude Code CLI，通过 Token Station 调用模型，并使用真实请求和控制台记录完成端到端验证。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

Claude Code CLI 可以通过 Anthropic Messages API 连接第三方模型网关。将请求地址、API Key 和模型 ID 指向 Token Station 后，就能继续使用熟悉的 `claude` 命令，同时调用 Token Station 提供的模型。

本文介绍 Windows、macOS 和 Linux 的配置方法。需要特别注意两点：Base URL 不要手动添加 `/v1`，模型 ID 必须保留 `openai/`、`anthropic/` 等提供方前缀。

## 开始之前

请准备：

- 已安装 Claude Code CLI，运行 `claude --version` 可以看到版本信息；
- 一个可用的 [Token Station](https://bec.bytefuture.ai/intro.html) 账户和 API Key；
- 目标模型的调用权限和可用额度。

本文以 `openai/gpt-5.6-sol` 为例。模型 ID 可能随平台更新，请以 [Token Station 模型列表](https://bec.bytefuture.ai/models) 显示的完整 ID 为准。

> 不要把真实 API Key 写入代码仓库、公开文档、截图或聊天消息。

## 需要配置的变量

| 环境变量 | 作用 | 示例值 |
| --- | --- | --- |
| `ANTHROPIC_BASE_URL` | 将 Claude Code 请求指向 Token Station | `https://bec.bytefuture.ai` |
| `ANTHROPIC_AUTH_TOKEN` | Token Station API Key | 你的真实密钥 |
| `ANTHROPIC_MODEL` | 默认模型的完整 ID | `openai/gpt-5.6-sol` |

Claude Code 会在 Base URL 后使用 Anthropic Messages API 路径，因此地址应写为：

```text
https://bec.bytefuture.ai
```

不要写成 `https://bec.bytefuture.ai/v1`，否则可能出现重复路径并返回 404。

模型 ID 同样要保持完整：

```text
openai/gpt-5.6-sol
```

不要简写为 `gpt-5.6-sol`。

这三个变量的加载方式因操作系统而异。

## Windows 配置

### 临时配置

在 PowerShell 中执行：

```powershell
$env:ANTHROPIC_BASE_URL = "https://bec.bytefuture.ai"
$env:ANTHROPIC_AUTH_TOKEN = "你的真实密钥"
$env:ANTHROPIC_MODEL = "openai/gpt-5.6-sol"

claude
```

这些变量只对当前 PowerShell 及其子进程有效，适合首次测试。

### 保存为用户环境变量

需要让新终端自动读取配置时，执行：

```powershell
[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_BASE_URL",
  "https://bec.bytefuture.ai",
  "User"
)

[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_AUTH_TOKEN",
  "你的真实密钥",
  "User"
)

[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_MODEL",
  "openai/gpt-5.6-sol",
  "User"
)
```

保存后关闭当前 PowerShell，再打开新窗口运行 `claude`。已有进程不会自动获得新变量。

如需清除配置：

```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_MODEL", $null, "User")
```

## macOS 和 Linux 配置

在启动 Claude Code 的终端中执行：

```bash
export ANTHROPIC_BASE_URL='https://bec.bytefuture.ai'
export ANTHROPIC_AUTH_TOKEN='你的真实密钥'
export ANTHROPIC_MODEL='openai/gpt-5.6-sol'

claude
```

变量只在当前 Shell 及其子进程中有效。需要持久化时，可将三行 `export` 加入对应的 Shell 配置文件：

| Shell | 常见配置文件 |
| --- | --- |
| Zsh | `~/.zshrc` |
| Bash | `~/.bashrc` |
| Fish | `~/.config/fish/config.fish`，语法与 Bash/Zsh 不同 |

修改后重新打开终端，或按实际 Shell 执行：

```bash
source ~/.zshrc
```

或：

```bash
source ~/.bashrc
```

> 将 API Key 写入 Shell 配置文件会以明文保存在磁盘上。请确认该文件不会进入 Git 或公共同步目录。安全要求较高时，优先使用系统密钥环、密码管理器或临时环境变量。

## 验证配置

不要只根据 Claude Code 能否启动来判断配置是否成功。请从已经设置变量的终端发起一次真实请求：

```bash
claude -p '请只回复：Token Station 测试成功'
```

PowerShell 可以执行：

```powershell
claude -p "请只回复：Token Station 测试成功"
```

收到回复后，打开 [Token Station 控制台](https://bec.bytefuture.ai/dashboard)，在 `Recent Activity` 中核对请求时间、状态和模型。

只有同时满足以下条件，才表示链路已经跑通：

- Claude Code 正常返回结果；
- Token Station 控制台出现对应记录；
- 记录中的模型与配置一致。

## 可选：为不同档位指定模型

Claude Code 的部分任务会使用 Opus、Sonnet 或 Haiku 档位。可以分别映射到 Token Station 中的模型：

```bash
export ANTHROPIC_DEFAULT_OPUS_MODEL='openai/gpt-5.6-sol'
export ANTHROPIC_DEFAULT_SONNET_MODEL='openai/gpt-5.6-terra'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='openai/gpt-5.6-luna'
```

Windows PowerShell 对应写法：

```powershell
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "openai/gpt-5.6-sol"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "openai/gpt-5.6-terra"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "openai/gpt-5.6-luna"
```

如果只想固定使用一个模型，保留 `ANTHROPIC_MODEL` 即可。具体可用模型仍以 Token Station 当前列表为准。

## 常见问题

### Claude Code 仍要求登录 Anthropic 账户

确认 API Key 已加载，并从设置变量的同一个终端启动 Claude Code。Windows 用户如果刚写入用户环境变量，需要打开新的 PowerShell 窗口。

### 返回 401 或 403

通常是 API Key 无效、密钥前后有空格、账户无权限或额度不足。重新复制密钥，并在 Token Station 控制台检查账户状态。

### 返回 404

检查 Base URL 是否为：

```text
https://bec.bytefuture.ai
```

不要在末尾添加 `/v1` 或 `/v1/messages`。

### 提示模型不存在

确认 `ANTHROPIC_MODEL` 使用 Token Station 显示的完整模型 ID，并保留提供方前缀。

### Claude Code 有回复，但控制台没有记录

这通常说明当前进程没有使用 Token Station。检查 `ANTHROPIC_BASE_URL`，重新设置变量后，在同一终端运行一次 `claude -p` 再核对记录。

## 参考资料

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station 模型列表](https://bec.bytefuture.ai/models)
- [Token Station 控制台](https://bec.bytefuture.ai/dashboard)
