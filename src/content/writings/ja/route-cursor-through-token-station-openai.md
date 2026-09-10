---
slug: "route-cursor-through-token-station-openai"
lang: "ja"
title: "Cursor を Token Station に接続する：GPT-6 Astra と GPT-5.6"
summary: "Cursor は Settings の Models パネルからカスタム OpenAI 互換プロバイダーに対応している。Token Station を指定すれば OpenAI の GPT-6 Astra と GPT-5.6 ファミリーが選択可能なモデルとして現れ、今では四つのルートすべてで Agent モードのファイル編集が確認できる。Token Station の API キーに取り付けたアダプターが、これまで OpenAI モデルが Cursor でファイルを編集できなかったツール呼び出し形式のギャップを解消する。"
category: "tutorial"
date: "2026-09-08"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-openai-cover.png"
draft: false
---

Cursor は Settings → Models からカスタム OpenAI 互換プロバイダーに対応している。Token Station のエンドポイントを指定すれば、OpenAI の GPT-6 Astra と GPT-5.6 ファミリー（Sol、Terra、Luna）を選択可能なモデルとして追加でき、すべて自分の Token Station キーで課金される。

これは最近まで実際にはできなかった。以前のテスト(私たちの[Claude Sonnet 5 と Haiku のセットアップ](/blog/route-cursor-through-token-station-ja.html)と同時期に行ったもの)で分かったのは、Token Station の GPT-5.6 ルートは Cursor の Agent モードでコードを読み議論することはできたが、実際のファイル編集を適用することには一貫して失敗していたということだ。これは Token Station 側のツール呼び出しレスポンス形式のギャップだった。具体的なギャップはこうだ。OpenAI のモデルはファイル編集を `ApplyPatch` というツール呼び出しとして表現するが、これは Cursor の Agent モードがそれまで正しく読み取れていたものとは異なるレスポンス形状だ。Token Station のキーには今、小さなアダプターを取り付けられるようになった。これがそのレスポンスを Cursor が期待する形に書き換える。これは Cursor が OpenAI と OpenAI-Codex のモデルと話す場面に限定されており、同じキーを経由する他のツールや他のプロバイダーには影響しない。ここでは、そのアダプターを接続することも含めて、設定を最初から最後まで説明し、実際に動作することを確認する。

設定に入る前に、Cursor に直接課金するのではなく、なぜわざわざ Token Station 経由で Cursor をルーティングするのかをはっきりさせておく価値がある。具体的な理由は三つある。Cursor の Pro プランは一部のモデル（Grok 4.6、Grok 4.5、Composer 2.5）を共通の月次利用枠にまとめており、それ以外のモデルは別の枠からそれぞれのモデル自身の API 価格で課金される。しかし、どちらの枠も実際に何にいくら使ったのかをモデルごと、リクエストごとに内訳として見せてはくれない。Token Station のキーはその両方を回避する。BYOK のリクエストは Token Station のエンドポイントに直接送られ、Cursor 自身の課金には一切触れず、プロバイダーの実際のレートでマークアップなしに、自分のダッシュボードにそのまま表示される。第二に、Cursor が使っている複数のコーディングツールの一つに過ぎない場合（たとえば Claude Code や Codex、OpenClaw も併用しているような場合）、同じ Token Station キーと同じモデル ID がそれらすべてで使える。ツールごとに別々のキーを用意し、別々にチャージし、別々に請求を突き合わせる代わりに、追跡すべきアカウントも残高も一つで済む。第三に、Token Station のカタログは 300 モデル、30 以上のプロバイダーを超えており、Cursor が自社の枠に詰め込んでいる範囲をはるかに超えている。

## 始める前に必要なもの

- Cursor がインストール済みであること（[cursor.com/download](https://cursor.com/download)）。
- Token Station のアカウントと API キー。[models.bytefuture.ai](https://models.bytefuture.ai) から無料登録できる。登録時に 1 ドル分のクレジットが付与され、クレジットカードは不要。
- Cursor Pro。Agent モードでのカスタムモデル選択は、自分の API キーを設定していても無料プランではロックされているため、Chat モード以外の用途にはすべて Pro（月額 20 ドル）が必要になる。

## ステップ 1：OpenAI アダプターを接続した Token Station API キーを作成する

Token Station のダッシュボードで **API Keys** を開き、**Create new key** をクリックする。名前を付けて（`Cursor` で構わない）、**Create key** をクリックする。すぐにコピーしておくこと。一度しか表示されず、二度目は表示されない。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-create-api-key.mp4" type="video/mp4">
  </video>
  <figcaption>Token Station API キーを作成し、それに Cursor ↔ OpenAI adapter を接続する。</figcaption>
</figure>

**API Keys** に戻り、先ほど作成したキーを見つけて **Edit** をクリックする。**WASM middleware** の項目は最初「No WASM middleware assigned.」と表示されている。**Select WASM module** のドロップダウンを開き、**Cursor ↔ OpenAI adapter** を選ぶ。これは OpenAI のツール呼び出しレスポンスを、Cursor の Agent モードが期待する形に変換し直すエントリだ。**Save changes** をクリックする。確認バナー（「WASM middleware installed and validated」）が表示され、**Active keys** テーブルのそのキーの行には、今度は **WASM** 列にこのアダプターが表示される。

<figure>
  <img src="/blog/route-cursor-through-token-station/openai-adapter-confirmed.png" alt="Token Station の API Keys ページ。WASM middleware installed and validated という確認バナーと、Cursor キーの行の WASM 列に表示されたアダプター" />
  <figcaption>アダプターを接続した後の Token Station の API Keys ページ。確認バナーと、WASM 列に表示されたキーの行。</figcaption>
</figure>

実際に新しいのはこのステップだ。これを接続しなければ、この記事の他の部分はすべて以前と同じように動作するが、OpenAI モデルに対する Agent モードのファイル編集は、以前のテストで分かったのと同じように失敗し続ける。Agent モードはコードを読み議論することはできても、実際にファイルを変更することは決してない。

## ステップ 2：Token Station をカスタムプロバイダーとして登録する

**Settings → Cursor Settings → Models** を開き、**API Keys** までスクロールして、二つのフィールドを設定する。

- **OpenAI API Key**：先ほどアダプターを接続した Token Station のキーを入力する。
- **Override OpenAI Base URL**：トグルをオンにし、デフォルト値（`https://api.openai.com/v1`）を `https://models.bytefuture.ai/v1` に置き換える。

OpenAI API Key のトグルをオンにすると、先に確認を求められる。「Are you sure you want to enable your own OpenAI API key? Several of Cursor's features require custom models (Tab, Apply from Chat, Agent), which cannot be billed to an API key.」確認して進めればよい。想定どおりの動作だ。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>Cursor の Models 設定で、Token Station をカスタム OpenAI 互換プロバイダーとして登録する。</figcaption>
</figure>

キーとURLが正しいことの確認を「Verify」ボタンに頼らないこと。常に表示されるわけではなく、表示されていてもすべての経路をカバーしているわけではない。信頼できる確認方法は、モデルを追加して実際にメッセージを送ってみることで、これは次に説明する。

## ステップ 3：OpenAI ファミリーをカスタムモデルとして追加する

引き続き Models の設定で、モデルリストの下部にあるカスタムモデル入力欄までスクロールし、それぞれのフルルートを入力して **Add** をクリックする。

```
openai/gpt-6-astra
openai/gpt-5.6-sol
openai/gpt-5.6-terra
openai/gpt-5.6-luna
```

**Claude や Grok のセットアップと同じ命名の落とし穴で、ここでは特にひっかかりやすい**：これらは Cursor 自身の「OpenAI API Key」フィールドの下に登録するのだから、プレフィックスなしのモデル名を入力できると思うかもしれない。できない。Cursor はここで登録した名前をそのままリクエストの `model` フィールドとして送信し、Token Station の実際のルート名にはすべてプロバイダーのプレフィックスが付いている。プレフィックスなしの `gpt-6-astra` として登録すると、リクエストは `Model 'gpt-6-astra' not found` というエラーで失敗する。`openai/gpt-6-astra` として登録すれば動作する。

| モデル | コスト（入力/出力、100万トークンあたり） | 向いている用途 |
|---|---|---|
| `openai/gpt-6-astra` | $10 / $50 | 最も難しく、最も長いエージェント的セッション向け。マルチファイルのリファクタリングや長時間の Agent モード実行では、トークン単価より修正の往復回数を減らすことのほうが重要になる。 |
| `openai/gpt-5.6-sol` | $5 / $30 | ほとんどのコーディングエージェントのステップに使える、Astra の半額のフラッグシップ既定モデル。 |
| `openai/gpt-5.6-terra` | $2.50 / $15 | 繰り返しの実装とデバッグのループ向け。 |
| `openai/gpt-5.6-luna` | $1 / $6 | メインのチャットを直接切り替えて、より軽い単発の質問、調査、トリアージに使う。 |

## ステップ 4：Agent モードのファイル編集が実際に適用されることを確認する

これがこれまでうまく動かなかったステップだ。四つのルートすべてを追加したうえで `openai/gpt-5.6-luna` を選び、実際のリポジトリ（[httpie](https://github.com/httpie/httpie)）に対して本当の編集をさせてみる。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-add-models-and-edit.mp4" type="video/mp4">
  </video>
  <figcaption>四つの OpenAI ルートすべてをカスタムモデルとして追加し、その後 openai/gpt-5.6-luna が Cursor の Agent モードで実際にファイルを編集する。</figcaption>
</figure>

プロンプトはこうだ。「please update the edit at the top of the readme to say 'model: gpt-5.6-luna'.」Cursor は `README.md` を読み、変更を適用し、「Worked for 8s. Edited README.md, explored 1 file, +1 -1,」と報告した。差分では、残っていたテスト用のマーカーが `<!-- model: gpt-5.6-luna -->` に置き換えられている。実際にファイルへ反映された編集であり、チャット上の説明ではない。

Token Station のダッシュボードも、課金の側から同じことを確認している。

<figure>
  <img src="/blog/route-cursor-through-token-station/openai-dashboard-activity.jpg" alt="Token Station ダッシュボードの Recent Activity に、それぞれ数千トークンで1セントにも満たない openai/gpt-5.6-luna のリクエストが繰り返し表示されている" />
  <figcaption>Token Station の Recent Activity。テスト中の openai/gpt-5.6-luna のリクエストが正しく課金されている様子。</figcaption>
</figure>

四つのルート、`openai/gpt-6-astra`、`openai/gpt-5.6-sol`、`openai/gpt-5.6-terra`、`openai/gpt-5.6-luna` はすべて、この方法でエンドツーエンドに動作することが確認できた。実際のファイル編集、正しい課金、すべてステップ 1 で接続した同じアダプターを経由している。

## ステップ 5：範囲を絞ったサブエージェントを定義する

Cursor はサブエージェントに対応している。YAML フロントマター付きの markdown ファイルで、プロジェクトごとに `.cursor/agents/` に置くか、グローバルに `~/.cursor/agents/` に置くことができる。コーディングセッションで有用な二つの役割がある。読み取り専用の調査役と、変更後に検証だけを行うテスト実行役だ。

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

ここでは特定のモデルを指定するのではなく `model: inherit` を使っている。私たちの Claude の記事で記録したとおり、Cursor の Task ツールは現状、サブエージェントの `model` に何を指定していても `inherit` か Cursor 自身の `composer-2.5-fast` しか受け付けない。これは Cursor プラットフォーム自体の制限であり、OpenAI のモデルに特有の問題ではないため、ここでのすべてのサブエージェントは親の会話が使っているモデルで動作する。それ以外のサブエージェントの要素はすべてそのまま機能する。`name`、`description`、`readonly` はドキュメントのとおりに動作し、自動呼び出し（メインエージェントが各 `description` を読んで委任のタイミングを判断する）と明示的な呼び出し（`/bill-the-explorer`）のどちらも実際の委任を発生させる。

**サブエージェントの名前は、Cursor 自身の組み込みエージェントと衝突しないものにすること。** `explore` は実在する組み込みの名前で、こちらの定義ではなくその組み込みエージェントへ静かにルーティングされてしまい、何のエラーも出ない。`bill-the-explorer` と `jill-the-test-runner` ならこの問題を避けられる。

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>bill-the-explorer と jill-the-test-runner の二つのサブエージェントを作成する。</figcaption>
</figure>

これらのファイルを、自分でターミナルから書く代わりにチャットでエージェントに書かせた場合、サイドバーに依然としてサブエージェントが表示されないなら、ウィンドウをリロードする（**Ctrl+Shift+P → "Reload Window"**）。Cursor は常にライブで `.cursor/agents/` を再スキャンするわけではない。

## 自分で試してみる：同じ httpie タスク

私たちの Claude Sonnet 5 のセットアップでは、httpie の実際の機能に対して完全なコーディングセッションを実行した。リダイレクトをたどった後に実際に到達した URL（effective URL）を、既存の経過時間の隣に httpie の `--meta` 出力へ追加するというもので、調査と検証は上の二つのサブエージェントに委任した。

GPT-6 Astra や GPT-5.6 ファミリーを対象に、この具体的なマルチステップ・マルチエージェントのセッションはまだ実行していないので、このセクションは「自分で試してみる」であって、何が起きたかの報告ではない。ステップ 4 で確認済みなのは、四つのルートすべてが Token Station 経由で実際に Agent モードのファイル編集を適用できるということであり、タスク全体が失敗すると考える根本的な理由はもうない。同じ三つのメッセージの並びを試す価値がある。

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

## 今できること

四つの OpenAI ルート、`openai/gpt-6-astra`、`openai/gpt-5.6-sol`、`openai/gpt-5.6-terra`、`openai/gpt-5.6-luna` すべてで、Token Station 経由の Cursor における Agent モードのファイル編集が確認できた。実際にファイルへ反映された編集があり、Token Station のキーに正しく課金され、ダッシュボードにも表示される。これは新しい点だ。同じルートは以前、Agent モードでコードを議論することはできたが編集できなかった。その修正が、ステップ 1 で Token Station のキーに接続したアダプターだ。

サブエージェントはスコープと権限の面では機能する。`name`、`description`、`readonly` はすべて反映され、自動呼び出しと明示的な呼び出し（`/name`）のどちらも実際の委任を発生させる。サブエージェント単位のモデルルーティングは、プロバイダーを問わずカスタムモデルに対して現状機能しない。Cursor の Task ツールは `inherit` か自身の `composer-2.5-fast` しか受け付けないため、すべてのサブエージェントは親の会話のモデルで動作する。これは私たちの Claude と Grok のセットアップで記録した Cursor プラットフォーム自体の同じ制限であり、OpenAI のモデルに特有の問題ではない。

## はじめよう

[models.bytefuture.ai](https://models.bytefuture.ai/signup) で登録する。1 ドル分の無料クレジット、クレジットカード不要。初回チャージで最大 50 ドルのボーナスも付く。キーをエクスポートし、OpenAI アダプターを接続し、Cursor の Models 設定に接続して、上のルートを追加しよう。

[Token Station を試す](https://models.bytefuture.ai/intro.html)
