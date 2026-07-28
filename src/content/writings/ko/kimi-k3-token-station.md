---
slug: kimi-k3-token-station
lang: ko
title: "Kimi K3, Token Station 출시: coding agent를 위한 2.8T 오픈 모델, 1M 컨텍스트"
summary: "Moonshot의 Kimi K3(2.8T 파라미터, 104B 활성화, 100만 토큰 컨텍스트, 네이티브 비전, 오픈 가중치)가 Token Station에 추가되었습니다. agent가 이미 쓰는 동일한 OpenAI / Anthropic 호환 API로 Claude Fable 5, GPT-5.6과 나란히 라우팅해 비교해 보세요."
category: product
date: 2026-07-28
cta: https://models.bytefuture.ai/intro.html
cover: blog/kimi-k3-token-station-cover.png
---

Kimi K3가 이번 주 [Hugging Face](https://huggingface.co/moonshotai/Kimi-K3)에 공개되었습니다. Moonshot이 내놓은 모델 중 가장 성능이 높습니다. 이제 [Token Station](https://models.bytefuture.ai/intro.html)에 `kimi/kimi-k3`로 추가되었고, gateway의 다른 모델과 같은 OpenAI / Anthropic 호환 API를 씁니다.

coding-agent 팀에게 Kimi K3는 frontier급 *오픈* 모델입니다: 2.8조 파라미터, 토큰당 104B 활성화, 네이티브 100만 토큰 컨텍스트, 네이티브 비전, Kimi K3 License의 오픈 가중치. 오늘 이미 쓰는 agent에서 이 모델을 불러 쓸 수 있습니다. 같은 모델을 자체 하드웨어에서도 돌릴 수 있습니다.

## 새로운 아키텍처, 그리고 최초의 3T급 오픈 모델

K3는 Kimi K2 계열에서 벗어납니다. Moonshot이 Kimi Delta Attention (KDA)라 부르는 새 attention 설계에 Attention Residuals를 결합하고, 토큰당 896개 expert 중 16개를 활성화하는 Stable LatentMoE를 함께 씁니다. Moonshot은 Kimi K2 대비 약 2.5배의 scaling efficiency를 보고하며, K3를 최초의 3T 파라미터급 오픈 모델이라 부릅니다.

운영상 중요한 점이 두 가지입니다. 하나는 컨텍스트 윈도우가 1,048,576 토큰으로 Claude Fable 5, GPT-5.6과 같은 1M tier라서, 긴 agentic session이 256K인 [Kimi K2.7 Code](/blog/try-kimi-k2-7-code-in-your-coding-agent-ko.html)처럼 일찍 compact하지 않다는 것. 다른 하나는 K3를 SFT 단계부터 MXFP4 가중치와 MXFP8 activation으로 훈련했다는 것. 양자화가 baked-in이라 다운로드한 가중치가 곧 배포용 가중치입니다.

## Kimi K3가 이기는 지점, 지는 지점

아래 수치는 [model card](https://huggingface.co/moonshotai/Kimi-K3)에 실린 Moonshot 자가 보고이며, 모두 `reasoning_effort: max` 기준입니다. [Claude Fable 5](/blog/try-claude-fable-5-in-codex-openclaw-and-pi-ko.html)와 [GPT-5.6 Sol](/blog/gpt-5-6-token-station-ko.html)은 이 사이트 독자가 가장 자주 비교하는 두 frontier 모델입니다.

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

가장 눈에 띄는 것은 긴 coding session용 benchmark인 SWE-Marathon입니다. Kimi K3는 여기서 42.0을 기록해 Fable 5(35.0)와 GPT-5.6 Sol(39.0)을 앞서고, BrowseComp와 tool-use benchmark인 MCPMark-Verified에서도 1위입니다. 더 짧은 단일 repo 작업에서는 반전됩니다. GPT-5.6 Sol이 DeepSWE와 Terminal-Bench를, Fable 5가 FrontierSWE와 Kimi Code Bench 2.0을 가져갑니다. K3는 전면 1위가 아니라 이기는 행도 있고 지는 행도 있습니다. 그런 profile일수록 router 뒤에 두기 좋고, 각 단계는 그 일에서 이기는 모델에 맡기면 됩니다.

## frontier 점수를 mid-tier 가격으로

K3는 입력 $3 / 100만 토큰, 출력 $15 / 100만 토큰이며, 자동 컨텍스트 캐싱이 반복 입력을 $0.30(90% 할인)으로 낮춥니다. Token Station은 이를 markup 없이 그대로 전달합니다.

| Model | Input / 1M | Cached input / 1M | Output / 1M | Context |
|---|---|---|---|---|
| `kimi/kimi-k3` | $3.00 | $0.30 | $15.00 | 1,048,576 |

이 출력 단가는 Claude Sonnet 4.6과 같고, Claude Fable 5($50)의 약 3분의 1, GPT-5.6 Sol($30)의 약 절반입니다. 그런데도 위 benchmark는 K3를 두 모델과 나란히 놓습니다. frontier급 능력을 mid-tier 가격에 쓸 수 있다는 건 agent의 메인 루프에 딱 알맞은 조합입니다.

cache hit가 가장 큰 효과를 발휘하는 곳은 coding agent입니다. session 중에 리포지토리 컨텍스트, 파일 요약, diff, 테스트 출력이 반복해 전송되고, 반복 컨텍스트에 대한 90% 입력 할인이 긴 agent 실행에서 실제로 비용을 아끼는 지점입니다.

표시 가격은 [Moonshot의 Kimi K3 가격 페이지](https://www.kimi.com/resources/kimi-k3-pricing) 기준. Token Station은 markup을 더하지 않습니다.

## 하나의 endpoint에서 Kimi K3 시도하기

endpoint는 표준 Token Station OpenAI 호환 API입니다:

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

frontier와 비교하려면 `model` 필드만 `anthropic/claude-fable-5` 또는 `openai/gpt-5.6-sol`로 바꾸면 됩니다. endpoint, key, wire format은 그대로이고 나머지는 Token Station이 변환합니다.

## K3로 agent의 메인 루프 구동하기

Kimi K2.7 Code는 delegated fan-out를 맡는 저렴한 workhorse로 자리 잡았습니다. K3가 노리는 건 한 단계 위, 메인 추론 loop입니다. Claude Code에서는 Opus slot에 두고 빠른 단계는 더 저렴한 Claude tier에 맡깁니다:

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

`ANTHROPIC_DEFAULT_OPUS_MODEL`을 `anthropic/claude-fable-5`로 바꾸면 그 외에는 아무것도 건드리지 않고 메인 루프가 Fable 5로 바뀝니다. 단일 gateway로 라우팅하는 의미가 여기에 있고, A/B 테스트는 환경 변수 하나로 끝납니다.

Codex에서는 K3를 기본 profile로 두고, Fable 5를 한 번의 스위치로 불러오게 합니다:

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

## 알아둘 quirks

- **Thinking은 항상 켜짐.** K3는 답하기 전에 `reasoning_content`를 반환합니다. 깊이는 `reasoning_effort` 필드(`low`, `high`, `max`, 기본 `max`)로 제어합니다. output 청구에는 reasoning token 분량을 감안하세요.
- **Preserved thinking history.** 멀티턴과 tool-call session에서 K3는 직전 assistant 메시지 전체를(`content`만이 아니라 `reasoning_content`와 `tool_calls`까지 포함해) 그대로 다시 전달하길 요구합니다. Token Station은 harness가 보낸 것을 그대로 전달하므로, 이력에서 reasoning을 제거하는 harness는 긴 session에서 일관성을 잃습니다.
- **네이티브 비전.** 같은 route가 MoonViT-V2 encoder로 텍스트와 이미지를 함께 받습니다. 다이어그램, 스크린샷, UI 캡처가 대화에 곧바로 들어옵니다.
- **오픈 가중치, 언제든 자체 호스팅 가능.** 가중치는 Kimi K3 License로 [Hugging Face](https://huggingface.co/moonshotai/Kimi-K3)에 공개되며 vLLM, SGLang, TokenSpeed로 서빙할 수 있습니다. 오늘의 클라우드 route는 나중에 자체 하드웨어로 옮길 수 있고, hybrid-inference 스토리를 하나의 모델로 끝낼 수 있습니다.

## 먼저 라우팅하고, 그리고 결정하기

Kimi K3는 이제 Token Station의 또 하나 route입니다. 이번 주에 긴 coding session을 이 모델에 맡겨보고, Fable 5와 GPT-5.6 Sol 대비 어디서 버티는지 살핀 뒤, 각 작업을 이긴 모델에 맡기세요. key 하나로 세 모델을 나란히 돌릴 수 있습니다.

필수 정보:

- Base URL (OpenAI 호환): `https://models.bytefuture.ai/v1`
- Base URL (Anthropic 호환): `https://models.bytefuture.ai`
- Model: `kimi/kimi-k3`
- API key: `gw-`로 시작. [Token Station dashboard](https://models.bytefuture.ai/dashboard)에서 발급

[Token Station 사용해 보기](https://models.bytefuture.ai/intro.html)
