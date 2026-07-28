---
slug: kimi-k3-token-station
lang: en
title: "Kimi K3 is now on Token Station: a 2.8T open model with a 1M context for coding agents"
summary: "Moonshot's Kimi K3 (2.8T parameters, 104B active, a 1-million-token context window, native vision, open weights) is live on Token Station. Route it against Claude Fable 5 and GPT-5.6 through the same OpenAI- and Anthropic-compatible API your agents already use."
category: product
date: 2026-07-28
cta: https://models.bytefuture.ai/intro.html
cover: blog/kimi-k3-token-station-cover.png
---

Kimi K3 launched on [Hugging Face](https://huggingface.co/moonshotai/Kimi-K3) this week as Moonshot's most capable model to date. It is now live on [Token Station](https://models.bytefuture.ai/intro.html) as `kimi/kimi-k3`, over the same OpenAI- and Anthropic-compatible API as every other model on the gateway.

For coding-agent teams, Kimi K3 is a frontier-class *open* model: 2.8 trillion parameters with 104B activated per token, a native 1-million-token context window, native vision, and open weights under the Kimi K3 License. Point your existing agent at it today. The same model can run on your own hardware.

## A new architecture, and a 3T-class open model

K3 breaks from the Kimi K2 line. It uses a new attention design Moonshot calls Kimi Delta Attention (KDA), paired with Attention Residuals, and a Stable LatentMoE that activates 16 of 896 experts per token. Moonshot reports roughly 2.5x the scaling efficiency of Kimi K2, and calls K3 the first open model in the 3T-parameter class.

Two things matter for operators. First, the context window is 1,048,576 tokens, the same 1M tier as Claude Fable 5 and GPT-5.6, so long agentic sessions do not compact as early as they did on the 256K [Kimi K2.7 Code](/blog/try-kimi-k2-7-code-in-your-coding-agent.html). Second, K3 is trained for MXFP4 weights with MXFP8 activations from the SFT stage onward. The quantization is baked in; the weights you download are already the ones you serve.

## Where Kimi K3 wins, and where it does not

These are Moonshot's self-reported numbers from the [model card](https://huggingface.co/moonshotai/Kimi-K3), all at `reasoning_effort: max`. [Claude Fable 5](/blog/try-claude-fable-5-in-codex-openclaw-and-pi.html) and [GPT-5.6 Sol](/blog/gpt-5-6-token-station.html) are the two frontier models readers of this site compare against.

| Benchmark | Kimi K3 | Claude Fable 5 | GPT-5.6 Sol |
|---|---|---|---|
| SWE-Marathon | **42.0** | 35.0 | 39.0 |
| DeepSWE | 67.5 | 70.0 | **73.0** |
| Terminal-Bench 2.1 | 88.3 | 88.0 | **88.8** |
| FrontierSWE | 81.2 | **86.6** | 71.3 |
| Kimi Code Bench 2.0 | 72.9 | **76.9** | 64.8 |
| ProgramBench | **77.8** | 76.8 | 77.6 |
| BrowseComp | **91.2** | 88.0 | 90.4 |
| MCPMark-Verified | **94.5** | 87.4 | 92.9 |
| GPQA Diamond | 93.5 | 92.6 | **94.1** |

The standout is SWE-Marathon, a benchmark built around marathon-length coding sessions. Kimi K3 scores 42.0 there, ahead of Fable 5 (35.0) and GPT-5.6 Sol (39.0). It also leads on BrowseComp and on MCPMark-Verified, the tool-use benchmark. On shorter single-repo tasks the picture flips: GPT-5.6 Sol leads DeepSWE and Terminal-Bench, and Fable 5 leads FrontierSWE and Kimi Code Bench 2.0. K3 wins some rows and loses others. That is exactly what belongs behind a router, where you point each kind of step at whichever model wins that job.

## Frontier scores at a mid-tier price

K3 lists at $3 per million input tokens and $15 per million output, with automatic context caching that drops repeated input to $0.30 (a 90% cut). Token Station passes that through at zero markup.

| Model | Input / 1M | Cached input / 1M | Output / 1M | Context |
|---|---|---|---|---|
| `kimi/kimi-k3` | $3.00 | $0.30 | $15.00 | 1,048,576 |

That output rate matches Claude Sonnet 4.6, and it is roughly a third of Claude Fable 5's $50 and half of GPT-5.6 Sol's $30, while the benchmarks above put K3 alongside both. A frontier-class model at a mid-tier rate is exactly what you want driving an agent's main loop.

The cache hit matters most for coding agents. Repository context, file summaries, diffs, and test output get sent again and again across a session; the 90% input discount on repeated context is where a long agent run actually saves money.

List prices from [Moonshot's Kimi K3 pricing](https://www.kimi.com/resources/kimi-k3-pricing); Token Station adds no markup.

## Try Kimi K3 from one endpoint

The endpoint is the standard Token Station OpenAI-compatible API:

```bash
curl https://models.bytefuture.ai/v1/chat/completions \
  -H "Authorization: Bearer TOKEN_STATION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kimi/kimi-k3",
    "messages": [
      {"role": "user", "content": "Plan a safe refactor for the pricing module and list the tests to run."}
    ],
    "reasoning_effort": "max"
  }'
```

To compare against the frontier, change only the `model` field to `anthropic/claude-fable-5` or `openai/gpt-5.6-sol`. The endpoint, the key, and the wire format stay the same; Token Station translates the rest.

## Drive your agent's main loop with K3

Kimi K2.7 Code earned a place as the cheap workhorse for delegated fan-out. K3 aims one tier up: the main reasoning loop. In Claude Code, put it in the Opus slot and keep a cheaper Claude tier for the quick steps:

```bash
# Token Station endpoint + auth
export ANTHROPIC_BASE_URL="https://models.bytefuture.ai"
export ANTHROPIC_AUTH_TOKEN="gw-YOUR_TOKEN_STATION_KEY"

# Main reasoning tier: Kimi K3 (1M context, long-session coding)
export ANTHROPIC_DEFAULT_OPUS_MODEL="kimi/kimi-k3"

# Quick steps and subagents stay on a cheaper Claude tier
export ANTHROPIC_DEFAULT_SONNET_MODEL="anthropic/claude-sonnet-4-6"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="anthropic/claude-sonnet-4-6"

claude
```

Flipping `ANTHROPIC_DEFAULT_OPUS_MODEL` to `anthropic/claude-fable-5` swaps the main loop to Fable 5 with nothing else changing. That is the point of routing through one gateway: the A/B test is an environment variable.

In Codex, make K3 the default profile and keep Fable 5 a switch away:

```bash
mkdir -p ~/.codex
cat > ~/.codex/config.toml <<'EOF'
model = "kimi/kimi-k3"
model_provider = "token_station"

[model_providers.token_station]
name = "token_station"
base_url = "https://models.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"

[profiles.frontier]
model = "anthropic/claude-fable-5"
EOF

export TOKEN_STATION_API_KEY="gw-YOUR_TOKEN_STATION_KEY"

codex                    # main loop on Kimi K3
codex --profile frontier # hard problems on Fable 5
```

## Quirks worth knowing

- **Thinking is always on.** K3 returns `reasoning_content` before its answer. Control the depth with the `reasoning_effort` field (`low`, `high`, `max`; default `max`). Budget for reasoning tokens in the output bill.
- **Preserved thinking history.** In multi-turn and tool-call sessions, K3 expects the full previous assistant message passed back, `reasoning_content` and `tool_calls` included, not just `content`. Token Station forwards what your harness sends; harnesses that strip reasoning from history lose coherence over long sessions.
- **Native vision.** The same route takes text and images through the MoonViT-V2 encoder. Diagrams, screenshots, and UI captures go straight into the conversation.
- **Open weights, self-hostable later.** The weights are on [Hugging Face](https://huggingface.co/moonshotai/Kimi-K3) under the Kimi K3 License, served by vLLM, SGLang, and TokenSpeed. A cloud route today can graduate to your own hardware, which is the hybrid-inference story in one model.

## Route it, then decide

Kimi K3 is now another route in Token Station. Point a long coding session at it this week, watch where it holds up against Fable 5 and GPT-5.6 Sol, and keep whichever model wins each kind of task. One key runs all three side by side.

The essentials:

- Base URL (OpenAI-compatible): `https://models.bytefuture.ai/v1`
- Base URL (Anthropic-compatible): `https://models.bytefuture.ai`
- Model: `kimi/kimi-k3`
- API key: starts with `gw-`, from the [Token Station dashboard](https://models.bytefuture.ai/dashboard)

[Try Token Station](https://models.bytefuture.ai/intro.html)
