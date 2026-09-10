---
slug: "route-cursor-through-token-station-grok-4-6"
lang: "ja"
title: "Cursor を Token Station に接続する：Grok 4.6"
summary: "Cursor は Settings の Models パネルからカスタム OpenAI 互換プロバイダーに対応している。Token Station を指定すれば xAI の Grok 4.6 が選択可能なモデルとして現れ、自分のキーで課金され、Agent モードでのファイル編集も確認済みだ。Claude Sonnet 5 と Haiku のセットアップの姉妹編として、Grok 特有の違いを扱う。"
category: "tutorial"
date: "2026-08-26"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-grok-4-6-cover.png"
draft: false
---

Cursor は Settings → Models からカスタム OpenAI 互換プロバイダーに対応している。Token Station のエンドポイントを指定すれば、xAI の Grok 4.6 を選択可能なモデルとして追加でき、自分の Token Station キーで課金される。これは [Claude Sonnet 5 と Haiku のセットアップ](/blog/route-cursor-through-token-station-ja.html)の姉妹編だ。プロバイダーの登録とサブエージェントの定義はどのモデルを追加する場合でもまったく同じ手順なので、この記事は短くまとめ、より踏み込んだ調査の詳細（Cursor 自身の組み込みエージェントとの名前衝突、そしてサブエージェントを親の会話とは別のモデルで実際に動かせなくしている Cursor プラットフォームのバグ）についてはそちらを参照してほしい。Grok に固有なのはステップ 2 と、下の Agent モードに関する注記だ。

設定に入る前に、Cursor に直接課金するのではなく、なぜわざわざ Token Station 経由で Cursor をルーティングするのかをはっきりさせておく価値がある。具体的な理由は三つある。Cursor の Pro プランは一部のモデル（Grok 4.6、Grok 4.5、Composer 2.5）を共通の月次利用枠にまとめており、それ以外のモデルは別の枠からそれぞれのモデル自身の API 価格で課金される。しかし、どちらの枠も実際に何にいくら使ったのかをモデルごと、リクエストごとに内訳として見せてはくれない。Token Station のキーはその両方を回避する。BYOK のリクエストは Token Station のエンドポイントに直接送られ、Cursor 自身の課金には一切触れず、プロバイダーの実際のレートでマークアップなしに、自分のダッシュボードにそのまま表示される。第二に、Cursor が使っている複数のコーディングツールの一つに過ぎない場合（たとえば Claude Code や Codex、OpenClaw も併用しているような場合）、同じ Token Station キーと同じモデル ID がそれらすべてで使える。ツールごとに別々のキーを用意し、別々にチャージし、別々に請求を突き合わせる代わりに、追跡すべきアカウントも残高も一つで済む。第三に、Token Station のカタログは 300 モデル、30 以上のプロバイダーを超えており、Cursor が自社の枠に詰め込んでいる範囲をはるかに超えている。

Grok に特有の点を一つ、先に触れておく価値がある。Cursor 自身の Pro プランは、すでに Grok 4.6 を自前の「Cursor Models」枠に組み込んでおり、Cursor 自身の利用枠の価格で課金している。代わりに Grok 4.6 を Token Station 経由でルーティングするということは、Cursor の組み込み枠を消費する代わりに、上で述べたコストの可視性と一元管理のメリットを得ながら、xAI の API レートを直接支払うということだ。

## 始める前に必要なもの

- Cursor がインストール済みであること（[cursor.com/download](https://cursor.com/download)）。
- Token Station のアカウントと API キー。[models.bytefuture.ai](https://models.bytefuture.ai) から無料登録できる。登録時に 1 ドル分のクレジットが付与され、クレジットカードは不要。
- Cursor Pro。Agent モードでのカスタムモデル選択は、自分の API キーを設定していても無料プランではロックされているため、Chat モード以外の用途にはすべて Pro（月額 20 ドル)が必要になる。

## ステップ 1：Token Station をカスタムプロバイダーとして登録する

**Settings → Cursor Settings → Models** を開き、**API Keys** までスクロールして、二つのフィールドを設定する。

- **OpenAI API Key**：Token Station のキーを入力する。
- **Override OpenAI Base URL**：トグルをオンにし、デフォルト値を `https://models.bytefuture.ai/v1` に置き換える。

このステップはこれから追加するモデルに関係なく同じなので、姉妹編の記事と同じ録画をそのまま使う。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>Cursor の Models 設定で、Token Station をカスタム OpenAI 互換プロバイダーとして登録する。</figcaption>
</figure>

キーとURLが正しいことの確認を「Verify」ボタンに頼らないこと。常に表示されるわけではなく、表示されていてもすべての経路をカバーしているわけではない。信頼できる確認方法はステップ 2 だ。モデルを追加して、実際にメッセージを送ってみる。

## ステップ 2：Grok 4.6 をカスタムモデルとして追加する

引き続き Models の設定で、**+ Add Custom Model** をクリックし、次を追加する。

```
xai/grok-4.6
```

**Claude のセットアップと同じ落とし穴**：ここで登録した名前を、Cursor はそのままリクエストの `model` フィールドとして送信する。Token Station の実際のルート名には `xai/` プレフィックスが含まれる。プレフィックスなしの `grok-4.6` として登録すると、リクエストは `Model 'grok-4.6' not found` というエラーで失敗する。プレフィックス付きで登録すればすぐに動作する。

Cursor に受け付けられただけでなく実際にエンドツーエンドで動作していることを確認するには、チャットを開いて Grok 4.6 を選び、適当なメッセージを送り、[Token Station のダッシュボード](https://models.bytefuture.ai/dashboard)を確認する。実際の返信があり、Recent Activity に対応する行が現れていれば、キー、ベース URL、モデル名のすべてが正しいということだ。

<figure>
  <img src="/blog/route-cursor-through-token-station/grok-dashboard-activity.jpg" alt="Token Station のダッシュボードの Recent Activity に xai/grok-4.6 のリクエストが 0.01 ドルで表示されている" />
  <figcaption>Cursor から送った実際のリクエストが Token Station のキーに課金され、Recent Activity に xai/grok-4.6 として表示される。</figcaption>
</figure>

| モデル | 向いている用途 |
|---|---|
| `xai/grok-4.6` | メインのコーディングモデル。プランニング、実装、チャット、そして Agent モードでのファイル編集も確認済み(下記参照)。 |

Grok 4.6 は Token Station 経由で Agent モードのファイル編集にも対応している。チャットだけでなく、実際にファイルへ適用される変更だ。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/grok-agent-mode-edit.mp4" type="video/mp4">
  </video>
  <figcaption>Token Station 経由の Grok 4.6 が、Cursor の Agent モードで直接ファイルを編集する。</figcaption>
</figure>

## ステップ 3：範囲を絞ったサブエージェントを定義する

姉妹編の記事と同じ二つのサブエージェント、読み取り専用の調査役とテスト検証役は、ここでも同じように動作する。`model:` フィールドがなぜサブエージェントを実際に別のモデルへルーティングしないのか、そしてなぜこの二つの名前に落ち着いたのかの詳細は、[Claude Sonnet 5 と Haiku の記事](/blog/route-cursor-through-token-station-ja.html)にある。ここでは短縮版を示す。

**`.cursor/agents/bill-the-explorer.md`**
```markdown
---
name: bill-the-explorer
description: Searches and reads the codebase to answer questions about existing code. Use proactively before implementing anything unfamiliar.
model: inherit
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
model: inherit
---

You run the project's test command, capture output, and report which
tests passed or failed and why. Do not modify source files.
```

ここでは特定のモデルを指定するのではなく、明示的に `model: inherit` を使っている。Cursor の Task ツールは現状、サブエージェントに指定されたカスタムモデルを反映しないため、何を指定してもメインの会話が使っているモデル(この構成では Grok 4.6)で動作するからだ。`inherit` はそのことを率直に示しており、実際には存在しないコスト階層を暗示することもない。

これらのサブエージェントを作成する手順は姉妹編の記事とまったく同じなので、同じ録画をそのまま使う。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>bill-the-explorer と jill-the-test-runner の二つのサブエージェントを作成する。</figcaption>
</figure>

姉妹編の記事から繰り返す価値のある点がもう一つある。サブエージェントの名前は、Cursor 自身の組み込みエージェントと衝突しないものにすること。`explore` は実在する組み込みの名前で、こちらの定義ではなくその組み込みエージェントへ静かにルーティングされてしまい、何のエラーも出ない。`bill-the-explorer` と `jill-the-test-runner` ならこの問題を避けられる。

## 自分で試してみる：同じ httpie タスク

私たちは Claude Sonnet 5 で、この二つのサブエージェントに調査と検証を委任しながら、[httpie](https://github.com/httpie/httpie) の実際の機能に対して完全なセッションを実行した。リダイレクトをたどった後に実際に到達した URL を、既存の経過時間の隣に httpie の `--meta` 出力へ追加するというものだ。そのセッションと録画は姉妹編の記事にある。

Grok 4.6 をメインモデルとして、サブエージェント委任を含むその同じ複数ステップのセッションはまだ実行していないので、このセクションは「自分で試してみる」であって、この具体的なタスクで何が起きたかの報告ではない。上で確認済みなのは、Grok 4.6 が Token Station 経由で実際に Agent モードのファイル編集を適用できるということであり、タスク全体が失敗すると考える根本的な理由はもうない。委任を確実にトリガーする方法は明示的な呼び出しだと分かっている。地の文で「explore サブエージェントを使って」と頼んでも、実際には委任されない。同じ三つのメッセージの並びを、そのまま Grok 4.6 を選んだ状態で試す価値がある。

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

単発の Agent モード編集はすでに確認済みだ。この一連のメッセージが実際に試すのは、実際のサブエージェント委任を伴う調査・実装・検証のワークフロー全体が、Claude Sonnet 5 のときと同じように複数ステップのセッションを通して成立するかどうかだ。

## 今できること

Chat モードと Agent モードのどちらでも、Grok 4.6 は Token Station 経由で Cursor の中で使える。実際の返信、実際のファイル編集があり、正しく Token Station のキーに課金され、ダッシュボードにも表示される。プロバイダーの登録とサブエージェントの定義は Claude のセットアップとまったく同じ手順であり、どちらもどのモデルを追加するかには依存しない。

これにより Grok 4.6 は、Claude Sonnet 5、そして OpenAI の GPT-6 Astra と GPT-5.6 ファミリーと並んで、Token Station 経由で Agent モードの編集を確実に動かせるルートとなった。ツール呼び出しの互換性は結局のところモデルとプロバイダーに強く依存することが分かったため、Grok については Claude からの類推ではなく、それ自体の実測結果に基づいて確認されている。OpenAI のモデルがどうやってそこに到達したかは、Token Station の API キーに取り付けたアダプターによるもので、詳しくは[GPT-6 Astra と GPT-5.6 のセットアップ](/blog/route-cursor-through-token-station-openai-ja.html)を参照してほしい。

まだテストしていない具体的な部分は、Grok 4.6 をメインモデルとした、調査の委任、実装、検証の委任までを含む実際のタスクに対する完全な複数ステップのセッションだ。その土台となる単発編集の能力はすでに確認済みで、エンドツーエンドのワークフローは上の「自分で試してみる」に当たる。

サブエージェント側のモデルルーティングは、どのモデルを使っていても姉妹編の記事で説明したのと同じ制限を持つ。Cursor の Task ツールは `inherit` か自身の `composer-2.5-fast` しか受け付けないため、サブエージェントは常に親の会話が使っているモデルで動作する。これは Cursor プラットフォーム自体の制限であり、Grok、Claude、Token Station に固有の問題ではない。

## はじめよう

[models.bytefuture.ai](https://models.bytefuture.ai/signup) で登録する。1 ドル分の無料クレジット、クレジットカード不要。初回チャージで最大 50 ドルのボーナスも付く。キーをエクスポートし、Cursor の Models 設定に接続し、`xai/grok-4.6` を追加しよう。

[Token Station を試す](https://models.bytefuture.ai/intro.html)
