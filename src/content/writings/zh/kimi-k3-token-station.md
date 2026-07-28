---
slug: kimi-k3-token-station
lang: zh
title: "Kimi K3 已接入 Token Station：面向 coding agent 的 2.8T 开源模型，1M 上下文"
summary: "Moonshot 的 Kimi K3（2.8T 参数、104B 激活、100 万 token 上下文、原生视觉、开源权重）已上线 Token Station，能通过 agent 现有的那套 OpenAI / Anthropic 兼容 API 接入，和 Claude Fable 5、GPT-5.6 放在一起路由对比。"
category: product
date: 2026-07-28
cta: https://models.bytefuture.ai/intro.html
cover: blog/kimi-k3-token-station-cover.png
---

Kimi K3 本周在 [Hugging Face](https://huggingface.co/moonshotai/Kimi-K3) 上发布，是 Moonshot 至今最强的模型。现已上线 [Token Station](https://models.bytefuture.ai/intro.html)，route 为 `kimi/kimi-k3`，用的就是 gateway 上其他模型同一套 OpenAI / Anthropic 兼容 API。

对 coding-agent 团队来说，Kimi K3 是一款 frontier 级的*开源*模型：2.8 万亿参数、每 token 激活 104B、原生 100 万 token 上下文、原生视觉。今天就能把它接进你正在用的 agent；权重按 Kimi K3 License 开源，将来也能部署到自己的硬件上。

## 新架构，以及首个 3T 级开源模型

K3 走出了 Kimi K2 的路线。它基于 Moonshot 称为 Kimi Delta Attention (KDA) 的新 attention 设计，叠加 Attention Residuals，底层 Stable LatentMoE 每 token 从 896 个 expert 里激活 16 个。Moonshot 称其 scaling efficiency 约为 Kimi K2 的 2.5 倍，也是首个 3T 参数级别的开源模型。

对运维来说有两点关键。一是上下文窗口达到 1,048,576 token，与 Claude Fable 5、GPT-5.6 同处 1M tier，长 agentic session 不会像在 256K 的 [Kimi K2.7 Code](/blog/try-kimi-k2-7-code-in-your-coding-agent-zh.html) 上那么早 compact。二是 K3 从 SFT 阶段起就按 MXFP4 权重 + MXFP8 activation 训练，量化是 baked-in 的，下载下来就是部署用的权重。

## Kimi K3 哪里领先，哪里落后

以下数字来自 Moonshot 的 [model card](https://huggingface.co/moonshotai/Kimi-K3) 自报成绩，均为 `reasoning_effort: max`。[Claude Fable 5](/blog/try-claude-fable-5-in-codex-openclaw-and-pi-zh.html) 和 [GPT-5.6 Sol](/blog/gpt-5-6-token-station-zh.html) 是本站读者最常拿来对比的两个 frontier 模型。

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

最亮眼的是 SWE-Marathon，一个针对超长 coding session 的 benchmark。Kimi K3 在这里拿到 42.0，领先 Fable 5（35.0）和 GPT-5.6 Sol（39.0）；在 BrowseComp 和 tool-use benchmark MCPMark-Verified 上同样领先。更短的单 repo 任务则反过来：GPT-5.6 Sol 在 DeepSWE、Terminal-Bench 领先，Fable 5 在 FrontierSWE、Kimi Code Bench 2.0 领先。K3 并非全面最强，而是有的行赢、有的行输。这种 profile 正好适合放在 router 后面：每一类步骤都交给在该类任务上胜出的模型。

## Frontier 分数，mid-tier 价格

K3 定价为 input $3 / 百万 token、output $15 / 百万 token，并支持自动上下文缓存，把重复 input 降到 $0.30（省 90%）。Token Station 零 markup 透传。

| Model | Input / 1M | Cached input / 1M | Output / 1M | Context |
|---|---|---|---|---|
| `kimi/kimi-k3` | $3.00 | $0.30 | $15.00 | 1,048,576 |

这一 output 单价与 Claude Sonnet 4.6 持平，只有 Claude Fable 5（$50）的三分之一、GPT-5.6 Sol（$30）的一半，而上面的 benchmark 把 K3 和它们放在同一档。frontier 级能力、mid-tier 价格，正是驱动 agent 主循环想要的组合。

cache hit 对 coding agent 最关键。一个 session 里，仓库上下文、文件摘要、diff、测试输出会反复发送；重复上下文享受 90% 的 input 折扣，正是长 agent 运行真正省钱的地方。

挂牌价来自 [Moonshot 的 Kimi K3 定价页](https://www.kimi.com/resources/kimi-k3-pricing)；Token Station 零 markup。

## 从一个 endpoint 试 Kimi K3

endpoint 就是标准的 Token Station OpenAI 兼容 API：

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

要和 frontier 对比，只改 `model` 字段为 `anthropic/claude-fable-5` 或 `openai/gpt-5.6-sol`。endpoint、key、wire format 都不变，其余由 Token Station 转换。

## 用 K3 驱动 agent 的主循环

Kimi K2.7 Code 已经作为廉价 workhorse 承担起 delegated fan-out。K3 瞄准的是再上一层：主推理 loop。在 Claude Code 里把它放进 Opus slot，快速步骤留给更便宜的 Claude tier：

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

把 `ANTHROPIC_DEFAULT_OPUS_MODEL` 换成 `anthropic/claude-fable-5`，主循环就切到 Fable 5，其余无需改动。这就是通过单一 gateway 路由的意义：A/B 测试只是一个环境变量。

在 Codex 里，把 K3 设为默认 profile，Fable 5 留作一键切换：

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

## 值得知道的 quirks

- **Thinking 常开。** K3 会在回答前返回 `reasoning_content`，用 `reasoning_effort` 字段（`low`、`high`、`max`，默认 `max`）控制深度。output 账单记得为 reasoning token 预算。
- **Preserved thinking history。** 多轮和 tool-call session 中，K3 要求把上一条完整的 assistant message 原样传回（包括 `reasoning_content` 和 `tool_calls`，而非只传 `content`）。Token Station 会原样转发 harness 发来的内容；若 harness 把 reasoning 从历史里剥掉，长 session 会逐渐失去连贯。
- **原生视觉。** 同一个 route 经 MoonViT-V2 encoder 同时接受文本和图像，图表、截图、UI 截图可直接进入对话。
- **开源权重，随时可自托管。** 权重以 Kimi K3 License 发布在 [Hugging Face](https://huggingface.co/moonshotai/Kimi-K3)，可用 vLLM、SGLang、TokenSpeed 部署。今天的云端 route 将来可以迁到自己的硬件上，hybrid-inference 的故事用一个模型就讲完了。

## 先路由，再决定

Kimi K3 现在是 Token Station 里的又一个 route。这周拿一个长 coding session 去跑它，看它在哪些环节扛得住 Fable 5 和 GPT-5.6 Sol，再把每类任务留给胜出的模型。一个 key 就能让三者并排跑。

要点：

- Base URL（OpenAI 兼容）：`https://models.bytefuture.ai/v1`
- Base URL（Anthropic 兼容）：`https://models.bytefuture.ai`
- Model：`kimi/kimi-k3`
- API key：以 `gw-` 开头，到 [Token Station dashboard](https://models.bytefuture.ai/dashboard) 获取

[试用 Token Station](https://models.bytefuture.ai/intro.html)
