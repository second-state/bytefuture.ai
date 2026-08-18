---
slug: "configure-codex-cli-with-token-station"
lang: "ja"
title: "Codex CLIをToken Stationに接続する：Windows、macOS、Linux対応"
summary: "Codex CLIにToken StationをカスタムProviderとして設定し、各OSでAPI keyを安全に読み込ませ、Responses APIのリクエストを確認します。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

Codex CLIは`config.toml`でカスタムモデルProviderを設定できます。Token Stationを追加すると、`codex`と`codex exec`をそのまま使いながら、Token Station API keyでリクエストを送れます。

このガイドはコマンドライン版Codex向けです。Codex Appは特にmacOSとLinuxのデスクトップで環境変数の継承方法が異なるため、設定手順を混在させないでください。

## 事前準備

- `codex --version`で確認できるCodex CLI
- 利用可能なToken Station API key
- 対象モデルの利用権限または残高

> 実際のAPI keyを文書、画像、チャット、リポジトリに公開しないでください。

## Token Station Providerを設定する

Codex CLIは次のユーザー設定ファイルを読みます。

- Windows：`%USERPROFILE%\.codex\config.toml`
- macOSとLinux：`~/.codex/config.toml`

次を追加します。

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

既存の設定がある場合は、必要な項目を消さずに統合します。

| フィールド | 用途 |
| --- | --- |
| `model` | 完全なデフォルトモデルID |
| `model_provider` | Codexが使うProviderブロック |
| `name` | Providerの表示名 |
| `base_url` | Token Station APIのルート |
| `env_key` | API keyを保存する環境変数名 |
| `wire_api` | Responses APIを選択する値 |

次を確認します。

- `model_provider = "token_station"`が`[model_providers.token_station]`と一致する
- `base_url`は`/v1`までで、`/responses`を追加しない
- `wire_api`は`"responses"`
- モデルIDにプロバイダー接頭辞がある

例は`openai/gpt-5.6-sol`です。Token Stationに表示される現在の完全なIDを使ってください。

## Windowsでの設定

### 一時的にkeyを読み込む

PowerShellで実行します。

```powershell
$env:TOKEN_STATION_API_KEY = "実際の API Key"
```

変数は現在のPowerShellとその子プロセスだけで有効です。

### ユーザー環境変数として保存

```powershell
[Environment]::SetEnvironmentVariable(
  "TOKEN_STATION_API_KEY",
  "実際の API Key",
  "User"
)
```

保存後にターミナルを閉じ、新しいPowerShellを開きます。

keyを表示せずに変数を確認します。

```powershell
if ([string]::IsNullOrEmpty($env:TOKEN_STATION_API_KEY)) {
  "TOKEN_STATION_API_KEY は未設定です"
} else {
  "TOKEN_STATION_API_KEY は設定済みです"
}
```

削除する場合：

```powershell
[Environment]::SetEnvironmentVariable(
  "TOKEN_STATION_API_KEY",
  $null,
  "User"
)
```

## macOSとLinuxでの設定

Codex CLIを実行するターミナルで設定します。

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

新しいターミナルでも読み込む場合は、Shellの設定ファイルに`export`を追加します。

| Shell | 一般的な設定ファイル |
| --- | --- |
| Zsh | `~/.zshrc` |
| Bash | `~/.bashrc` |
| Fish | `~/.config/fish/config.fish`。構文は異なります |

編集後に新しいターミナルを開くか、`source ~/.zshrc`または`source ~/.bashrc`を実行します。

> Shell設定ファイルのkeyは平文で保存されます。Gitや公開同期フォルダーに含めないでください。

## 設定を確認する

対話モードを起動します。

```bash
codex
```

起動後に送信します。

```text
「Token Station テスト成功」とだけ返信してください
```

非対話リクエストも実行できます。

```bash
codex exec '「Token Station テスト成功」とだけ返信してください'
```

PowerShellでは二重引用符を使います。

```powershell
codex exec "「Token Station テスト成功」とだけ返信してください"
```

応答後、[Token Stationダッシュボード](https://bec.bytefuture.ai/dashboard)の`Recent Activity`で時刻、状態、モデルを照合します。

次の3点がそろえば設定完了です。

- `codex`または`codex exec`が正常に応答する
- Token Stationに対応するリクエストがある
- 記録されたモデルが設定と一致する

## トラブルシューティング

### `codex`コマンドが見つからない

Codex CLIがインストールされ、インストール先が`PATH`に含まれることを確認します。新しいターミナルで`codex --version`を実行します。

### API keyが見つからない

変数名が`TOKEN_STATION_API_KEY`であり、`config.toml`の`env_key`と一致すること、同じターミナルからCodexを起動していることを確認します。

### 401または403

keyが無効、余分な空白を含む、モデル権限がない、残高がない可能性があります。

### 404

次を確認します。

```toml
base_url = "https://bec.bytefuture.ai/v1"
wire_api = "responses"
```

Base URLに`/responses`を追加しないでください。

### モデルが見つからない、またはリクエストに失敗する

Token Stationが現在提供する完全なモデルIDを使い、プロバイダー接頭辞を残します。

### 古い設定が使われる

現在のユーザーの`config.toml`を編集したこと、拡張子が正しいこと、Codex CLIプロセスを再起動したことを確認します。

## セキュリティ

- 実際のkeyを`config.toml`に書かない
- keyを含むShell設定ファイルをGitにコミットしない
- 共有PCでは一時環境変数を優先する
- 漏えいの可能性があればkeyを直ちに無効化して再発行する

## 参考資料

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Stationダッシュボード](https://bec.bytefuture.ai/dashboard)
