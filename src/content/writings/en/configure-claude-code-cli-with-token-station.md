---
slug: "configure-claude-code-cli-with-token-station"
lang: "en"
title: "Connect Claude Code CLI to Token Station on Windows, macOS, and Linux"
summary: "Configure Claude Code CLI to call models through Token Station on Windows, macOS, and Linux, then verify the connection with a real request and the Token Station activity log."
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

Claude Code CLI can connect to third-party model gateways through the Anthropic Messages API. Point its request URL, API key, and model ID at Token Station to keep using the familiar `claude` command with models available through Token Station.

This guide covers Windows, macOS, and Linux. Two details matter most: do not append `/v1` to the base URL, and keep the provider prefix in model IDs such as `openai/` or `anthropic/`.

## Before you start

You need:

- Claude Code CLI installed, with `claude --version` returning version information
- A [Token Station](https://bec.bytefuture.ai/intro.html) account and API key
- Access or available credit for the target model

The examples use `openai/gpt-5.6-sol`. Model IDs can change, so copy the complete ID from the current [Token Station model list](https://bec.bytefuture.ai/models).

> Never put a real API key in a repository, public document, screenshot, or chat message.

## Variables to configure

| Environment variable | Purpose | Example |
| --- | --- | --- |
| `ANTHROPIC_BASE_URL` | Routes Claude Code requests to Token Station | `https://bec.bytefuture.ai` |
| `ANTHROPIC_AUTH_TOKEN` | Your Token Station API key | Your real key |
| `ANTHROPIC_MODEL` | Complete default model ID | `openai/gpt-5.6-sol` |

Claude Code adds the Anthropic Messages API path to the base URL. Use:

```text
https://bec.bytefuture.ai
```

Do not use `https://bec.bytefuture.ai/v1`. The extra segment can produce a duplicated path and a 404 response.

Keep the full model ID as well:

```text
openai/gpt-5.6-sol
```

Do not shorten it to `gpt-5.6-sol`.

## Configure Windows

### Temporary configuration

Run this in PowerShell:

```powershell
$env:ANTHROPIC_BASE_URL = "https://bec.bytefuture.ai"
$env:ANTHROPIC_AUTH_TOKEN = "YOUR_REAL_API_KEY"
$env:ANTHROPIC_MODEL = "openai/gpt-5.6-sol"

claude
```

These variables apply only to the current PowerShell process and its child processes. This is a good choice for the first test.

### Save user environment variables

To make new terminals load the configuration, run:

```powershell
[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_BASE_URL",
  "https://bec.bytefuture.ai",
  "User"
)

[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_AUTH_TOKEN",
  "YOUR_REAL_API_KEY",
  "User"
)

[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_MODEL",
  "openai/gpt-5.6-sol",
  "User"
)
```

Close the current PowerShell window and open a new one before running `claude`. Existing processes do not receive newly saved variables.

To remove the variables later:

```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_MODEL", $null, "User")
```

## Configure macOS and Linux

Run these commands in the terminal that will start Claude Code:

```bash
export ANTHROPIC_BASE_URL='https://bec.bytefuture.ai'
export ANTHROPIC_AUTH_TOKEN='YOUR_REAL_API_KEY'
export ANTHROPIC_MODEL='openai/gpt-5.6-sol'

claude
```

The variables apply only to the current shell and its child processes. To load them in new terminals, add the three `export` lines to the configuration file for your shell:

| Shell | Common configuration file |
| --- | --- |
| Zsh | `~/.zshrc` |
| Bash | `~/.bashrc` |
| Fish | `~/.config/fish/config.fish`, with different syntax |

Open a new terminal after editing the file, or reload it for the current shell:

```bash
source ~/.zshrc
```

For Bash:

```bash
source ~/.bashrc
```

> A key stored in a shell configuration file remains as plaintext on disk. Keep that file out of Git and public sync folders. For stricter environments, use a system keychain, password manager, or temporary environment variable.

## Verify the connection

Starting Claude Code does not prove that the gateway is in use. Send a real request from the same terminal that contains the variables:

```bash
claude -p 'Reply only: Token Station test succeeded'
```

In PowerShell:

```powershell
claude -p "Reply only: Token Station test succeeded"
```

After the response arrives, open the [Token Station dashboard](https://bec.bytefuture.ai/dashboard). Check the request time, status, and model under `Recent Activity`.

The connection is complete only when:

- Claude Code returns a normal response
- The matching request appears in Token Station
- The recorded model matches your configuration

## Optional model mappings

Some Claude Code tasks use the Opus, Sonnet, or Haiku tier. You can map each tier to a different Token Station model:

```bash
export ANTHROPIC_DEFAULT_OPUS_MODEL='openai/gpt-5.6-sol'
export ANTHROPIC_DEFAULT_SONNET_MODEL='openai/gpt-5.6-terra'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='openai/gpt-5.6-luna'
```

The equivalent PowerShell variables are:

```powershell
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "openai/gpt-5.6-sol"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "openai/gpt-5.6-terra"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "openai/gpt-5.6-luna"
```

If you want to pin one model, `ANTHROPIC_MODEL` is enough. Always confirm current availability in the Token Station model list.

## Troubleshooting

### Claude Code still asks for an Anthropic login

Confirm that the API key is loaded and start Claude Code from the same terminal that set the variables. On Windows, open a new PowerShell window after saving user variables.

### 401 or 403 response

The API key may be invalid, contain extra whitespace, lack model access, or have no available credit. Copy it again and check the account status in Token Station.

### 404 response

The base URL must be:

```text
https://bec.bytefuture.ai
```

Do not append `/v1` or `/v1/messages`.

### Model not found

Use the complete model ID shown by Token Station and keep its provider prefix.

### Claude Code responds, but Token Station has no record

The current process may not be using Token Station. Check `ANTHROPIC_BASE_URL`, set the variables again, and run another `claude -p` request from the same terminal.

## References

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station model list](https://bec.bytefuture.ai/models)
- [Token Station dashboard](https://bec.bytefuture.ai/dashboard)
