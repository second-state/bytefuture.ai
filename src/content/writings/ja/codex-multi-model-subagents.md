---
slug: "codex-multi-model-subagents"
lang: "ja"
title: "Codexで複数モデルのSubagentを編成する"
summary: "Codexの主Agentが複雑さ、リスク、検証可能性に応じてSubagentを振り分ける方法を、Provider、役割、権限、実例、段階的な導入手順とともに解説します。"
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

大きな開発作業を1つのモデルだけで処理する必要はありません。強い主Agentが目的を理解し、境界の明確な作業を異なるモデルのSubagentへ委任し、最後のテストと受け入れを担当できます。

重要なのはAgentの数ではなく、制御できる流れです。

```text
目標
  → 主 Agent が分解してルーティング
  → Subagent が限定された範囲で実行
  → テストと独立レビュー
  → 主 Agent が統合して受け入れ
```

## 主Agent、Subagent、ツール

主Agentは計画、依存関係、リスク、ルーティング、競合解決、テスト、最終的な引き渡しを担当します。コードの大半を書かないとしても、そのモデルは判断と修正において信頼できるものにしてください。

Subagentが最も力を発揮するのは、範囲が狭く検証できるタスクです。`src/auth`を編集せずに調査する、1つのモジュールにテストを追加する、指定したディレクトリを移行する、公式ドキュメントからAPIを抽出する、2つの実装を比較する、といった仕事が該当します。

Agentが実際に触れられる範囲を決めるのはモデルではなくツールです。ファイル、コード検索、テスト、ブラウザ、MCPサービス、Gitがその対象になります。ツール権限が広すぎたり書き込み範囲が曖昧だったりする状態は、どのモデルを選んでも埋め合わせられません。

## ProfileとAgentの役割を区別する

Codexの名前付きprofileはセッションに設定を重ねる仕組みであり、主Agentが自動選択する役割そのものではありません。複数Agentのルーティングには、役割の説明と委任境界が必要です。

まずバージョンを確認します。

```bash
codex --version
```

未対応フィールドを見逃さないよう、厳格な設定検証を使います。

```bash
codex --strict-config
```

現在のバージョンが拒否するフィールドは、そのバージョンのOpenAI DocsとCLIヘルプに合わせてください。

## モデルProviderを設定する

Token Stationでは1つのResponses API ProviderとAPI keyから複数モデルを利用できます。`~/.codex/config.toml`に追加します。

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

環境変数でkeyを渡します。

```bash
export TOKEN_STATION_API_KEY='実際の API Key'
```

PowerShell：

```powershell
$env:TOKEN_STATION_API_KEY = "実際の API Key"
```

Provider ID、環境変数名、`/v1`までのBase URL、`wire_api = "responses"`を一致させます。モデルIDには`openai/`などの接頭辞を残します。

## Agentの役割を定義する

次は4つの役割を登録する構成例です。feature flagやAgentフィールドはCodexのバージョンで変わる可能性があるため、`--strict-config`で検証してください。

```toml
[features]
multi_agent = true

[agents]
max_threads = 4
max_depth = 1

[agents.researcher]
description = "コードと文書を読み取り専用で調査し、証拠、ファイル位置、結論を返す"
config_file = "agents/researcher.toml"

[agents.implementer]
description = "明示されたファイル範囲で機能を実装し、指定されたテストを実行する"
config_file = "agents/implementer.toml"

[agents.test_writer]
description = "製品の動作を変えずにテストと失敗シナリオを追加する"
config_file = "agents/test-writer.toml"

[agents.security_reviewer]
description = "高リスクの変更を読み取り専用でレビューし、再現可能なシナリオを示す"
config_file = "agents/security-reviewer.toml"
```

`description`には役割、禁止事項、期待する出力を具体的に書きます。

### 読み取り専用Researcher

```toml
model = "openai/gpt-5.6-luna"
model_provider = "token_station"
model_reasoning_effort = "low"
sandbox_mode = "read-only"

developer_instructions = """
指定された範囲だけを調査する。ファイルパス、行番号、または文書の出典を引用する。
ファイルを変更せず、タスクの範囲を広げない。
事実、推論、未検証事項を明確に区別する。
"""
```

### Implementer

```toml
model = "openai/gpt-5.6-terra"
model_provider = "token_station"
model_reasoning_effort = "medium"
sandbox_mode = "workspace-write"

developer_instructions = """
タスクで明示されたディレクトリとファイルだけを変更する。
隣接するコードとプロジェクト指示を先に読み、最小限で完全な変更を実装する。
指定されたテストを実行し、変更ファイル、テスト結果、残るリスクを報告する。
"""
```

### 独立Reviewer

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"
model_reasoning_effort = "high"
sandbox_mode = "read-only"

developer_instructions = """
実装者の結論を引き継がず、独立して実装をレビューする。
対処可能で再現可能な問題だけを報告し、正確なファイル位置を示す。
権限、データ境界、エラー処理、テスト不足を重点的に確認する。
"""
```

別のモデルを使う場合はToken Stationの完全なIDを指定し、Responses API、複数回のツール呼び出し、コンテキスト制限を先に確認します。

## モデル選択の基準

要件分析、設計、認証、権限、移行、決済、削除は強いモデルと独立レビューに残します。リネーム、整形、テスト生成など、テストや型チェックで安く検証できる仕事は高速モデルに向いています。

判断軸は複雑さ、リスク、検証可能性、暗黙のコンテキスト依存です。会話履歴に強く依存する仕事は、委任による情報損失を避けるため主Agentが直接処理する方が安全です。

## ルーティング規則を書く

プロジェクトの`AGENTS.md`に短く実行可能な規則を追加します。

```markdown
タスクが複雑、並列化可能、または独立レビューが必要な場合は、まず Subagent が必要か判断する。

タスクのルーティング規則：
- 単純、機械的、低リスクな作業は researcher または高速な役割に渡す。
- 大量のコード実装は implementer に渡す。
- 外部資料の調査は researcher に渡し、出典を必須にする。
- テスト追加は test_writer に渡す。
- アーキテクチャ、セキュリティ、権限、最終受け入れは主 Agent が担当する。
- 各サブタスクに明確な範囲、出力、受け入れ基準を含める。
- 書き込み可能な 2 つの Agent に同じファイルを同時変更させない。
- Subagent の結果をテストまたは独立チェックで検証する。
- 小さなタスクは主 Agent が直接処理し、Subagent を使うためだけに分割しない。
```

## 第三者モデルを段階的に検証する

OpenAI互換APIでもCodexのすべての動作を保証するわけではありません。純粋な文章、正確なファイル参照、読み取り専用検索、小さな一時編集、テスト失敗後の修正、権限やタイムアウトの報告、Token Stationの履歴という順番で確認します。

## 完全な例：ファイルアップロード

画像形式、サイズ制限、オブジェクトストレージ、単体テストを追加する場合、主Agentは次のタスクグラフを作れます。

```text
主 Agent
├── Researcher：フレームワークのアップロード API とオブジェクトストレージ SDK を調査
├── Implementer：アップロードサービスと API を実装
├── Test Writer：形式、サイズ、異常シナリオのテストを作成
└── Security Reviewer：パストラバーサル、MIME 偽装、リソース乱用を確認
```

Researcher：

```text
プロジェクトで使用している Web フレームワークとオブジェクトストレージ SDK の文書を読む。

次の内容だけを返す：
1. 推奨されるアップロード処理方法。
2. ストリーミング処理とメモリ制限。
3. 公式に推奨されるエラー処理方法。
4. 関連する API 名と出典。

コードを変更しない。
```

Implementer：

```text
src/upload の範囲でアップロードサービスを実装する。

要件：
- 最大ファイルサイズは 10 MB。
- JPEG、PNG、WebP だけを許可する。
- クライアントが提供する Content-Type を信頼しない。
- 既存のオブジェクトストレージクライアントを使用する。
- データベース構造を変更しない。
- 完了後に変更ファイル、テスト結果、未検証事項を列挙する。
```

Test Writer：

```text
アップロード機能のテストを追加する。

必ず次を網羅する：
- 有効な JPEG。
- サイズ制限を超えるファイル。
- 拡張子と実際の内容が一致しないファイル。
- 空ファイル。
- ストレージサービスの障害。
- 同時アップロード時のファイル名競合。
```

Security Reviewer：

```text
アップロード実装だけをレビューし、ファイルは変更しない。

重点的に確認する項目：
- パストラバーサル。
- MIME 偽装。
- 画像パーサーの脆弱性。
- 制限のないメモリ使用。
- 推測可能なファイル名。
- エラーメッセージによる情報漏えい。

すべての指摘にファイル位置と再現可能なシナリオを含める。
```

最後に主Agentがdiff、全テスト、競合、セキュリティ判断を確認します。

## 失敗しやすい点

### 1行の変更にSubagentを作らない

Subagentを作るたびにコンテキストの受け渡しと調整のコストが発生します。分割が有効なのは、並行して実行できる、作業量が大きい、異なる専門性が必要、独立した検証が必要、または境界が非常に明確な場合です。

### 複数の書き込みAgentに同じファイルを触らせない

書き込み範囲はディレクトリまたはモジュールで分けます。一方のAgentが実装し、もう一方は読み取り専用で審査します。依存関係のあるタスクは順番に実行し、最終的な統合は主Agentが行います。

### 主Agentは結果を無条件に信頼できない

Subagentの「完了」は、そのAgentが完了したと考えているという意味にすぎません。主Agentはdiffを読み、テストを実行し、エラー出力を確認し、範囲外の変更がないことを確かめ、結果が元の要件を満たしているかを判断する必要があります。

### API keyと非公開コードを守る

keyは環境変数、シークレット管理、またはOSの資格情報ストアから渡します。第三者Providerにタスクを渡すと、プロンプトとコードのコンテキストがそのサービスへ送られる可能性があります。非公開プロジェクトでは、データ保持、学習利用、保存地域、コンプライアンス要件、外部に出してはいけないディレクトリを、ルーティングを始める前に確認してください。

Subagentには、そのタスクに必要な最小限のコンテキストだけを渡します。

### 安いモデルが総コストを下げるとは限らない

頻繁に失敗して再試行し、最後に強いモデルで手戻りが発生する安いモデルは、最初から強いモデルを使うより高くつくことがあります。

```text
実効コスト =
呼び出しコスト
+ 再試行コスト
+ 主 Agent のレビューコスト
+ 誤った変更の修正コスト
```

モデルは100万Tokenあたりの価格ではなく、タスク種別ごとの実測結果で判断します。

## 段階的に導入する

### 第1段階：主Agentと読み取り専用Researcher

まずリポジトリ検索、ドキュメント調査、構造化された報告を検証します。読み取り専用の権限なら、失敗したときのコストが小さく済みます。

### 第2段階：高速な作業Agentを追加する

整形、テストの雛形、ドキュメントの補完、範囲を明示した一括置換を任せ、結果はツールで検証させます。

### 第3段階：実装Agentを追加する

ツール呼び出しとファイル変更が安定してから、ワークスペースへの書き込み権限を与えます。書き込み範囲はディレクトリやファイル名で明確に限定します。

### 第4段階：独立Reviewerを追加する

実装と審査を別のモデルに割り当て、それぞれが実際に何を見つけられるかを比べます。

### 第5段階：自動ルーティングの前に測る

成功率、遅延、Token消費、再試行率、人手による手戻り時間を記録し、その記録に基づいてタスクとモデルの対応を調整します。

## まとめ

成熟した複数モデルの構成は、タスクごとにAgentを増やすことはせず、常に最強または最安のモデルを選ぶこともしません。複雑さ、リスク、検証しやすさ、コンテキスト依存に応じて十分な実行者を選び、重要な判断、権限の管理、最終的な品質は主Agentに残します。

まず信頼できるProviderを1つ設定し、次に境界の明確な少数の役割を定義します。`--strict-config`で現在のCodexがフィールドを認識するかを確認し、読み取り専用のタスクから検証を始め、自動ルーティングと書き込み権限は最後に開放してください。

## 参考資料

- [OpenAI Docs：Codex Multi-agent](https://developers.openai.com/codex/multi-agent/)
- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Stationモデル一覧](https://bec.bytefuture.ai/models)
- [Token Stationダッシュボード](https://bec.bytefuture.ai/dashboard)
