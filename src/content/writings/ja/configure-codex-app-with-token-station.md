---
slug: "configure-codex-app-with-token-station"
lang: "ja"
title: "Codex AppをToken Stationに接続する：Windows、macOS、Linux対応"
summary: "Codex AppにToken StationをカスタムモデルProviderとして登録し、各OSでAPI keyを読み込ませ、Responses APIの経路を確認します。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

Codex Appは`config.toml`でカスタムモデルProviderを登録できます。ProviderをToken StationのResponses APIに向けると、Token Station API keyで利用可能なモデルを呼び出せます。

このガイドではWindows、macOS、Linuxでの設定を説明します。デスクトップAppとターミナルプログラムでは環境変数の取得元が異なる場合があります。macOSでDockやFinderから起動したAppは通常`~/.zshrc`を読みません。

## 事前準備

- Codex App
- [Token Station](https://bec.bytefuture.ai/intro.html)のアカウントとAPI key
- 対象モデルの利用権限と残高

例では`openai/gpt-5.6-sol`を使います。Token Stationに表示される完全なモデルIDを確認してください。

> 実際のAPI keyを`config.toml`、スクリーンショット、チャット、リポジトリに記載しないでください。Codexには環境変数から読み込ませます。

## Token Station Providerを登録する

Codex Appで**設定 → 構成 → config.tomlを開く**に進み、次を追加します。

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

既存の設定がある場合は、必要な項目を上書きせずに統合します。

| フィールド | 用途 |
| --- | --- |
| `model` | 完全なデフォルトモデルID |
| `model_provider` | Codexが使うProviderブロック |
| `name` | Providerの表示名 |
| `base_url` | Token Station APIのルート |
| `env_key` | API keyを保存する環境変数名 |
| `wire_api` | Responses APIを選択する値 |

2つの`token_station`は一致させます。

```toml
model_provider = "token_station"
[model_providers.token_station]
```

`base_url`は`/v1`までとし、`/responses`を追加しません。モデルIDのプロバイダー接頭辞も残します。

Providerの設定は環境変数の名前を宣言するだけで、値そのものは渡しません。さらに、デスクトップアプリが見る環境は、ターミナルが見ているものと同じとは限りません。以下の3節でOSごとの手順を説明します。

## Windows：API keyを設定する

**システムの詳細設定 → 環境変数**を開き、ユーザー環境変数を作成します。

| 項目 | 値 |
| --- | --- |
| 変数名 | `TOKEN_STATION_API_KEY` |
| 変数値 | 実際のToken Station API key |

変数名は`config.toml`の`env_key`と完全に一致させます。保存後、Codex Appを完全に終了して開き直します。

## macOS：API keyを設定する

Dock、Finder、Launchpadから起動したAppは、現在のターミナルの`export`を通常は引き継ぎません。グラフィカルログインセッションに変数を追加します。

```bash
launchctl setenv TOKEN_STATION_API_KEY '実際の API Key'
```

keyを表示せずに存在を確認します。

```bash
if [ -n "$(launchctl getenv TOKEN_STATION_API_KEY)" ]; then
  echo "TOKEN_STATION_API_KEY は設定済みです"
else
  echo "TOKEN_STATION_API_KEY は未設定です"
fi
```

`Command + Q`でCodex Appを終了し、Dock、Finder、Launchpadから開き直します。

`launchctl setenv`の変数は通常、現在のログインセッションだけで有効です。ログアウトや再起動後は再設定が必要な場合があります。削除するには：

```bash
launchctl unsetenv TOKEN_STATION_API_KEY
```

## Linux：API keyを設定する

環境変数の継承方法はディストリビューション、デスクトップ環境、インストール方法によって異なります。ターミナルから起動する場合は、同じShellで設定します。

```bash
export TOKEN_STATION_API_KEY='実際の API Key'
```

存在を確認します。

```bash
if [ -n "${TOKEN_STATION_API_KEY:-}" ]; then
  echo "TOKEN_STATION_API_KEY は設定済みです"
else
  echo "TOKEN_STATION_API_KEY は未設定です"
fi
```

同じターミナルからCodexを起動します。新しいターミナルでも読み込む場合は、`export`を`~/.bashrc`または`~/.zshrc`に追加します。

GNOMEやKDEのメニューから起動し、systemdユーザーセッションを使う場合は次を試せます。

```bash
systemctl --user set-environment TOKEN_STATION_API_KEY='実際の API Key'
```

Appを完全に終了して開き直します。削除するには：

```bash
systemctl --user unset-environment TOKEN_STATION_API_KEY
```

> Shell設定ファイルに保存したkeyは平文で残ります。Gitや公開同期フォルダーに含めないでください。

## 経路を確認する

Codex Appが返答しても、それは証拠の半分にすぎません。経路の両端を確認します。

1. Codex Appを完全に終了して開き直す
2. 新しい会話を作成する
3. 次を送る

   ```text
   「Token Station テスト成功」とだけ返信してください
   ```

4. 正常な応答を確認する
5. [Token Stationダッシュボード](https://bec.bytefuture.ai/dashboard)を開く
6. `Recent Activity`で時刻、状態、モデルを照合する

経路は次のようになります。

```text
Codex App
→ config.toml 内の token_station provider
  → TOKEN_STATION_API_KEY
  → https://bec.bytefuture.ai/v1/responses
→ Token Station の呼び出し履歴
```

Appの応答とToken Stationの対応する記録がそろえば接続完了です。

## トラブルシューティング

### API keyが見つからない

変数名が`env_key = "TOKEN_STATION_API_KEY"`と完全に一致することを確認し、設定後にAppを再起動します。macOSでDockから起動する場合は`launchctl setenv`を使います。

### 401または403

keyが無効、余分な空白を含む、モデル権限がない、残高がない可能性があります。

### 404

次を確認します。

```toml
base_url = "https://bec.bytefuture.ai/v1"
wire_api = "responses"
```

`/responses`を重ねて追加しないでください。

### モデルが見つからない

Token Stationが提供する完全なモデルIDを使い、プロバイダー接頭辞を残します。

### 応答はあるがToken Stationに記録がない

`model_provider`とProviderブロック名が一致すること、Appが編集後の`config.toml`を読み直したことを確認します。

## 参考資料

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Stationダッシュボード](https://bec.bytefuture.ai/dashboard)
