---
slug: kimi-k3-token-station
lang: ja
title: "Kimi K3 が Token Station に登場：coding agent 向けの 2.8T オープンモデル、1M コンテキスト"
summary: "Moonshot の Kimi K3（2.8T パラメータ、104B 活性化、100 万 token コンテキスト、ネイティブ視覚、オープンウェイト）が Token Station で利用可能になりました。agent が既に使っている OpenAI / Anthropic 互換 API で Claude Fable 5 や GPT-5.6 と並べて比較できます。"
category: product
date: 2026-07-28
cta: https://models.bytefuture.ai/intro.html
cover: blog/kimi-k3-token-station-cover.png
---

Kimi K3 は今週 [Hugging Face](https://huggingface.co/moonshotai/Kimi-K3) で公開され、Moonshot がこれまでに発表したモデルの中で最も高性能です。本日 [Token Station](https://models.bytefuture.ai/intro.html) に `kimi/kimi-k3` として追加され、gateway の他のモデルと同じ OpenAI / Anthropic 互換 API を使います。

coding-agent チームにとって、Kimi K3 は frontier クラスの*オープン*モデルです：2.8 兆パラメータ、1 token あたり 104B 活性化、ネイティブの 100 万 token コンテキスト、ネイティブ視覚、Kimi K3 License のオープンウェイト。今日、今の agent から呼べます。同じモデルを自分のハードウェアでも実行できます。

## 新しいアーキテクチャ、そして初の 3T クラスのオープンモデル

K3 は Kimi K2 の系統から外れます。Moonshot が Kimi Delta Attention (KDA) と呼ぶ新しい attention 設計に Attention Residuals を組み合わせ、1 token につき 896 expert のうち 16 を活性化する Stable LatentMoE を採用しています。Moonshot は Kimi K2 の約 2.5 倍の scaling efficiency を報告し、K3 を初の 3T パラメータクラスのオープンモデルと呼んでいます。

運用上の要点は二つです。一つは、コンテキストウィンドウが 1,048,576 token で Claude Fable 5 や GPT-5.6 と同じ 1M tier なので、長い agentic session が 256K の [Kimi K2.7 Code](/blog/try-kimi-k2-7-code-in-your-coding-agent-ja.html) ほど早く compact しないこと。もう一つは、K3 を SFT 段階から MXFP4 重みと MXFP8 activation 向けに訓練したこと。量子化は baked-in で、ダウンロードした重みがそのままデプロイ対象です。

## Kimi K3 が勝るところ、劣るところ

以下の数値は [model card](https://huggingface.co/moonshotai/Kimi-K3) に記載された Moonshot 自己申告で、いずれも `reasoning_effort: max` です。[Claude Fable 5](/blog/try-claude-fable-5-in-codex-openclaw-and-pi-ja.html) と [GPT-5.6 Sol](/blog/gpt-5-6-token-station-ja.html) は本サイトの読者がよく比較する 2 つの frontier モデルです。

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

最も目を引くのは SWE-Marathon、長時間の coding session 向けに作られた benchmark です。Kimi K3 はここで 42.0 を記録し、Fable 5（35.0）と GPT-5.6 Sol（39.0）を上回ります。BrowseComp と tool-use benchmark の MCPMark-Verified でも首位です。より短い単一 repo のタスクでは逆転します：GPT-5.6 Sol が DeepSWE と Terminal-Bench を制し、Fable 5 が FrontierSWE と Kimi Code Bench 2.0 を制します。K3 は全面最優秀ではなく、勝つ行もあれば負ける行もあります。そういう profile こそ router の後ろに置くべきで、各ステップをその仕事で勝つモデルに振り向けます。

## frontier のスコアを mid-tier の価格で

K3 は入力 $3 / 100 万 token、出力 $15 / 100 万 token で、自動コンテキストキャッシュが繰り返し入力を $0.30（90% オフ）に下げます。Token Station はこれを markup ゼロでそのまま通します。

| Model | Input / 1M | Cached input / 1M | Output / 1M | Context |
|---|---|---|---|---|
| `kimi/kimi-k3` | $3.00 | $0.30 | $15.00 | 1,048,576 |

この出力単価は Claude Sonnet 4.6 と同じで、Claude Fable 5（$50）の約 3 分の 1、GPT-5.6 Sol（$30）の約半分です。それでいて上の benchmark は K3 を両者と同等に扱っています。frontier クラスの能力が mid-tier の価格で手に入るのは、agent のメインループを任せたい構成そのものです。

cache hit が最も効くのは coding agent です。session の中でリポジトリのコンテキスト、ファイル要約、diff、テスト出力が何度も送信され、繰り返しコンテキストへの 90% の入力割引こそが長時間の agent 実行で実際に効く節約です。

表示価格は [Moonshot の Kimi K3 価格ページ](https://www.kimi.com/resources/kimi-k3-pricing)より。Token Station は markup なし。

## ひとつの endpoint から Kimi K3 を試す

endpoint は標準の Token Station OpenAI 互換 API です：

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

frontier と比較するには、`model` フィールドを `anthropic/claude-fable-5` または `openai/gpt-5.6-sol` に変えるだけです。endpoint、key、wire format はそのままで、残りは Token Station が変換します。

## K3 で agent のメインループを駆動する

Kimi K2.7 Code は delegated fan-out を担う安価な workhorse として定着しています。K3 が狙うのはその一つ上、メインの推論 loop です。Claude Code では Opus slot に置き、素早いステップはより安い Claude tier に任せます：

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

`ANTHROPIC_DEFAULT_OPUS_MODEL` を `anthropic/claude-fable-5` に切り替えれば、他は一切変えずにメインループが Fable 5 になります。これが単一 gateway でルーティングする意味であり、A/B テストは環境変数ひとつで済みます。

Codex では K3 をデフォルト profile にし、Fable 5 をワンスイッチで呼べるようにします：

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

## 知っておくべき quirks

- **Thinking は常にオン。** K3 は回答前に `reasoning_content` を返します。深さは `reasoning_effort` フィールド（`low`、`high`、`max`、デフォルト `max`）で制御します。output の請求には reasoning token の分を見込んでください。
- **Preserved thinking history。** 複数ターンや tool-call session では、K3 は直前の assistant message 全体を（`content` だけでなく `reasoning_content` と `tool_calls` も含めて）そのまま戻すことを要求します。Token Station は harness が送る内容をそのまま転送するので、履歴から reasoning を除去する harness は長い session で一貫性を失います。
- **ネイティブ視覚。** 同じ route が MoonViT-V2 encoder でテキストと画像を受け付け、図やスクリーンショット、UI のキャプチャがそのまま会話に入ります。
- **オープンウェイト、いつでもセルフホスト可。** 重みは Kimi K3 License で [Hugging Face](https://huggingface.co/moonshotai/Kimi-K3) に公開され、vLLM、SGLang、TokenSpeed で提供できます。今日のクラウド route は後日自分のハードウェアに移せて、hybrid-inference の話をひとつのモデルで済ませられます。

## まずルーティングし、それから決める

Kimi K3 は Token Station のまた別の route です。今週、長い coding session をこれに任せ、Fable 5 や GPT-5.6 Sol に対してどこが持ちこたえるかを見て、各タスクを勝ったモデルに切り替えてください。key ひとつで 3 つを並べて走らせられます。

必要な情報：

- Base URL（OpenAI 互換）：`https://models.bytefuture.ai/v1`
- Base URL（Anthropic 互換）：`https://models.bytefuture.ai`
- Model：`kimi/kimi-k3`
- API key：`gw-` で始まります。[Token Station dashboard](https://models.bytefuture.ai/dashboard) で取得

[Token Station を試す](https://models.bytefuture.ai/intro.html)
