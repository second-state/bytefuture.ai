---
slug: "configure-codex-cli-with-token-station"
lang: "en"
title: "Connect Codex CLI to Token Station on Windows, macOS, and Linux"
summary: "Configure Token Station as a custom provider for Codex CLI, load the API key safely on Windows, macOS, or Linux, and verify a Responses API request."
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

Codex CLI supports custom model providers in `config.toml`. After adding Token Station, you can keep using `codex` and `codex exec` while sending requests through your Token Station API key.

This guide is for the command-line version of Codex. The Codex App can inherit environment variables differently, especially on macOS and Linux desktops, so do not mix the two setup procedures.

## Before you start

Confirm that:

- Codex CLI is installed and `codex --version` returns version information
- You have a working Token Station API key
- Your account has access or available credit for the target model

> Never expose a real API key in documentation, screenshots, chats, or repositories.

## Configure the Token Station provider

Codex CLI reads its user configuration from:

- Windows: `%USERPROFILE%\.codex\config.toml`
- macOS and Linux: `~/.codex/config.toml`

Add:

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

Merge these fields with any existing configuration instead of overwriting settings you still need.

| Field | Purpose |
| --- | --- |
| `model` | Complete default model ID |
| `model_provider` | Provider block Codex should use |
| `name` | Provider display name |
| `base_url` | Token Station API root |
| `env_key` | Environment variable that stores the API key |
| `wire_api` | Selects the Responses API |

Check these details:

- `model_provider = "token_station"` matches `[model_providers.token_station]`
- `base_url` ends at `/v1`, without `/responses`
- `wire_api` is `"responses"`
- The model ID keeps its provider prefix

The examples use `openai/gpt-5.6-sol`. Use the complete current ID shown by Token Station.

## Configure Windows

### Load the key temporarily

Run in PowerShell:

```powershell
$env:TOKEN_STATION_API_KEY = "YOUR_REAL_API_KEY"
```

The variable applies only to the current PowerShell process and its child processes, which is useful for an initial test.

### Save a user environment variable

```powershell
[Environment]::SetEnvironmentVariable(
  "TOKEN_STATION_API_KEY",
  "YOUR_REAL_API_KEY",
  "User"
)
```

Close the terminal and open a new PowerShell window. Existing processes do not receive newly saved variables.

Check that the variable exists without printing the key:

```powershell
if ([string]::IsNullOrEmpty($env:TOKEN_STATION_API_KEY)) {
  "TOKEN_STATION_API_KEY is not set"
} else {
  "TOKEN_STATION_API_KEY is set"
}
```

To remove it later:

```powershell
[Environment]::SetEnvironmentVariable(
  "TOKEN_STATION_API_KEY",
  $null,
  "User"
)
```

## Configure macOS and Linux

Set the variable in the terminal that will run Codex CLI:

```bash
export TOKEN_STATION_API_KEY='YOUR_REAL_API_KEY'
```

Check that it exists:

```bash
if [ -n "${TOKEN_STATION_API_KEY:-}" ]; then
  echo "TOKEN_STATION_API_KEY is set"
else
  echo "TOKEN_STATION_API_KEY is not set"
fi
```

To load it in new terminals, add the `export` command to the configuration file for your shell:

| Shell | Common configuration file |
| --- | --- |
| Zsh | `~/.zshrc` |
| Bash | `~/.bashrc` |
| Fish | `~/.config/fish/config.fish`, with different syntax |

Open a new terminal after editing, or run `source ~/.zshrc` or `source ~/.bashrc`.

> A key in a shell configuration file is stored as plaintext. Keep that file out of Git and public sync folders.

## Verify the configuration

Start an interactive session:

```bash
codex
```

Then send:

```text
Reply only: Token Station test succeeded
```

You can also run a non-interactive request:

```bash
codex exec 'Reply only: Token Station test succeeded'
```

In PowerShell, use double quotes:

```powershell
codex exec "Reply only: Token Station test succeeded"
```

After the response arrives, open the [Token Station dashboard](https://bec.bytefuture.ai/dashboard). Match the request time, status, and model under `Recent Activity`.

The setup is complete only when:

- `codex` or `codex exec` returns a normal result
- Token Station shows the matching request
- The recorded model matches the configuration

## Troubleshooting

### `codex` command not found

Confirm that Codex CLI is installed and its installation directory is in `PATH`. Open a new terminal after installation or a `PATH` change, then run `codex --version`.

### Codex cannot find the API key

Confirm that:

- The variable is named `TOKEN_STATION_API_KEY`
- `config.toml` uses `env_key = "TOKEN_STATION_API_KEY"`
- Codex starts from the same terminal that contains the variable
- A new terminal was opened after saving a persistent variable

### 401 or 403 response

The key may be invalid, contain extra whitespace, lack model access, or have no available credit.

### 404 response

Check:

```toml
base_url = "https://bec.bytefuture.ai/v1"
wire_api = "responses"
```

Do not append `/responses` to the base URL.

### Model not found or request failed

Use the complete model ID currently supplied by Token Station and keep its provider prefix.

### Old configuration is still active

Confirm that you edited the current user's `config.toml`, that the file extension is correct, and that you restarted the Codex CLI process.

## Security notes

- Do not put a real key in `config.toml`
- Do not commit shell configuration files that contain keys
- Prefer temporary environment variables on shared computers
- Revoke and replace a key immediately if it may have leaked

## References

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station dashboard](https://bec.bytefuture.ai/dashboard)
