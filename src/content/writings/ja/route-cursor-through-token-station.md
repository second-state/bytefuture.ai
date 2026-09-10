---
slug: "route-cursor-through-token-station"
lang: "ja"
title: "Cursor を Token Station に接続する：Claude Sonnet 5 と Haiku"
summary: "Cursor は Settings の Models パネルからカスタム OpenAI 互換プロバイダーに対応している。Token Station を指定すれば Claude Sonnet 5 と Haiku が選択可能なモデルとして現れ、Agent モードも完全にサポートする。チャットだけでなく実際のファイル編集ができ、調査と検証を任せる専用のサブエージェントも使える。"
category: "tutorial"
date: "2026-08-26"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-cover.png"
draft: false
---

Cursor は Settings → Models からカスタム OpenAI 互換プロバイダーに対応している。Token Station のエンドポイントを指定すれば、Claude Sonnet 5 と Haiku を選択可能なモデルとして追加でき、すべて自分の Token Station キーで課金される。Token Station 上の他のいくつかのモデルファミリーと違い、この二つは Cursor の Agent モードを完全にサポートする。チャットだけでなく、実際のファイル編集ができるということだ。ここでは設定を最初から最後まで説明する。実際にやってみて遭遇した命名上の落とし穴も含めて、最後には実際のコーディングセッションまで見せる。Sonnet 5 がオープンソースプロジェクトで実際の機能を実装し、調査と検証を二つの専用サブエージェントに委任する様子だ。

設定に入る前に、Cursor に直接課金するのではなく、なぜわざわざ Token Station 経由で Cursor をルーティングするのかをはっきりさせておく価値がある。具体的な理由は三つある。Cursor の Pro プランは一部のモデル（Grok 4.6、Grok 4.5、Composer 2.5）を共通の月次利用枠にまとめており、それ以外のモデルは別の枠からそれぞれのモデル自身の API 価格で課金される。しかし、どちらの枠も実際に何にいくら使ったのかをモデルごと、リクエストごとに内訳として見せてはくれない。Token Station のキーはその両方を回避する。BYOK のリクエストは Token Station のエンドポイントに直接送られ、Cursor 自身の課金には一切触れず、プロバイダーの実際のレートでマークアップなしに、自分のダッシュボードにそのまま表示される。第二に、Cursor が使っている複数のコーディングツールの一つに過ぎない場合（たとえば Claude Code や Codex、OpenClaw も併用しているような場合）、同じ Token Station キーと同じモデル ID がそれらすべてで使える。ツールごとに別々のキーを用意し、別々にチャージし、別々に請求を突き合わせる代わりに、追跡すべきアカウントも残高も一つで済む。第三に、Token Station のカタログは 300 モデル、30 以上のプロバイダーを超えており、Cursor が自社の枠に詰め込んでいる範囲をはるかに超えている。

## 始める前に必要なもの

- Cursor がインストール済みであること（[cursor.com/download](https://cursor.com/download)）。
- Token Station のアカウントと API キー。[models.bytefuture.ai](https://models.bytefuture.ai) から無料登録できる。登録時に 1 ドル分のクレジットが付与され、クレジットカードは不要。
- Cursor Pro。Agent モードでのカスタムモデル選択は、自分の API キーを設定していても無料プランではロックされているため、Chat モード以外の用途にはすべて Pro（月額 20 ドル)が必要になる。

## ステップ 1：Token Station をカスタムプロバイダーとして登録する

**Settings → Cursor Settings → Models** を開き、**API Keys** までスクロールして、二つのフィールドを設定する。

- **OpenAI API Key**：Token Station のキーを入力する。
- **Override OpenAI Base URL**：トグルをオンにし、デフォルト値を `https://models.bytefuture.ai/v1` に置き換える。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>Cursor の Models 設定で、Token Station をカスタム OpenAI 互換プロバイダーとして登録する。</figcaption>
</figure>

キーとURLが正しいことの確認を「Verify」ボタンに頼らないこと。常に表示されるわけではなく、表示されていてもすべての経路をカバーしているわけではない。信頼できる確認方法はステップ 2 だ。モデルを追加して、実際にメッセージを送ってみる。

## ステップ 2：Claude Sonnet 5 と Haiku をカスタムモデルとして追加する

引き続き Models の設定で、**+ Add Custom Model** を二回クリックし、次を追加する。

```
anthropic/claude-sonnet-5
anthropic/claude-haiku-4-5
```

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/add-models.mp4" type="video/mp4">
  </video>
  <figcaption>anthropic/claude-sonnet-5 と anthropic/claude-haiku-4-5 をカスタムモデルとして追加する。</figcaption>
</figure>

**ここが落とし穴**：ここで登録した名前を、Cursor はそのままリクエストの `model` フィールドとして送信する。Token Station の実際のルート名には `anthropic/` プレフィックスが含まれる。プレフィックスなしの `claude-sonnet-5` として登録すると、すべてのリクエストが `Model 'claude-sonnet-5' not found` というエラーで失敗する。プレフィックスなしのそのモデルは実際に存在しないからだ。プレフィックス付きで登録すればすぐに動作する。

Cursor に受け付けられただけでなく実際にエンドツーエンドで動作していることを確認するには、チャットを開いて新しく追加したモデルのどれかを選び、適当なメッセージを送り、[Token Station のダッシュボード](https://models.bytefuture.ai/dashboard)を確認する。実際の返信があり、Recent Activity に対応する行が現れていれば、キー、ベース URL、モデル名のすべてが正しいということだ。

| モデル | 向いている用途 |
|---|---|
| `anthropic/claude-sonnet-5` | メインのコーディングモデル。プランニング、実装、Agent モードでのファイル編集に。 |
| `anthropic/claude-haiku-4-5` | 軽い一往復の質問のためにメインのチャットを直接切り替える、より安価なモデル。なぜこれがまだサブエージェント用の低コスト階層になっていないかは、ステップ 3 を参照。 |

## ステップ 3：範囲を絞ったサブエージェントを定義する

Cursor はサブエージェントに対応している。YAML フロントマター付きの markdown ファイルで、プロジェクトごとに `.cursor/agents/` に置くか、グローバルに `~/.cursor/agents/` に置くことができる。コーディングセッションで有用な二つの役割がある。読み取り専用の調査役と、変更後に検証だけを行うテスト実行役だ。

**`.cursor/agents/bill-the-explorer.md`**
```markdown
---
name: bill-the-explorer
description: Searches and reads the codebase to answer questions about existing code. Use proactively before implementing anything unfamiliar.
model: anthropic/claude-haiku-4-5
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
model: anthropic/claude-haiku-4-5
---

You run the project's test command, capture output, and report which
tests passed or failed and why. Do not modify source files.
```

**サブエージェントの名前は、Cursor 自身の組み込みエージェントと衝突しないものにすること。** 最初は `explore` という名前を使ったが、Cursor は何のエラーも出さないまま、こちらが定義したものではなく同名の組み込みエージェントに静かにルーティングしていた。何を指定しても反映されない理由が分からないままだった。`bill-the-explorer` と `jill-the-test-runner` ならこの衝突を避けられる。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>bill-the-explorer と jill-the-test-runner の二つのサブエージェントを作成する。</figcaption>
</figure>

`bill-the-explorer` の `readonly: true` はファイル編集と状態を変更するシェルコマンドをブロックする。純粋な調査役にはこれが合っている。`jill-the-test-runner` はテストコマンドを実際に実行する必要があるため、この制限は付けず、代わりに指示の中でソースファイルに触れないよう指定している。

**あの `model:` の行について。** これは有効な、文書化された Cursor の構文であり、メインの会話とはコストの階層を分けられることを期待して、両方のサブエージェントを `anthropic/claude-haiku-4-5` に設定した。しかし、そうはならなかった。セッションを担当していたエージェントに直接理由を尋ねたところ、的確な答えが返ってきた。サブエージェントを実行するために呼び出す Task ツールは、固定された許可リストにある `model` パラメータしか受け付けず、現状では `inherit` か Cursor 自身の `composer-2.5-fast` のどちらかだけで、カスタムエージェントファイルの `model:` フロントマターはまったく読み込まないという。渡せる有効なカスタム値がないため、`inherit` にデフォルトされ、結果としてすべてのサブエージェントは親の会話が使っているモデル、この構成では Sonnet 5 で動作し、Haiku では動作しない。`name`、`description`、`readonly` はきちんと反映されて機能しているが、`model` は今のところ機能しない。それも Haiku だけの話ではなく、どのカスタムモデルでも同様だ。これは Cursor 自身のコミュニティフォーラムに寄せられた複数の独立した報告とも一致しており、この設定固有の問題ではなく、既知の現行の制限だと分かる。

そのため、サブエージェントは役割と権限によって委任作業を切り分けるという点では確かに有用だ。読み取り専用の調査役と、報告だけを行うテスト実行役を、自動委任(メインエージェントが各 `description` を読んで委任のタイミングを自分で判断する)でも、`/bill-the-explorer` や `/jill-the-test-runner` による明示的な呼び出しでも使える。ただ、その委任先の作業に対して今のところ安いモデルを使えるわけではない。

これらのファイルを、自分でターミナルから書く代わりにチャットでエージェントに書かせた場合、サイドバーに依然としてサブエージェントが表示されないなら、ウィンドウをリロードする（**Ctrl+Shift+P → "Reload Window"**）。Cursor は常にライブで `.cursor/agents/` を再スキャンするわけではない。

## ステップ 4：実際の機能を実装するところを見る

プロバイダー、モデル、サブエージェントがそろえば、Sonnet 5 は調査、実装、検証まで含む実際のコーディングセッションを最初から最後まで実行できる。途中の読み取り専用ステップと検証ステップはそれぞれのサブエージェントに委任しながらだ。

対象には [httpie](https://github.com/httpie/httpie) を使った。実在する、規模もほどよく、テストも整った OSS プロジェクトだ。httpie の `--meta`/`-m` フラグはリクエストの経過時間を表示するが、リダイレクトをたどった後に実際に到達した URL はまだ表示しない。これは小さく、範囲が明確で、実際に役立つ機能であり、手を付ける前に既存のコードをひと目見る必要があるタイプのタスクだ。

委任を確実にトリガーする方法は、明示的な呼び出しだと分かった。地の文で「explore サブエージェントを使って」と頼んでも、実際には委任されない。メインエージェントは自分のコンテキストの中で作業しながら、そうしたかのように語るだけだった。サブエージェント名の先頭にスラッシュを付け、独立したメッセージとして送ることで、うまくいった。

**メッセージ 1**、調査を委任する。
```
/bill-the-explorer find how elapsed time is computed and displayed in HTTPie's --meta output, and identify where to add the effective URL, the URL actually reached after following any redirects, alongside it.
```

**メッセージ 2**、調査結果が戻ってきたら、メインエージェントに戻る。
```
Using what bill-the-explorer found, add the effective URL next to the existing elapsed time in HTTPie's --meta output. Add a test that confirms it works for both a redirected and a non-redirected request.
```

**メッセージ 3**、検証を委任する。
```
/jill-the-test-runner verify the new effective-URL test passes, along with the rest of the test suite. Report any failures separately from the two known pre-existing Big5 charset-detection failures in tests/test_encoding.py, which are unrelated to this change.
```

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/demo-httpie.mp4" type="video/mp4">
  </video>
  <figcaption>Sonnet 5 が調査を bill-the-explorer に委任し、自分で変更を実装し、検証を jill-the-test-runner に委任する。すべて Token Station 経由。</figcaption>
</figure>

サブエージェントのモデルルーティングがまだ反映されないため、[Token Station のダッシュボード](https://models.bytefuture.ai/dashboard)上ではセッション全体が `anthropic/claude-sonnet-5` として課金される。調査や検証も例外ではなく、当初見せようとしていたコスト階層の分離にはなっていない。この動画が実際に示しているのは、`bill-the-explorer` が厳密に読み取り専用で動作し、コードを変更する前に結果を報告すること、そして `jill-the-test-runner` がその後に動作して検証すること。役割が明確に分かれた作業が順番どおりに行われているが、価格の面ではまだそうなっていない、ということだ。

## 今できること

Chat モードと Agent モードのどちらでも、Sonnet 5 と Haiku は Token Station 経由で Cursor の中で使える。実際の返信、実際のファイル編集があり、正しく Token Station のキーに課金され、ダッシュボードにも表示される。

サブエージェントは役割分担と権限管理の面では機能する。`name`、`description`、`readonly` はいずれもきちんと反映され、自動委任も明示的な呼び出し(`/name`)も実際の委任をトリガーする。一方、サブエージェント側でのモデルルーティングは、カスタムモデルに対しては今のところ機能しない。Cursor の Task ツールは `inherit` か自身の `composer-2.5-fast` しか受け付けないため、フロントマターの `model:` に何を指定していても、すべてのサブエージェントはメインの会話が使っているモデルで動作する。これは Cursor プラットフォーム自体の制限であり、エージェント自身によって直接確認され、他の場所での独立した報告とも一致している。Token Station や Haiku に固有の問題ではない。

OpenAI の GPT-6 Astra と GPT-5.6 ファミリー(Sol、Terra、Luna)も今では確認済みで、実際の Agent モードのファイル編集を含めて動作する。Token Station の API キーに取り付けたアダプターがそれを可能にしている。具体的な手順は[GPT-6 Astra と GPT-5.6 のセットアップ](/blog/route-cursor-through-token-station-openai-ja.html)を参照してほしい。

Token Station の xAI ルート `xai/grok-4.6` も、同じカスタムプロバイダーの設定で Cursor から使える。メインのコーディング役に Grok を試したい場合はこちらだ。その設定については姉妹編の記事、[Cursor で Grok 4.6 を動かす](/blog/route-cursor-through-token-station-grok-4-6-ja.html)を参照してほしい。

## はじめよう

[models.bytefuture.ai](https://models.bytefuture.ai/signup) で登録する。1 ドル分の無料クレジット、クレジットカード不要。初回チャージで最大 50 ドルのボーナスも付く。キーをエクスポートし、Cursor の Models 設定に接続し、二つのルートを追加しよう。

[Token Station を試す](https://models.bytefuture.ai/intro.html)
