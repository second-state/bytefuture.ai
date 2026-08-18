---
slug: "configure-codex-cli-with-token-station"
lang: "zh"
title: "Codex CLI 接入 Token Station：跨平台配置与验证"
summary: "介绍如何为 Codex CLI 配置 Token Station 自定义模型提供方，在 Windows、macOS 和 Linux 中安全加载 API Key，并验证 Responses API 请求。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

Codex CLI 支持通过 `config.toml` 注册自定义模型提供方。配置 Token Station 后，可以继续使用 `codex` 和 `codex exec`，并通过 Token Station API Key 调用指定模型。

本文面向命令行版 Codex。Codex App 的环境变量继承方式不同，尤其是在 macOS 和 Linux 桌面环境中，请不要直接混用两套步骤。

## 开始之前

请确认：

- 已安装 Codex CLI，运行 `codex --version` 可以看到版本信息；
- 已获取可用的 Token Station API Key；
- 账户拥有目标模型的调用权限或可用额度。

> 不要在文档、截图、聊天记录或代码仓库中公开真实密钥。

## 配置 Token Station Provider

Codex CLI 默认读取用户目录下的配置文件：

- Windows：`%USERPROFILE%\.codex\config.toml`
- macOS 和 Linux：`~/.codex/config.toml`

将以下内容加入 `config.toml`：

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

如果文件中已有配置，请合并这些字段，不要直接覆盖其他仍需保留的设置。

| 字段 | 作用 |
| --- | --- |
| `model` | 默认请求的完整模型 ID |
| `model_provider` | 当前使用的 provider 配置块 |
| `name` | Provider 的显示名称 |
| `base_url` | Token Station 的 API 根地址 |
| `env_key` | Codex 读取 API Key 的环境变量名 |
| `wire_api` | 指定使用 Responses API |

配置时注意：

- `model_provider = "token_station"` 必须与 `[model_providers.token_station]` 对应；
- `base_url` 只写到 `/v1`，不要添加 `/responses`；
- `wire_api` 使用 `"responses"`；
- 模型 ID 保留 `openai/` 等提供方前缀。

本文以 `openai/gpt-5.6-sol` 为例。实际使用时，以 Token Station 当前模型列表为准。

## Windows 配置

### 临时加载 API Key

在 PowerShell 中执行：

```powershell
$env:TOKEN_STATION_API_KEY = "你的真实密钥"
```

变量只对当前 PowerShell 及其子进程有效，适合首次验证。

### 保存为用户环境变量

```powershell
[Environment]::SetEnvironmentVariable(
  "TOKEN_STATION_API_KEY",
  "你的真实密钥",
  "User"
)
```

保存后关闭当前终端，再打开新的 PowerShell。已有进程不会自动获得新变量。

检查变量是否存在，但不直接打印密钥：

```powershell
if ([string]::IsNullOrEmpty($env:TOKEN_STATION_API_KEY)) {
  "TOKEN_STATION_API_KEY 未设置"
} else {
  "TOKEN_STATION_API_KEY 已设置"
}
```

如需清除用户变量：

```powershell
[Environment]::SetEnvironmentVariable(
  "TOKEN_STATION_API_KEY",
  $null,
  "User"
)
```

## macOS 和 Linux 配置

在启动 Codex CLI 的终端中执行：

```bash
export TOKEN_STATION_API_KEY='你的真实密钥'
```

检查变量是否存在：

```bash
if [ -n "${TOKEN_STATION_API_KEY:-}" ]; then
  echo "TOKEN_STATION_API_KEY 已设置"
else
  echo "TOKEN_STATION_API_KEY 未设置"
fi
```

需要让新终端自动加载时，将 `export` 加入当前 Shell 的配置文件：

| Shell | 常见配置文件 |
| --- | --- |
| Zsh | `~/.zshrc` |
| Bash | `~/.bashrc` |
| Fish | `~/.config/fish/config.fish`，语法不同 |

修改后重新打开终端，或执行 `source ~/.zshrc`、`source ~/.bashrc`。

> Shell 配置文件中的 API Key 会以明文保存在磁盘上。请确保文件不会被提交到 Git 或同步到公共位置。

## 验证配置

可以先启动交互模式：

```bash
codex
```

进入 Codex CLI 后发送：

```text
请只回复：Token Station 测试成功
```

也可以直接运行一次非交互任务：

```bash
codex exec '请只回复：Token Station 测试成功'
```

PowerShell 可使用双引号：

```powershell
codex exec "请只回复：Token Station 测试成功"
```

收到回复后，打开 [Token Station 控制台](https://bec.bytefuture.ai/dashboard)，在 `Recent Activity` 中核对请求时间、状态和模型。

只有同时满足以下条件，才表示接入成功：

- `codex` 或 `codex exec` 正常返回结果；
- Token Station 控制台出现对应记录；
- 记录中的模型与配置一致。

## 常见问题

### 找不到 `codex` 命令

确认 Codex CLI 已安装，并且安装目录已经加入 `PATH`。安装或修改 `PATH` 后重新打开终端，再运行 `codex --version`。

### Codex 提示找不到 API Key

确认：

- 环境变量名是 `TOKEN_STATION_API_KEY`；
- `config.toml` 中使用 `env_key = "TOKEN_STATION_API_KEY"`；
- Codex 从设置变量的同一终端启动；
- 持久化变量后已经打开新终端。

### 返回 401 或 403

通常是 API Key 无效、密钥前后有空格、账户无权限或额度不足。

### 返回 404

检查：

```toml
base_url = "https://bec.bytefuture.ai/v1"
wire_api = "responses"
```

不要在 Base URL 后手动添加 `/responses`。

### 模型不存在或调用失败

确认 `model` 与 Token Station 当前提供的完整模型 ID 一致，并保留提供方前缀。

### 修改配置后仍使用旧设置

确认修改的是当前用户的 `config.toml`，文件扩展名正确，并退出旧的 Codex CLI 进程后重新运行。

## 安全建议

- 不要把真实密钥写入 `config.toml`；
- 不要把包含密钥的 Shell 配置文件提交到 Git；
- 共享计算机优先使用临时环境变量；
- 密钥疑似泄露时，立即在 Token Station 中撤销并重新生成。

## 参考资料

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station 控制台](https://bec.bytefuture.ai/dashboard)
