---
slug: "configure-claude-code-app-with-cc-switch-and-token-station"
lang: "en"
title: "Configure the Claude Code App with CC Switch and Token Station"
summary: "Configure a Token Station provider for the Claude Code App, enable model mapping and CC Switch local routing, then verify the complete route with a real request."
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
cover: "blog/configure-claude-code-app-with-cc-switch-and-token-station-cover.png"
draft: false
---

CC Switch can store several Claude Code providers and switch between them without repeatedly editing configuration files. This guide connects the Claude Code App to Token Station, maps Claude's Sonnet, Opus, and Haiku roles to models available in Token Station, and routes requests through the local CC Switch service.

> This guide is for the **Claude Code App** panel in CC Switch. Claude Desktop and the Claude Code CLI use different configuration paths. Do not apply their instructions to this setup.

## Before you start

You need the following in place:

- CC Switch and the Claude Code App
- A valid Token Station API key
- Access to the models you plan to use, and credit to spend on them

Open the [Token Station dashboard](https://bec.bytefuture.ai/dashboard) and copy the complete model IDs. Keep the API key out of screenshots, chat messages, and version control.

## Configuration flow

The complete setup is:

1. Create a Claude Code provider in CC Switch
2. Enter the Token Station endpoint and API key
3. Turn on **Needs model mapping**
4. Map Sonnet, Opus, and Haiku to Token Station model IDs
5. Enable the CC Switch routing service and Claude routing
6. Enable the provider and fully restart the Claude Code App
7. Send a request and verify it in Token Station

Skipping model mapping or local routing can leave the app on its previous service even when CC Switch shows Token Station as the current provider.

## Add the Token Station provider

Button labels can differ slightly between CC Switch releases, but the required settings are the same.

### 1. Create a provider

Open CC Switch, select **Claude Code**, enter provider management, and click Add, New Provider, or the plus button. Give the provider a recognizable name:

```text
Token Station
```

If a provider type or API format is required, select Claude, Anthropic, or **Anthropic Messages (native)**.

### 2. Enter the connection settings

| Field | Value |
| --- | --- |
| Request URL / Base URL | `https://bec.bytefuture.ai` |
| API Key / Auth Token | Your Token Station API key |
| API format | Anthropic Messages (native) |
| Needs model mapping | On |

<figure>
  <img src="/blog/cc-switch-token-station-provider-settings.png" alt="Token Station provider settings in CC Switch with an API key, request URL, Anthropic Messages format, and model mapping enabled" />
  <figcaption>Use the Token Station root URL and the native Anthropic Messages format.</figcaption>
</figure>

Do not append `/v1/messages` to the base URL. The client builds the request path, and duplicating it can cause a 404 response.

If your CC Switch version displays environment variables, use:

```text
ANTHROPIC_BASE_URL=https://bec.bytefuture.ai
ANTHROPIC_AUTH_TOKEN=<YOUR_TOKEN_STATION_API_KEY>
ANTHROPIC_MODEL=<FULL_MODEL_ID>
```

Some templates use `ANTHROPIC_API_KEY` instead of `ANTHROPIC_AUTH_TOKEN`. Follow the fields shown by your current template. Do not fill several undocumented credential fields at the same time.

### 3. Turn on Needs model mapping

The **Needs model mapping** switch must be On. The Claude Code App requests models by Claude roles such as Sonnet, Opus, and Haiku. CC Switch must translate those roles into the full model IDs understood by Token Station.

<figure>
  <img src="/blog/cc-switch-needs-model-mapping.png" alt="CC Switch provider form with the Needs model mapping option enabled" />
  <figcaption>Enable “Needs model mapping” before saving the Token Station provider.</figcaption>
</figure>

If this option is disabled, selecting a Claude role can send an unmapped model name and produce a model-not-found error, or the app may continue using an unintended route.

## Configure model mapping

Open the model mapping area for the Token Station provider and assign each Claude role to a complete Token Station model ID. A practical starting point is:

| Claude role | Token Station model |
| --- | --- |
| Sonnet | `openai/gpt-5.6-terra` |
| Opus | `openai/gpt-5.6-sol` |
| Haiku | `openai/gpt-5.6-luna` |

These IDs are examples. Model availability changes, so confirm the current IDs and your account access in Token Station before saving. Preserve the provider prefix, such as `openai/`:

```text
openai/gpt-5.6-sol
```

Sonnet is normally used for the default general-purpose role, Opus for more demanding work, and Haiku for faster or lighter tasks. You can map them differently according to cost, latency, and model availability. The important point is that every requested role resolves to a valid Token Station model.

## Enable CC Switch local routing

This is the step most often skipped, and skipping it is why the app keeps answering from its old service. Enabling the provider is not enough on its own: the mapping is applied by the CC Switch service running on your computer, so that service has to be up.

1. Open **CC Switch Settings → Routing**
2. Turn on **Show local routing switch on the home page**
3. Start or keep the routing master switch running
4. Enable **Claude** under routing
5. Return to the Claude Code panel and turn its local routing toggle On

<figure>
  <img src="/blog/cc-switch-local-routing-settings.png" alt="CC Switch routing settings with local routing running and Claude routing enabled" />
  <figcaption>Keep the routing service running, expose the home-page switch, and enable Claude routing.</figcaption>
</figure>

CC Switch must remain open while this route is in use. Quitting it stops the local gateway and the Claude Code App can no longer reach Token Station through this configuration.

The active request path is:

```text
Claude Code App
  → CC Switch local routing
  → model mapping
  → Token Station
  → selected model
```

## Save, enable, and restart

Before saving, confirm that the URL has no extra path, the API key has no surrounding whitespace, **Needs model mapping** is On, and every model ID includes its provider prefix.

Save the provider, select **Token Station**, and click Enable, Apply, or Switch. Then completely quit the Claude Code App and reopen it. Closing only the window may leave the process running with its old configuration.

On Windows, check the system tray and choose Quit if necessary. On macOS, use `Command + Q`. Keep CC Switch and its routing service running when you reopen the app.

## Verify the complete route

Start a new conversation in the Claude Code App and send:

```text
Reply only: Token Station test succeeded
```

After the response arrives, open the [Token Station dashboard](https://bec.bytefuture.ai/dashboard) and check `Recent Activity` or the request log. Confirm that:

- The new request appears at the expected time
- The request completed successfully
- The recorded model matches the role mapping in CC Switch

A response in the app and a matching Token Station record together prove that the complete route is active. The Current Provider label in CC Switch is not sufficient evidence by itself.

## Switch back to the original provider

Keep the official provider instead of overwriting it. To restore it, select the original provider, click Apply or Switch, turn off the Token Station route if it is no longer needed, fully quit the Claude Code App, and reopen it.

## Troubleshooting

### The app still uses the old provider

Fully quit the app, apply the Token Station provider again, confirm local routing and Claude routing are On, then reopen the app.

### Model mapping is disabled

Edit the provider, enable **Needs model mapping**, and verify that Sonnet, Opus, and Haiku point to valid Token Station model IDs. Save and reapply the provider.

### Local routing is off

Open **Settings → Routing**, start the routing service, enable Claude routing, and turn on the local routing switch in the Claude Code panel.

### CC Switch is not running

The local gateway exists only while CC Switch is running. Reopen CC Switch, start routing, and retry the request.

### API key is missing, or the response is 401 or 403

Check whether the template expects `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_API_KEY`. Verify that the key is valid, contains no extra whitespace, and has access and credit for the selected model.

### The response is 404

Use `https://bec.bytefuture.ai` as the base URL and remove manually appended `/messages`, `/v1/messages`, or other repeated paths.

### Model not found or access denied

Copy the complete model ID from Token Station and verify the corresponding Sonnet, Opus, or Haiku mapping. Do not infer an ID from the app's display name.

### The app responds, but Token Station has no record

The request may still be using the original service. Check the active provider, model mapping, both routing switches, the app restart, the Token Station account, and the activity time filter.

## Security notes

- Keep real API keys out of tutorial screenshots
- Do not commit CC Switch configuration files or credentials to Git
- Revoke and replace a key immediately if it may have leaked
- Back up a working provider before upgrading CC Switch or the Claude Code App

## Summary

This setup depends on four parts working together: a Token Station provider, **Needs model mapping**, CC Switch local and Claude routing, and a complete restart of the Claude Code App. Verify the result in the Token Station activity log so you know which service and model handled the request.

## References

- [Token Station dashboard](https://bec.bytefuture.ai/dashboard)
- [CC Switch project](https://github.com/farion1231/cc-switch)
