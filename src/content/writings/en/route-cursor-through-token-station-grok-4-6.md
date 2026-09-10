---
slug: "route-cursor-through-token-station-grok-4-6"
lang: "en"
title: "Route Cursor through Token Station: Grok 4.6"
summary: "Cursor supports custom OpenAI-compatible providers through Settings, Models. Point it at Token Station and xAI's Grok 4.6 shows up as a selectable model, billed through your own key, with confirmed Agent-mode file edits. A companion to the Claude Sonnet 5 and Haiku setup, covering what's different for Grok."
category: "tutorial"
date: "2026-08-26"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-grok-4-6-cover.png"
draft: false
---

Cursor supports custom OpenAI-compatible providers through Settings → Models. Point it at Token Station's endpoint and you can add xAI's Grok 4.6 as a selectable model, billed through your own Token Station key. This is a companion to our [Claude Sonnet 5 and Haiku setup](/blog/route-cursor-through-token-station.html): registering the provider and defining subagents work exactly the same way regardless of which model you add, so this piece stays short and points back to that one for the deeper investigative detail (a subagent-naming collision with one of Cursor's own built-in agents, and a Cursor platform bug that keeps subagents from actually running on a different model than the parent conversation). What's specific to Grok is Step 2 and the note on Agent mode below.

Before the setup, it's worth being explicit about why to route Cursor through Token Station at all, rather than paying Cursor directly. Three concrete reasons stand out. Cursor's Pro plan bundles a handful of models (Grok 4.6, Grok 4.5, Composer 2.5) into a shared monthly usage pool and meters everything else from a separate pool at each model's own API price, but neither pool gives you a per-model, per-request breakdown of what you actually spent. A Token Station key sidesteps both: BYOK requests go straight to Token Station's endpoint, never touch Cursor's own billing, and land on your own dashboard priced at the provider's real rate, with zero markup. Second, if Cursor is one of several coding tools you use (alongside Claude Code, Codex, or OpenClaw, say), the same Token Station key and the same model IDs work in all of them: one account and one balance to track, instead of separate keys, separate top-ups, and separate invoices per tool. Third, Token Station's catalog runs past 300 models across 30+ providers, well beyond whatever Cursor happens to bundle into its own pools.

One Grok-specific wrinkle worth flagging up front: Cursor's own Pro plan already bundles Grok 4.6 into its native "Cursor Models" pool, at Cursor's own usage-pool pricing. Routing Grok 4.6 through Token Station instead means you're paying xAI's API rate directly, with the cost-visibility and consolidation benefits above, rather than drawing down Cursor's bundled allocation.

## What you need before starting

- Cursor installed ([cursor.com/download](https://cursor.com/download)).
- A Token Station account and API key. Sign up free at [models.bytefuture.ai](https://models.bytefuture.ai): $1 in credit on registration, no card required.
- Cursor Pro. Custom-model selection in Agent mode is gated on the Free plan, even with your own API key, so you'll need Pro ($20/month) for anything past Chat mode.

## Step 1: Register Token Station as a custom provider

Open **Settings → Cursor Settings → Models**, scroll to **API Keys**, and set two fields:

- **OpenAI API Key**: your Token Station key.
- **Override OpenAI Base URL**: toggle it on, and replace the default with `https://models.bytefuture.ai/v1`.

This step doesn't depend on which model you're about to add, so here's the same recording from the companion article:

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>Registering Token Station as a custom OpenAI-compatible provider in Cursor's Models settings.</figcaption>
</figure>

Don't rely on a "Verify" button to confirm the key and URL are correct. It isn't always present, and even when it is, it doesn't cover every path. The reliable check is Step 2: add the model and actually send it a message.

## Step 2: Add Grok 4.6 as a custom model

Still in Models settings, click **+ Add Custom Model** and add:

```
xai/grok-4.6
```

**Same naming gotcha as the Claude setup**: Cursor sends whatever name you register here verbatim as the `model` field in its request, and Token Station's actual route name includes the `xai/` prefix. Register plain `grok-4.6` and requests fail with `Model 'grok-4.6' not found`. Register it with the prefix and it works immediately.

To confirm it's actually working end to end, not just accepted by Cursor: open a chat, select Grok 4.6, send a trivial message, and check the [Token Station dashboard](https://models.bytefuture.ai/dashboard). A real reply plus a matching line in Recent Activity means the key, base URL, and model name are all correct.

<figure>
  <img src="/blog/route-cursor-through-token-station/grok-dashboard-activity.jpg" alt="Token Station dashboard Recent Activity showing an xai/grok-4.6 request billed at $0.01" />
  <figcaption>A real request through Cursor, billed to the Token Station key and showing up as xai/grok-4.6 in Recent Activity.</figcaption>
</figure>

| Model | Good for |
|---|---|
| `xai/grok-4.6` | Main coding model: planning, implementation, chat, and confirmed Agent-mode file edits (see below). |

Agent-mode file editing works with Grok 4.6 through Token Station, real edits applied to real files, not just chat:

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/grok-agent-mode-edit.mp4" type="video/mp4">
  </video>
  <figcaption>Grok 4.6, routed through Token Station, editing a file directly in Cursor's Agent mode.</figcaption>
</figure>

## Step 3: Define scoped subagents

Same two subagents as the companion article, a read-only researcher and a test verifier, work the same way here. Full detail on why the `model:` field doesn't actually route a subagent to a different model, and why we settled on these specific names, is in the [Claude Sonnet 5 and Haiku article](/blog/route-cursor-through-token-station.html#step-3-define-scoped-subagents); this is the short version.

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

We're using `model: inherit` explicitly here rather than naming a specific model, since Cursor's Task tool doesn't currently honor a custom model for subagents regardless of what's specified, they always run on whichever model the parent conversation is using (Grok 4.6, in this setup). `inherit` says so plainly instead of implying a cost tier that isn't actually there yet.

Creating these subagents is identical to the companion article's process, so here's that same recording:

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>Creating the bill-the-explorer and jill-the-test-runner subagents.</figcaption>
</figure>

Also worth repeating from the companion piece: avoid naming a subagent something that collides with one of Cursor's own built-in agents. `explore` is a real built-in name and gets silently misrouted there instead of your own definition, with no error to explain why. `bill-the-explorer` and `jill-the-test-runner` avoid that.

## Try it yourself: the same httpie task

We ran a full coding session with Claude Sonnet 5, delegating research and verification to these two subagents, against a real feature in [httpie](https://github.com/httpie/httpie): adding the effective URL (the URL actually reached after following any redirects) to httpie's `--meta` output, next to the existing elapsed time. That session and the recording are in the companion article.

We haven't yet run that specific multi-step session, with subagent delegation, against Grok 4.6, so this section is still a "try it yourself" rather than a report on what happened for this exact task. What is now confirmed, shown above, is that Grok 4.6 can apply real Agent-mode file edits through Token Station, so there's no longer a fundamental reason to expect the full task to fail. Explicit invocation was the reliable way to trigger subagent delegation with Sonnet 5; plain prose asking it to "use the explore subagent" didn't actually hand off. The same three-message sequence, unchanged, is worth trying with Grok 4.6 selected:

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

Single-step Agent-mode edits are already confirmed; what this specific sequence tests is whether the full research-implement-verify workflow, with real subagent delegation, holds up across a multi-step session the same way it did with Claude Sonnet 5.

## What works today

Chat and Agent mode both work with Grok 4.6 through Token Station in Cursor: real replies, real file edits, correctly billed to your Token Station key, visible on the dashboard. Registering the provider and defining subagents are mechanically identical to the Claude setup, since none of that depends on which model you add.

That puts Grok 4.6 alongside Claude Sonnet 5 and OpenAI's GPT-6 Astra and GPT-5.6 family as routes that reliably drive Agent-mode edits through Token Station. Tool-calling compatibility turned out to be genuinely model- and provider-specific, so Grok's confirmed here on its own evidence rather than assumed by analogy with Claude. See our [GPT-6 Astra and GPT-5.6 setup](/blog/route-cursor-through-token-station-openai.html) for how OpenAI's models got there, through an adapter attached to your Token Station API key.

What's still untested specifically is the full multi-step session, research delegation, implementation, and verification delegation, against a real task with Grok 4.6 as the main model. The single-edit capability behind it is confirmed; the end-to-end workflow is the "try it yourself" above.

Subagent-level model routing has the same limitation described in the companion article regardless of which model you use: Cursor's Task tool only accepts `inherit` or its own `composer-2.5-fast`, so a subagent always runs on the parent conversation's model. That's a Cursor platform limitation, not specific to Grok, Claude, or Token Station.

## Get started

Sign up at [models.bytefuture.ai](https://models.bytefuture.ai/signup): $1 in free credit, no card required, with up to $50 in bonus credit on your first top-up. Export your key, wire it into Cursor's Models settings, and add `xai/grok-4.6`.

[Try Token Station](https://models.bytefuture.ai/intro.html)
