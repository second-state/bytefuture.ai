---
slug: "route-cursor-through-token-station-openai"
lang: "en"
title: "Route Cursor through Token Station: GPT-6 Astra and GPT-5.6"
summary: "Cursor supports custom OpenAI-compatible providers through Settings, Models. Point it at Token Station and OpenAI's GPT-6 Astra and the GPT-5.6 family show up as selectable models, now with confirmed Agent-mode file edits across all four routes: an adapter attached to your Token Station API key resolves the tool-call format gap that previously blocked OpenAI models from editing files in Cursor."
category: "tutorial"
date: "2026-09-08"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-openai-cover.png"
draft: false
---

Cursor supports custom OpenAI-compatible providers through Settings → Models. Point it at Token Station's endpoint and you can add OpenAI's GPT-6 Astra and the GPT-5.6 family (Sol, Terra, Luna) as selectable models, each billed through your own Token Station key.

This wasn't possible in practice until recently. Earlier testing (alongside our [Cursor setup with Claude Sonnet 5 and Haiku](/blog/route-cursor-through-token-station.html)) found that Token Station's GPT-5.6 routes could read and discuss code in Cursor's Agent mode but consistently failed to apply actual file edits, a tool-call response format gap on Token Station's side. The specific gap: OpenAI's models represent a file edit as an `ApplyPatch` tool call, a different response shape than Cursor's Agent mode was reading correctly before. Token Station keys can now carry a small adapter that rewrites that response into the shape Cursor expects, scoped specifically to Cursor talking to OpenAI and OpenAI-Codex models: other tools and other providers routed through the same key are unaffected. This walks through the setup end to end, including attaching that adapter, and confirms it works.

Before the setup, it's worth being explicit about why to route Cursor through Token Station at all, rather than paying Cursor directly. Three concrete reasons stand out. Cursor's Pro plan bundles a handful of models (Grok 4.6, Grok 4.5, Composer 2.5) into a shared monthly usage pool and meters everything else from a separate pool at each model's own API price, but neither pool gives you a per-model, per-request breakdown of what you actually spent. A Token Station key sidesteps both: BYOK requests go straight to Token Station's endpoint, never touch Cursor's own billing, and land on your own dashboard priced at the provider's real rate, with zero markup. Second, if Cursor is one of several coding tools you use (alongside Claude Code, Codex, or OpenClaw, say), the same Token Station key and the same model IDs work in all of them: one account and one balance to track, instead of separate keys, separate top-ups, and separate invoices per tool. Third, Token Station's catalog runs past 300 models across 30+ providers, well beyond whatever Cursor happens to bundle into its own pools.

## What you need before starting

- Cursor installed ([cursor.com/download](https://cursor.com/download)).
- A Token Station account and API key. Sign up free at [models.bytefuture.ai](https://models.bytefuture.ai): $1 in credit on registration, no card required.
- Cursor Pro. Custom-model selection in Agent mode is gated on the Free plan, even with your own API key, so you'll need Pro ($20/month) for anything past Chat mode.

## Step 1: Create a Token Station API key with the OpenAI adapter attached

In the Token Station dashboard, open **API Keys** and click **Create new key**. Give it a name (`Cursor` works fine) and click **Create key**. Copy it immediately: it's shown once and won't be displayed again.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-create-api-key.mp4" type="video/mp4">
  </video>
  <figcaption>Creating a Token Station API key and attaching the Cursor ↔ OpenAI adapter to it.</figcaption>
</figure>

Back on **API Keys**, find the key you just created and click **Edit**. Under **WASM middleware**, it starts as "No WASM middleware assigned." Open the **Select WASM module** dropdown and choose **Cursor ↔ OpenAI adapter**, the entry that reformats OpenAI tool-call responses into the shape Cursor's Agent mode expects. Click **Save changes**. You'll see a confirmation banner ("WASM middleware installed and validated"), and the key's row in the **Active keys** table now lists the adapter under the **WASM** column.

<figure>
  <img src="/blog/route-cursor-through-token-station/openai-adapter-confirmed.png" alt="Token Station API Keys page showing a confirmation banner reading WASM middleware installed and validated, and the Cursor key's row listing the adapter under the WASM column" />
  <figcaption>Token Station's API Keys page after attaching the adapter: the confirmation banner, and the key's row listing it under the WASM column.</figcaption>
</figure>

This is the step that's actually new. Without it attached, everything else in this article still works exactly as before, but Agent-mode file edits against OpenAI models fail the same way earlier testing found: Agent mode reads and discusses code fine, but never actually changes a file.

## Step 2: Register Token Station as a custom provider

Open **Settings → Cursor Settings → Models**, scroll to **API Keys**, and set two fields:

- **OpenAI API Key**: the Token Station key you just attached the adapter to.
- **Override OpenAI Base URL**: toggle it on, and replace the default (`https://api.openai.com/v1`) with `https://models.bytefuture.ai/v1`.

Turning on the OpenAI API Key toggle asks you to confirm first: "Are you sure you want to enable your own OpenAI API key? Several of Cursor's features require custom models (Tab, Apply from Chat, Agent), which cannot be billed to an API key." Confirm to proceed; that's expected.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>Registering Token Station as a custom OpenAI-compatible provider in Cursor's Models settings.</figcaption>
</figure>

Don't rely on a "Verify" button to confirm the key and URL are correct. It isn't always present, and even when it is, it doesn't cover every path. The reliable check is adding a model and actually sending it a message, covered next.

## Step 3: Add the OpenAI family as custom models

Still in Models settings, scroll to the bottom of the model list to the custom-model field, type each full route, and click **Add**:

```
openai/gpt-6-astra
openai/gpt-5.6-sol
openai/gpt-5.6-terra
openai/gpt-5.6-luna
```

**The same naming gotcha as our Claude and Grok setups, and an easy one to trip on here specifically**: you might assume that since these are registered under Cursor's own "OpenAI API Key" field, you can type the bare model name. You can't. Cursor sends whatever name you register here verbatim as the `model` field in its request, and Token Station's actual route names all carry the provider prefix. Register plain `gpt-6-astra` and the request fails with `Model 'gpt-6-astra' not found`; register `openai/gpt-6-astra` and it works.

| Model | Cost (input/output per M) | Good for |
|---|---|---|
| `openai/gpt-6-astra` | $10 / $50 | The hardest, longest agentic sessions: multi-file refactors and long Agent-mode runs where fewer correction rounds matter more than per-token cost. |
| `openai/gpt-5.6-sol` | $5 / $30 | A flagship default for most coding-agent steps at half Astra's price. |
| `openai/gpt-5.6-terra` | $2.50 / $15 | Repeated implementation and debugging loops. |
| `openai/gpt-5.6-luna` | $1 / $6 | Switching the main chat to directly for lighter, single-turn questions, exploration, or triage. |

## Step 4: Confirm Agent-mode file edits actually apply

This is the step that didn't work before. Here's all four routes added, then `openai/gpt-5.6-luna` selected and asked to make a real edit against a real repository ([httpie](https://github.com/httpie/httpie)):

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-add-models-and-edit.mp4" type="video/mp4">
  </video>
  <figcaption>Adding all four OpenAI routes as custom models, then openai/gpt-5.6-luna applying a real file edit in Cursor's Agent mode.</figcaption>
</figure>

The prompt: "please update the edit at the top of the readme to say 'model: gpt-5.6-luna'." Cursor read `README.md`, applied the change, and reported back "Worked for 8s. Edited README.md, explored 1 file, +1 -1," with a diff replacing a leftover test marker with `<!-- model: gpt-5.6-luna -->`. A real edit landed in a real file, not a description of one in chat.

Token Station's dashboard confirms the same thing from the billing side:

<figure>
  <img src="/blog/route-cursor-through-token-station/openai-dashboard-activity.jpg" alt="Token Station dashboard Recent Activity showing repeated openai/gpt-5.6-luna requests, each a few thousand tokens and a fraction of a cent" />
  <figcaption>Token Station's Recent Activity, showing openai/gpt-5.6-luna requests billed correctly during testing.</figcaption>
</figure>

All four routes, `openai/gpt-6-astra`, `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra`, and `openai/gpt-5.6-luna`, are confirmed working end to end this way: real file edits, correctly billed, through the same adapter attached in Step 1.

## Step 5: Define scoped subagents

Cursor supports subagents: markdown files with YAML frontmatter, defined per-project in `.cursor/agents/` or globally in `~/.cursor/agents/`. Two useful roles for a coding session: a read-only researcher, and a test verifier that runs after a change.

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

We're using `model: inherit` rather than naming a specific route: as documented in our Claude setup, Cursor's Task tool only accepts `inherit` or its own `composer-2.5-fast` for a subagent's model, regardless of what a custom agent file specifies. That's a Cursor platform limitation, not something specific to OpenAI's models, so every subagent here runs on whichever main model the parent conversation is using. Everything else about a subagent is honored regardless: `name`, `description`, and `readonly` all work as documented, and both automatic invocation (the main agent reads each `description` and decides when to hand off) and explicit invocation (`/bill-the-explorer`) trigger a real delegation.

**Name your subagents something that won't collide with one of Cursor's own built-in agents.** `explore` is a real built-in name and gets silently misrouted there instead of your own definition, with no error to explain why. `bill-the-explorer` and `jill-the-test-runner` avoid that.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>Creating the bill-the-explorer and jill-the-test-runner subagents.</figcaption>
</figure>

If you create these files by asking the agent in chat to write them rather than doing it from a terminal, and the sidebar still shows no subagents afterward, reload the window (**Ctrl+Shift+P → "Reload Window"**): Cursor doesn't always rescan `.cursor/agents/` live.

## Try it yourself: the same httpie task

Our Claude Sonnet 5 setup ran a full coding session against a real feature in httpie: adding the effective URL (the URL actually reached after following any redirects) to httpie's `--meta` output, next to the existing elapsed time, delegating research and verification to the two subagents above.

We haven't yet run that specific multi-step, multi-agent session against GPT-6 Astra or the GPT-5.6 family, so this is a "try it yourself" rather than a report on what happened. What's now confirmed, from Step 4, is that all four routes can apply real Agent-mode file edits through Token Station, so there's no longer a fundamental reason to expect the full task to fail. The same three-message sequence is worth trying:

**Message 1**, to delegate research:
```
/bill-the-explorer find how elapsed time is computed and displayed in HTTPie's --meta output, and identify where to add the effective URL, the URL actually reached after following any redirects, alongside it.
```

**Message 2**, back to the main agent, once research comes back:
```
Using what bill-the-explorer found, add the effective URL next to the existing elapsed time in HTTPie's --meta output. Add a test that confirms it works for both a redirected and a non-redirected request.
```

**Message 3**, to delegate verification:
```
/jill-the-test-runner verify the new effective-URL test passes, along with the rest of the test suite. Report any failures separately from the two known pre-existing Big5 charset-detection failures in tests/test_encoding.py, which are unrelated to this change.
```

## What works today

Agent-mode file edits are confirmed working for all four OpenAI routes, `openai/gpt-6-astra`, `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra`, and `openai/gpt-5.6-luna`, through Token Station in Cursor: real edits applied to real files, correctly billed to your Token Station key, visible on the dashboard. This is new: the same routes previously could discuss code in Agent mode but not edit it, and the fix is the adapter attached to your Token Station key in Step 1.

Subagents work for scoping and permissions: `name`, `description`, and `readonly` are all honored, and both automatic and explicit (`/name`) invocation trigger real delegation. Subagent-level model routing does not currently work for custom models, regardless of provider: Cursor's Task tool only accepts `inherit` or its own `composer-2.5-fast`, so every subagent runs on the parent conversation's model. That's the same Cursor platform limitation documented in our Claude and Grok setups, not something specific to OpenAI's models.

## Get started

Sign up at [models.bytefuture.ai](https://models.bytefuture.ai/signup): $1 in free credit, no card required, with up to $50 in bonus credit on your first top-up. Export your key, attach the OpenAI adapter, wire it into Cursor's Models settings, and add the routes above.

[Try Token Station](https://models.bytefuture.ai/intro.html)
