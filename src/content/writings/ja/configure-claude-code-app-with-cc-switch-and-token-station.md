---
slug: "configure-claude-code-app-with-cc-switch-and-token-station"
lang: "ja"
title: "CC Switch と Token Station で Claude Code App を設定する"
summary: "Claude Code App 用の Token Station Provider を作成し、モデルマッピング、CC Switch のローカルルーティング、Claude ルーティングを有効にして、実際のリクエストで経路全体を検証します。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

CC Switch を使うと、複数の Claude Code Provider を保存し、設定ファイルを何度も手作業で変更せずにサービスを切り替えられます。本記事では Claude Code App を Token Station に接続し、Claude の Sonnet、Opus、Haiku ロールを Token Station で利用可能なモデルへ割り当て、CC Switch のローカルサービス経由でリクエストを転送します。

> 本記事は CC Switch の **Claude Code App** パネルを対象としています。Claude Desktop と Claude Code CLI は設定経路が異なるため、それらの手順をこの設定に流用しないでください。

## 準備するもの

- CC Switch と Claude Code App
- 有効な Token Station API Key
- 利用するモデルへのアクセス権と利用可能なクレジット

[Token Station ダッシュボード](https://bec.bytefuture.ai/dashboard)を開き、完全なモデル ID を確認します。API Key をスクリーンショット、チャット、Git リポジトリに含めないでください。

## 設定の流れ

必要な手順は次のとおりです。

1. CC Switch で Claude Code Provider を作成する
2. Token Station の URL と API Key を入力する
3. **Needs model mapping** を有効にする
4. Sonnet、Opus、Haiku を Token Station のモデル ID に割り当てる
5. CC Switch のローカルルーティングと Claude ルーティングを有効にする
6. Provider を有効にし、Claude Code App を完全に再起動する
7. リクエストを送信し、Token Station で記録を確認する

モデルマッピングやローカルルーティングを省略すると、CC Switch に Token Station が現在の Provider と表示されていても、App が以前のサービスを使い続けることがあります。

## Token Station Provider を追加する

CC Switch のバージョンによってボタン名は多少異なりますが、必要な設定値は同じです。

### 1. Provider を作成する

CC Switch を開き、**Claude Code** を選択して Provider 管理画面に進みます。Add、New Provider、またはプラスボタンをクリックし、分かりやすい名前を付けます。

```text
Token Station
```

Provider の種類や API 形式を求められた場合は、Claude、Anthropic、または **Anthropic Messages（native）** を選択します。

### 2. 接続情報を入力する

| 項目 | 設定値 |
| --- | --- |
| Request URL / Base URL | `https://bec.bytefuture.ai` |
| API Key / Auth Token | Token Station の API Key |
| API 形式 | Anthropic Messages（native） |
| Needs model mapping | 有効 |

<figure>
  <img src="/blog/cc-switch-token-station-provider-settings.png" alt="API Key、リクエスト URL、Anthropic Messages 形式を設定し、モデルマッピングを有効にした CC Switch の Token Station Provider 設定" />
  <figcaption>Token Station のルート URL と Anthropic Messages の native 形式を使用します。</figcaption>
</figure>

Base URL に `/v1/messages` を追加しないでください。クライアントがリクエストパスを生成するため、重複すると 404 になることがあります。

環境変数が表示されるバージョンでは、次の値を使います。

```text
ANTHROPIC_BASE_URL=https://bec.bytefuture.ai
ANTHROPIC_AUTH_TOKEN=<Token Station の API Key>
ANTHROPIC_MODEL=<完全なモデル ID>
```

一部のテンプレートは `ANTHROPIC_AUTH_TOKEN` ではなく `ANTHROPIC_API_KEY` を使います。現在のテンプレートに表示される項目に従い、不明な認証項目を同時に複数設定しないでください。

### 3. Needs model mapping を必ず有効にする

**Needs model mapping** は必ず有効にします。Claude Code App は Sonnet、Opus、Haiku などの Claude ロールでモデルを要求します。CC Switch がこれらのロールを、Token Station が認識する完全なモデル ID に変換する必要があります。

<figure>
  <img src="/blog/cc-switch-needs-model-mapping.png" alt="Needs model mapping オプションを有効にした CC Switch の Provider フォーム" />
  <figcaption>Token Station Provider を保存する前に「Needs model mapping」を有効にします。</figcaption>
</figure>

無効のままだと、マッピングされていない Claude ロール名が送信されてモデル未検出エラーになったり、App が意図しない経路を使い続けたりする可能性があります。

## モデルマッピングを設定する

Token Station Provider のモデルマッピング画面を開き、各 Claude ロールに完全な Token Station モデル ID を割り当てます。最初は次の組み合わせを利用できます。

| Claude ロール | Token Station モデル |
| --- | --- |
| Sonnet | `openai/gpt-5.6-terra` |
| Opus | `openai/gpt-5.6-sol` |
| Haiku | `openai/gpt-5.6-luna` |

これらは設定例です。利用できるモデルは変わるため、保存前に Token Station で現在のモデル ID とアカウント権限を確認してください。`openai/` のような Provider プレフィックスも含めます。

```text
openai/gpt-5.6-sol
```

一般的には Sonnet を標準的な作業、Opus をより複雑な作業、Haiku を高速で軽量な作業に割り当てられます。価格、速度、可用性に応じて変更しても構いません。重要なのは、要求されるすべてのロールが有効な Token Station モデルへ解決されることです。

## CC Switch のローカルルーティングを有効にする

この手順は最も飛ばされやすく、飛ばすとアプリが以前のサービスから返答し続ける原因になります。Provider を有効にするだけでは不十分で、モデルマッピングはローカルで動作する CC Switch サービスによって適用されるため、そのサービスが起動している必要があります。

1. **CC Switch Settings → Routing** を開く
2. **Show local routing switch on the home page** を有効にする
3. ルーティングのマスタースイッチを起動した状態にする
4. ルーティング対象の **Claude** を有効にする
5. Claude Code パネルへ戻り、ローカルルーティングのトグルを On にする

<figure>
  <img src="/blog/cc-switch-local-routing-settings.png" alt="ローカルルーティングが稼働し、Claude ルーティングが有効になっている CC Switch のルーティング設定" />
  <figcaption>ルーティングサービスを稼働させ、ホーム画面のスイッチと Claude ルーティングを有効にします。</figcaption>
</figure>

この経路を使う間は CC Switch を起動したままにしてください。CC Switch を終了するとローカルゲートウェイも停止し、この設定では Claude Code App から Token Station に接続できなくなります。

実際のリクエスト経路は次のとおりです。

```text
Claude Code App
  → CC Switch local routing
  → model mapping
  → Token Station
  → selected model
```

## 保存、有効化、再起動

保存前に、URL に余分なパスがないこと、API Key の前後に空白がないこと、**Needs model mapping** が有効なこと、各モデル ID に Provider プレフィックスが含まれることを確認します。

Provider を保存し、**Token Station** を選択して Enable、Apply、または Switch をクリックします。その後、Claude Code App を完全に終了してから再度開きます。ウィンドウを閉じただけでは、古い設定を保持したプロセスが残る場合があります。

Windows ではシステムトレイを確認し、必要なら Quit を選びます。macOS では `Command + Q` を使います。App の再起動時も CC Switch とルーティングサービスを稼働させてください。

## 経路全体を検証する

Claude Code App で新しい会話を開始し、次を送信します。

```text
「Token Station テスト成功」とだけ返信してください
```

応答後、[Token Station ダッシュボード](https://bec.bytefuture.ai/dashboard)の `Recent Activity` またはリクエストログを開き、次を確認します。

- 送信した時刻に新しいリクエストがある
- リクエストが正常に完了している
- 記録されたモデルが CC Switch のロールマッピングと一致する

App の応答と一致する Token Station の記録がそろって、初めて経路全体が有効だと確認できます。CC Switch の Current Provider 表示だけでは十分ではありません。

## 元の Provider に戻す

公式 Provider は上書きせず残しておきます。戻す場合は元の Provider を選び、Apply または Switch をクリックします。Token Station の経路が不要なら関連するルーティングを無効にし、Claude Code App を完全に終了して再度開きます。

## トラブルシューティング

### App が古い Provider を使い続ける

App を完全に終了し、Token Station Provider を再適用します。ローカルルーティングと Claude ルーティングがともに有効なことを確認してから App を開きます。

### モデルマッピングが無効になっている

Provider を編集して **Needs model mapping** を有効にし、Sonnet、Opus、Haiku が有効な Token Station モデル ID を参照していることを確認します。保存後、Provider を再適用します。

### ローカルルーティングが無効になっている

**Settings → Routing** でルーティングサービスを開始し、Claude ルーティングを有効にします。Claude Code パネルに戻り、ローカルルーティングのスイッチも有効にします。

### CC Switch が起動していない

ローカルゲートウェイは CC Switch の稼働中だけ利用できます。CC Switch を開き、ルーティングを開始してから再試行します。

### API Key 不足、または 401 / 403

テンプレートが `ANTHROPIC_AUTH_TOKEN` と `ANTHROPIC_API_KEY` のどちらを要求しているか確認します。Key の有効性、余分な空白、対象モデルへの権限とクレジットも確認してください。

### 404 が返る

Base URL を `https://bec.bytefuture.ai` にし、手作業で追加した `/messages`、`/v1/messages`、その他の重複パスを削除します。

### モデルが見つからない、または権限がない

Token Station から完全なモデル ID をコピーし、対応する Sonnet、Opus、Haiku のマッピングを確認します。App の表示名から ID を推測しないでください。

### App は応答するが Token Station に記録がない

元のサービスを使っている可能性があります。現在の Provider、モデルマッピング、2 つのルーティングスイッチ、App の再起動、Token Station のアカウントと時刻フィルターを順番に確認します。

## セキュリティ上の注意

- 実際の API Key をチュートリアルのスクリーンショットに含めない
- CC Switch の設定や認証情報を Git にコミットしない
- 漏えいの可能性があれば、すぐに Key を無効化して再発行する
- CC Switch や Claude Code App の更新前に、動作する Provider をバックアップする

## まとめ

この設定には Token Station Provider、**Needs model mapping**、CC Switch のローカルルーティングと Claude ルーティング、Claude Code App の完全な再起動という 4 つの要素が必要です。最後に Token Station のアクティビティログを確認し、実際にどのサービスとモデルがリクエストを処理したかを確かめてください。

## 参考資料

- [Token Station ダッシュボード](https://bec.bytefuture.ai/dashboard)
- [CC Switch プロジェクト](https://github.com/farion1231/cc-switch)
