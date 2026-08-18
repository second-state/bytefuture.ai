---
slug: "configure-codex-app-with-token-station"
lang: "en"
title: "Connect the Codex App to Token Station on Windows, macOS, and Linux"
summary: "Register Token Station as a custom model provider in the Codex App, load the API key on Windows, macOS, or Linux, and verify the complete Responses API route."
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
cover: "blog/configure-codex-app-with-token-station-cover.png"
draft: false
---

The Codex App can register a custom model provider in `config.toml`. Point that provider at the Token Station Responses API to use models available through Token Station and bill requests to your Token Station API key.

This guide covers Windows, macOS, and Linux. Desktop apps and terminal programs may inherit environment variables from different sources. On macOS, an app launched from the Dock or Finder usually does not read `~/.zshrc`.

## Before you start

You need three things:

- The Codex App installed
- A [Token Station](https://bec.bytefuture.ai/intro.html) account and API key
- Access to the target model, and credit to spend on it

The examples use `openai/gpt-5.6-sol`. Copy the complete current model ID from Token Station.

> Never put a real API key in `config.toml`, a screenshot, a chat message, or a repository. Codex will read it from an environment variable.

## Register the Token Station provider

In the Codex App, open **Settings → Configuration → Open config.toml**, then add:

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
| `name` | Display name for the provider |
| `base_url` | Token Station API root |
| `env_key` | Environment variable that stores the API key |
| `wire_api` | Selects the Responses API |

The two `token_station` identifiers must match:

```toml
model_provider = "token_station"
[model_providers.token_station]
```

Keep `base_url` at `/v1`; do not append `/responses`. Keep the provider prefix in the model ID as well.

The provider block names the environment variable but does not supply its value, and a desktop app does not always see what your shell sees. The next three sections cover each operating system.

## Windows: load the API key

Open **Advanced system settings → Environment Variables**. Under User variables, create:

| Item | Value |
| --- | --- |
| Variable name | `TOKEN_STATION_API_KEY` |
| Variable value | Your real Token Station API key |

The variable name must exactly match `env_key` in `config.toml`.

Save the variable, then quit the Codex App completely and reopen it. Closing the window often leaves the process running, and a running app will not see the new variable.

## macOS: load the API key

An app launched from the Dock, Finder, or Launchpad usually does not inherit an `export` from the current terminal. Add the key to the current graphical login session:

```bash
launchctl setenv TOKEN_STATION_API_KEY 'YOUR_REAL_API_KEY'
```

Check that the variable exists without printing the key:

```bash
if [ -n "$(launchctl getenv TOKEN_STATION_API_KEY)" ]; then
  echo "TOKEN_STATION_API_KEY is set"
else
  echo "TOKEN_STATION_API_KEY is not set"
fi
```

Press `Command + Q` to quit the Codex App, then reopen it from the Dock, Finder, or Launchpad.

A variable set with `launchctl setenv` usually lasts only for the current graphical login session. You may need to set it again after a logout or restart. To remove it:

```bash
launchctl unsetenv TOKEN_STATION_API_KEY
```

## Linux: load the API key

Environment inheritance varies by distribution, desktop environment, and installation method. If you start Codex from a terminal, set the variable in that shell:

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

Start Codex from the same terminal. To load the key in new terminals, add the `export` command to `~/.bashrc` or `~/.zshrc`.

If the app starts from GNOME, KDE, or another desktop menu and the system uses a systemd user session, you can try:

```bash
systemctl --user set-environment TOKEN_STATION_API_KEY='YOUR_REAL_API_KEY'
```

Fully quit and reopen the app. To clear the variable:

```bash
systemctl --user unset-environment TOKEN_STATION_API_KEY
```

> A key in a shell configuration file is stored as plaintext. Keep that file out of Git and public sync folders.

## Verify the complete route

A reply in the app is only half the evidence. Check both ends of the route:

1. Fully quit and reopen the Codex App
2. Create a new conversation
3. Send:

   ```text
   Reply only: Token Station test succeeded
   ```

4. Confirm that the app returns a normal response
5. Open the [Token Station dashboard](https://bec.bytefuture.ai/dashboard)
6. Check the request time, status, and model under `Recent Activity`

The route should be:

```text
Codex App
→ token_station provider in config.toml
  → TOKEN_STATION_API_KEY
  → https://bec.bytefuture.ai/v1/responses
→ Token Station request log
```

The setup is complete only when the app responds and Token Station shows the matching record.

## Troubleshooting

### Codex cannot find the API key

Confirm that the variable name exactly matches `env_key = "TOKEN_STATION_API_KEY"`, then restart the app after setting it.

On macOS, an `export` in `~/.zshrc` may not reach an app launched from the Dock. Use `launchctl setenv` and restart the app.

### 401 or 403 response

The key may be invalid, contain extra whitespace, lack model access, or have no available credit.

### 404 response

Recheck these two fields:

```toml
base_url = "https://bec.bytefuture.ai/v1"
wire_api = "responses"
```

Do not append another `/responses` segment.

### Model not found

Use the complete model ID supplied by Token Station and keep its provider prefix.

### Codex responds, but Token Station has no record

Check that `model_provider` matches the provider block name and that the app reloaded the edited `config.toml`. Test again and match the request by time.

## References

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station dashboard](https://bec.bytefuture.ai/dashboard)
