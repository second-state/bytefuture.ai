---
slug: "route-cursor-through-token-station"
lang: "en"
title: "Route Cursor through Token Station: Claude Sonnet 5 and Haiku"
summary: "Cursor supports custom OpenAI-compatible providers through Settings, Models. Point it at Token Station and Claude Sonnet 5 and Haiku show up as selectable models with full Agent-mode support: real file edits, not just chat, plus scoped subagents for delegated research and verification."
category: "tutorial"
date: "2026-08-26"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-cover.png"
draft: false
---

Cursor supports custom OpenAI-compatible providers through Settings → Models. Point it at Token Station's endpoint and you can add Claude Sonnet 5 and Haiku as selectable models, each billed through your own Token Station key. Unlike some other model families available through Token Station, these two fully support Cursor's Agent mode: real file edits, not just chat. This walks through the setup end to end, including a naming gotcha we hit doing it ourselves, and finishes with an actual coding session: Sonnet 5 implementing a real feature in an open-source project, delegating research and verification to two purpose-built subagents.

Before the setup, it's worth being explicit about why to route Cursor through Token Station at all, rather than paying Cursor directly. Three concrete reasons stand out. Cursor's Pro plan bundles a handful of models (Grok 4.6, Grok 4.5, Composer 2.5) into a shared monthly usage pool and meters everything else from a separate pool at each model's own API price, but neither pool gives you a per-model, per-request breakdown of what you actually spent. A Token Station key sidesteps both: BYOK requests go straight to Token Station's endpoint, never touch Cursor's own billing, and land on your own dashboard priced at the provider's real rate, with zero markup. Second, if Cursor is one of several coding tools you use (alongside Claude Code, Codex, or OpenClaw, say), the same Token Station key and the same model IDs work in all of them: one account and one balance to track, instead of separate keys, separate top-ups, and separate invoices per tool. Third, Token Station's catalog runs past 300 models across 30+ providers, well beyond whatever Cursor happens to bundle into its own pools.

## What you need before starting

- Cursor installed ([cursor.com/download](https://cursor.com/download)).
- A Token Station account and API key. Sign up free at [models.bytefuture.ai](https://models.bytefuture.ai): $1 in credit on registration, no card required.
- Cursor Pro. Custom-model selection in Agent mode is gated on the Free plan, even with your own API key, so you'll need Pro ($20/month) for anything past Chat mode.

## Step 1: Register Token Station as a custom provider

Open **Settings → Cursor Settings → Models**, scroll to **API Keys**, and set two fields:

- **OpenAI API Key**: your Token Station key.
- **Override OpenAI Base URL**: toggle it on, and replace the default with `https://models.bytefuture.ai/v1`.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>Registering Token Station as a custom OpenAI-compatible provider in Cursor's Models settings.</figcaption>
</figure>

Don't rely on a "Verify" button to confirm the key and URL are correct. It isn't always present, and even when it is, it doesn't cover every path. The reliable check is Step 2: add a model and actually send it a message.

## Step 2: Add Claude Sonnet 5 and Haiku as custom models

Still in Models settings, click **+ Add Custom Model** twice and add:

```
anthropic/claude-sonnet-5
anthropic/claude-haiku-4-5
```

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/add-models.mp4" type="video/mp4">
  </video>
  <figcaption>Adding anthropic/claude-sonnet-5 and anthropic/claude-haiku-4-5 as custom models.</figcaption>
</figure>

**The gotcha**: Cursor sends whatever name you register here verbatim as the `model` field in its request. Token Station's actual route names include the `anthropic/` prefix. Register the model as plain `claude-sonnet-5` and every request fails with `Model 'claude-sonnet-5' not found`, because that model genuinely doesn't exist without the prefix. Register it with the prefix and it works immediately.

To confirm it's actually working end to end, not just accepted by Cursor: open a chat, select one of the new models, send a trivial message, and check the [Token Station dashboard](https://models.bytefuture.ai/dashboard). A real reply plus a matching line in Recent Activity means the key, base URL, and model name are all correct.

| Model | Good for |
|---|---|
| `anthropic/claude-sonnet-5` | Main coding model: planning, implementation, and Agent-mode file edits. |
| `anthropic/claude-haiku-4-5` | A cheaper model to switch the main chat to directly for lighter, single-turn questions. See Step 3 for why it isn't a cost-tier for subagents yet. |

## Step 3: Define scoped subagents

Cursor supports subagents: markdown files with YAML frontmatter, defined per-project in `.cursor/agents/` or globally in `~/.cursor/agents/`. Two useful roles for a coding session: a read-only researcher, and a test verifier that runs after a change.

**`.cursor/agents/bill-the-explorer.md`**
```markdown
---
name: bill-the-explorer
description: Searches and reads the codebase to answer questions about existing code. Use proactively before implementing anything unfamiliar.
model: anthropic/claude-haiku-4-5
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
model: anthropic/claude-haiku-4-5
---

You run the project's test command, capture output, and report which
tests passed or failed and why. Do not modify source files.
```

**Name your subagents something that won't collide with one of Cursor's own built-in agents.** We first tried `explore`, and Cursor silently routed to its own built-in agent of the same name instead of ours, with no error to explain why nothing we specified was taking effect. `bill-the-explorer` and `jill-the-test-runner` avoid the collision.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>Creating the bill-the-explorer and jill-the-test-runner subagents.</figcaption>
</figure>

`readonly: true` on `bill-the-explorer` blocks file edits and state-changing shell commands, which fits a pure research role. `jill-the-test-runner` needs to actually execute the test command, so it's left without that restriction, with its instructions telling it not to touch source files.

**About that `model:` line.** It's valid, documented Cursor syntax, and we set both subagents to `anthropic/claude-haiku-4-5` expecting a cost-tier split from the main conversation. It didn't happen. Asked directly why, the agent running the session gave a precise answer: the Task tool it calls to run a subagent only accepts a `model` parameter from a fixed allowlist, currently `inherit` or Cursor's own `composer-2.5-fast`, and doesn't read the `model:` frontmatter from a custom agent file at all. With no valid custom value to pass, it defaults to `inherit`, meaning every subagent runs on whatever model the parent conversation is using, Sonnet 5 in this setup, not Haiku. `name`, `description`, and `readonly` are honored and do their job; `model` currently isn't, for any custom model, not just Haiku. This matches multiple independent reports on Cursor's own community forum, so it's a known, current limitation rather than something specific to this setup.

That leaves subagents genuinely useful for scoping delegated work by role and permission, a read-only researcher versus a test-runner that only reports, invoked automatically (the main agent reads each `description` and decides when to hand off) or explicitly with `/bill-the-explorer` or `/jill-the-test-runner`. It just doesn't currently give you a cheaper model for that delegated work.

If you create these files by asking the agent in chat to write them rather than doing it from a terminal, and the sidebar still shows no subagents afterward, reload the window (**Ctrl+Shift+P → "Reload Window"**): Cursor doesn't always rescan `.cursor/agents/` live.

## Step 4: Watch it implement a real feature

With the provider, models, and subagents in place, Sonnet 5 can run an actual coding session end to end: research, implementation, and verification, delegating the read-only and verification steps along the way.

We used [httpie](https://github.com/httpie/httpie), a real, moderately sized, well-tested open-source project, as the target. httpie's `--meta`/`-m` flag prints the request's elapsed time; it doesn't yet show the effective URL reached after following any redirects. That's a small, well-scoped, genuinely useful feature, the kind of task that needs a look at existing code before touching anything.

Explicit invocation turned out to be the reliable way to trigger delegation. Asking in plain prose to "use the explore subagent" didn't actually hand off; the main agent just narrated doing so while working under its own context. Naming the subagent with a leading slash, as its own message, is what worked:

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

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/demo-httpie.mp4" type="video/mp4">
  </video>
  <figcaption>Sonnet 5 delegating research to bill-the-explorer, implementing the change itself, then delegating verification to jill-the-test-runner, all through Token Station.</figcaption>
</figure>

Because subagent model routing isn't honored yet, the whole session bills as `anthropic/claude-sonnet-5` on the [Token Station dashboard](https://models.bytefuture.ai/dashboard), research and verification included, not the cost-tiered split we set out to show. What the video does show: `bill-the-explorer` running strictly read-only and reporting back before any code changes, and `jill-the-test-runner` running afterward to verify, distinct scoped roles doing distinct jobs in sequence, just not yet at distinct prices.

## What works today

Chat and Agent mode both work with Sonnet 5 and Haiku through Token Station in Cursor: real replies, real file edits, correctly billed to your Token Station key, visible on the dashboard.

Subagents work for scoping and permissions, `name`, `description`, and `readonly` are all honored, and both automatic and explicit (`/name`) invocation trigger real delegation. Subagent-level model routing does not currently work for custom models: Cursor's Task tool only accepts `inherit` or its own `composer-2.5-fast`, so every subagent runs on the parent conversation's model regardless of what `model:` specifies in its frontmatter. That's a Cursor platform limitation, confirmed directly by the agent itself and matching independent reports elsewhere, not something specific to Token Station or to Haiku.

OpenAI's GPT-6 Astra and the GPT-5.6 family (Sol, Terra, Luna) are also confirmed working now, including real Agent-mode file edits, through an adapter attached to your Token Station API key. See our [GPT-6 Astra and GPT-5.6 setup](/blog/route-cursor-through-token-station-openai.html) for that walkthrough specifically.

Token Station's xAI route, `xai/grok-4.6`, is also supported in Cursor through the same custom-provider setup, if you'd rather try Grok for the main coding role. See the [companion article on running Grok 4.6 in Cursor](/blog/route-cursor-through-token-station-grok-4-6.html) for that setup specifically.

## Get started

Sign up at [models.bytefuture.ai](https://models.bytefuture.ai/signup): $1 in free credit, no card required, with up to $50 in bonus credit on your first top-up. Export your key, wire it into Cursor's Models settings, and add the two routes.

[Try Token Station](https://models.bytefuture.ai/intro.html)
