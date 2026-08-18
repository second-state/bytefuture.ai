---
slug: "configure-codex-app-with-token-station"
lang: "zh"
title: "Codex App 接入 Token Station：跨平台配置与验证"
summary: "介绍如何在 Codex App 中注册 Token Station 模型提供方，分别为 Windows、macOS 和 Linux 配置 API Key，并完成端到端验证。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
cover: "blog/configure-codex-app-with-token-station-cover.png"
draft: false
---

Codex App 可以通过 `config.toml` 注册自定义模型提供方。将 provider 指向 Token Station 的 Responses API 后，Codex 就能使用 Token Station 提供的模型，并通过你的 Token Station API Key 计费。

本文介绍 Windows、macOS 和 Linux 的配置方式。桌面 App 与终端程序的环境变量来源可能不同，其中 macOS 从 Dock 或 Finder 启动的 App 通常不会读取 `~/.zshrc`。

## 开始之前

请准备：

- 已安装 Codex App；
- 一个可用的 [Token Station](https://bec.bytefuture.ai/intro.html) 账户和 API Key；
- 目标模型的调用权限和可用额度。

本文以 `openai/gpt-5.6-sol` 为例。请以 Token Station 当前显示的完整模型 ID 为准。

> 不要把真实 API Key 写入 `config.toml`、截图、聊天消息或代码仓库。本文让 Codex 从环境变量读取密钥。

## 注册 Token Station Provider

在 Codex App 中进入 **设置 → 配置 → 打开 config.toml**，加入：

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

如果文件中已有其他配置，请合并这些字段，不要覆盖仍需保留的设置。

| 字段 | 作用 |
| --- | --- |
| `model` | Codex 默认请求的完整模型 ID |
| `model_provider` | 当前使用的 provider 配置块 |
| `name` | Provider 的显示名称 |
| `base_url` | Token Station 的 API 根地址 |
| `env_key` | Codex 读取 API Key 的环境变量名 |
| `wire_api` | 指定使用 Responses API |

两处 `token_station` 必须一致：

```toml
model_provider = "token_station"
[model_providers.token_station]
```

`base_url` 只写到 `/v1`，不要手动添加 `/responses`。模型名称也要保留 `openai/` 等提供方前缀。

Provider 配置只声明了环境变量的名字，并没有提供它的值；而桌面应用看到的环境未必和你的终端一致。下面三节分别说明各操作系统的做法。

## Windows：配置 API Key

打开 **高级系统设置 → 环境变量**，在“用户变量”区域新建：

| 项目 | 值 |
| --- | --- |
| 变量名 | `TOKEN_STATION_API_KEY` |
| 变量值 | 你的真实 Token Station API Key |

变量名必须与 `config.toml` 中的 `env_key` 完全一致。

保存后完全退出 Codex App，再重新打开。只关闭窗口不一定会结束进程，已经运行的 App 也不会自动获得新变量。

## macOS：配置 API Key

从 Dock、Finder 或 Launchpad 启动的 App 通常不会继承当前终端中的 `export`。可以将变量加入当前图形登录会话：

```bash
launchctl setenv TOKEN_STATION_API_KEY '你的真实密钥'
```

检查变量是否存在，但不直接打印密钥：

```bash
if [ -n "$(launchctl getenv TOKEN_STATION_API_KEY)" ]; then
  echo "TOKEN_STATION_API_KEY 已设置"
else
  echo "TOKEN_STATION_API_KEY 未设置"
fi
```

设置后按 `Command + Q` 完全退出 Codex App，再从 Dock、Finder 或 Launchpad 重新打开。

`launchctl setenv` 设置的变量通常只对当前图形登录会话有效。注销或重启后可能需要重新执行。需要清除时使用：

```bash
launchctl unsetenv TOKEN_STATION_API_KEY
```

## Linux：配置 API Key

Linux 桌面环境的变量继承方式因发行版和安装方式而异。如果从终端启动 Codex，可以先在当前 Shell 中设置：

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

然后从同一终端启动 Codex。需要让新终端自动加载时，可将 `export` 加入 `~/.bashrc` 或 `~/.zshrc`。

如果从 GNOME、KDE 等桌面菜单启动 App，并且系统使用 systemd 用户会话，可以尝试：

```bash
systemctl --user set-environment TOKEN_STATION_API_KEY='你的真实密钥'
```

设置后完全退出并重新打开 App。需要清除时执行：

```bash
systemctl --user unset-environment TOKEN_STATION_API_KEY
```

> 将 API Key 写入 Shell 配置文件会以明文保存在磁盘上。请确保文件不会进入 Git 或公共同步目录。

## 端到端验证

Codex App 能回复只是证据的一半。链路两端都要检查：

1. 完全退出并重新打开 Codex App；
2. 新建对话；
3. 发送：

   ```text
   请只回复：Token Station 测试成功
   ```

4. 确认 Codex App 收到正常回复；
5. 打开 [Token Station 控制台](https://bec.bytefuture.ai/dashboard)；
6. 在 `Recent Activity` 中核对请求时间、状态和模型。

链路应为：

```text
Codex App
  → config.toml 中的 token_station provider
  → TOKEN_STATION_API_KEY
  → https://bec.bytefuture.ai/v1/responses
  → Token Station 调用记录
```

只有 App 正常返回结果，并且控制台出现对应记录，才能确认接入成功。

## 常见问题

### Codex 提示找不到 API Key

确认环境变量名与 `env_key = "TOKEN_STATION_API_KEY"` 完全一致，并在设置变量后重启 App。

macOS 如果只在 `~/.zshrc` 中写了 `export`，从 Dock 启动的 App 可能无法读取。请使用 `launchctl setenv`，再重启 App。

### 返回 401 或 403

通常是 API Key 无效、密钥前后有空格、账户无权限或额度不足。

### 返回 404

检查：

```toml
base_url = "https://bec.bytefuture.ai/v1"
wire_api = "responses"
```

不要在 Base URL 后重复添加 `/responses`。

### 提示模型不存在

确认 `model` 使用 Token Station 提供的完整模型 ID，并保留提供方前缀。

### Codex 有回复，但控制台没有记录

检查 `model_provider` 与 provider 配置块名称是否一致，并确认 App 已重新加载修改后的 `config.toml`。按请求时间重新核对控制台记录。

## 参考资料

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station 控制台](https://bec.bytefuture.ai/dashboard)
