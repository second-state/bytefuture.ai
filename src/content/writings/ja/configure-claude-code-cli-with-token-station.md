---
slug: "configure-claude-code-cli-with-token-station"
lang: "ja"
title: "Claude Code CLIをToken Stationに接続する：Windows、macOS、Linux対応"
summary: "Windows、macOS、LinuxでClaude Code CLIをToken Stationに接続し、実際のリクエストとToken Stationの履歴でエンドツーエンドの動作を確認します。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

Claude Code CLIは、Anthropic Messages APIを使ってサードパーティーのモデルゲートウェイに接続できます。リクエスト先、API key、モデルIDをToken Stationに向ければ、使い慣れた`claude`コマンドからToken Stationのモデルを呼び出せます。

このガイドではWindows、macOS、Linuxでの設定方法を説明します。Base URLに`/v1`を追加しないこと、モデルIDの`openai/`や`anthropic/`などのプロバイダー接頭辞を残すことが重要です。

## 事前準備

次のものを用意してください。

- Claude Code CLI。`claude --version`でバージョンを確認できること
- [Token Station](https://bec.bytefuture.ai/intro.html)のアカウントとAPI key
- 対象モデルの利用権限と利用可能な残高

例では`openai/gpt-5.6-sol`を使います。モデルIDは更新される場合があるため、[Token Stationのモデル一覧](https://bec.bytefuture.ai/models)に表示される完全なIDを使ってください。

> 実際のAPI keyをリポジトリ、公開文書、スクリーンショット、チャットに記載しないでください。

## 設定する変数

| 環境変数 | 用途 | 例 |
| --- | --- | --- |
| `ANTHROPIC_BASE_URL` | Claude CodeのリクエストをToken Stationへ送る | `https://bec.bytefuture.ai` |
| `ANTHROPIC_AUTH_TOKEN` | Token Station API key | 実際のkey |
| `ANTHROPIC_MODEL` | 完全なデフォルトモデルID | `openai/gpt-5.6-sol` |

Claude CodeはBase URLの後ろにAnthropic Messages APIのパスを追加します。次の値を使います。

```text
https://bec.bytefuture.ai
```

`https://bec.bytefuture.ai/v1`にはしないでください。パスが重複し、404になる場合があります。

モデルIDも完全な形を保ちます。

```text
openai/gpt-5.6-sol
```

`gpt-5.6-sol`のように省略しないでください。

この3つの変数をどう読み込ませるかはOSによって異なります。

## Windowsでの設定

### 一時設定

PowerShellで実行します。

```powershell
$env:ANTHROPIC_BASE_URL = "https://bec.bytefuture.ai"
$env:ANTHROPIC_AUTH_TOKEN = "実際の API Key"
$env:ANTHROPIC_MODEL = "openai/gpt-5.6-sol"

claude
```

変数は現在のPowerShellとその子プロセスだけで有効です。最初のテストに適しています。

### ユーザー環境変数として保存

新しいターミナルでも設定を使う場合は実行します。

```powershell
[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_BASE_URL",
  "https://bec.bytefuture.ai",
  "User"
)

[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_AUTH_TOKEN",
  "実際の API Key",
  "User"
)

[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_MODEL",
  "openai/gpt-5.6-sol",
  "User"
)
```

現在のPowerShellを閉じ、新しいウィンドウで`claude`を起動します。すでに動いているプロセスには新しい変数が渡りません。

削除する場合は次を実行します。

```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_MODEL", $null, "User")
```

## macOSとLinuxでの設定

Claude Codeを起動するターミナルで実行します。

```bash
export ANTHROPIC_BASE_URL='https://bec.bytefuture.ai'
export ANTHROPIC_AUTH_TOKEN='実際の API Key'
export ANTHROPIC_MODEL='openai/gpt-5.6-sol'

claude
```

変数は現在のShellと子プロセスだけで有効です。新しいターミナルでも読み込む場合は、3行の`export`をShellの設定ファイルに追加します。

| Shell | 一般的な設定ファイル |
| --- | --- |
| Zsh | `~/.zshrc` |
| Bash | `~/.bashrc` |
| Fish | `~/.config/fish/config.fish`。構文は異なります |

編集後にターミナルを開き直すか、現在のShellで再読み込みします。

```bash
source ~/.zshrc
```

Bashの場合：

```bash
source ~/.bashrc
```

> Shell設定ファイルに保存したAPI keyはディスク上に平文で残ります。Gitや公開同期フォルダーに含めないでください。

## 接続を確認する

Claude Codeが起動するだけでは、Token Stationを使っていることは確認できません。変数を設定したターミナルから実際のリクエストを送ります。

```bash
claude -p '「Token Station テスト成功」とだけ返信してください'
```

PowerShellでは次を使います。

```powershell
claude -p "「Token Station テスト成功」とだけ返信してください"
```

応答を受け取ったら、[Token Stationダッシュボード](https://bec.bytefuture.ai/dashboard)を開き、`Recent Activity`で時刻、状態、モデルを確認します。

次の3点がそろえば接続は完了です。

- Claude Codeが正常に応答する
- Token Stationに対応する記録がある
- 記録されたモデルが設定と一致する

## オプション：モデル階層を割り当てる

Claude Codeの一部の処理はOpus、Sonnet、Haikuの階層を使います。それぞれをToken Stationの別モデルに割り当てられます。

```bash
export ANTHROPIC_DEFAULT_OPUS_MODEL='openai/gpt-5.6-sol'
export ANTHROPIC_DEFAULT_SONNET_MODEL='openai/gpt-5.6-terra'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='openai/gpt-5.6-luna'
```

PowerShellでは次の変数を使います。

```powershell
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "openai/gpt-5.6-sol"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "openai/gpt-5.6-terra"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "openai/gpt-5.6-luna"
```

1つのモデルに固定する場合は`ANTHROPIC_MODEL`だけで構いません。利用可能なモデルはToken Stationの一覧で確認してください。

## トラブルシューティング

### Anthropicアカウントへのログインを求められる

API keyが読み込まれていることを確認し、変数を設定した同じターミナルからClaude Codeを起動します。Windowsでユーザー変数を保存した場合は新しいPowerShellを開いてください。

### 401または403

API keyが無効、余分な空白を含む、モデル権限がない、残高がない可能性があります。keyをコピーし直し、Token Stationでアカウント状態を確認します。

### 404

Base URLは次の値にします。

```text
https://bec.bytefuture.ai
```

`/v1`や`/v1/messages`を追加しないでください。

### モデルが見つからない

Token Stationに表示される完全なモデルIDを使い、プロバイダー接頭辞を残します。

### 応答はあるがToken Stationに記録がない

現在のプロセスがToken Stationを使っていない可能性があります。`ANTHROPIC_BASE_URL`を確認し、同じターミナルからもう一度`claude -p`を実行します。

## 参考資料

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Stationモデル一覧](https://bec.bytefuture.ai/models)
- [Token Stationダッシュボード](https://bec.bytefuture.ai/dashboard)
