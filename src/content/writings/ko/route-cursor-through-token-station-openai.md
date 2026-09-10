---
slug: "route-cursor-through-token-station-openai"
lang: "ko"
title: "Cursor를 Token Station에 연결하기: GPT-6 Astra와 GPT-5.6"
summary: "OpenAI가 Cursor 내장 지원을 단계적으로 종료하고 있어서, 앞으로 Cursor에서 OpenAI 모델을 쓰려면 BYOK가 필요하다. Cursor를 Token Station에 연결하면 GPT-6 Astra와 GPT-5.6 계열이 선택 가능한 모델로 나타나고, API 키에 연결한 WASM 어댑터가 Cursor가 BYOK 경로에서 제대로 다루지 못하는 도구 호출 형식을 메워 Agent 모드 파일 편집이 실제로 적용된다."
category: "tutorial"
date: "2026-09-08"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-openai-cover.png"
draft: false
---

<div class="note">

이 튜토리얼의 단계와 설명은 [models.bytefuture.ai](https://models.bytefuture.ai/)의 공개 Token Station을 기준으로 한다. 공동 구독, 할인된 API 키, 스마트 라우팅으로 비용을 아끼기 위해 전용 Token Station 인스턴스를 직접 구축하고 싶다면 [문의해 주세요](/enterprise.html).

</div>

Cursor는 Settings → Models에서 커스텀 OpenAI 호환 프로바이더를 지원한다. Token Station의 엔드포인트를 지정하면 OpenAI의 GPT-6 Astra와 GPT-5.6 계열(Sol, Terra, Luna)을 선택 가능한 모델로 추가할 수 있고, 모두 자신의 Token Station 키로 과금된다.

OpenAI가 Cursor 내장 지원을 단계적으로 종료하고 있어서, 앞으로 Cursor에서 OpenAI 모델을 쓰려면 BYOK를 써야 한다. 먼저 알아둘 점이 하나 있다. Cursor의 내장 통합은 OpenAI의 `/responses` API를 호출하는 반면 BYOK 경로는 `/chat/completions`를 호출하는데, Cursor는 `/chat/completions` 응답에서 도구 호출을 제대로 파싱하지 못한다. 이는 OpenAI나 Token Station이 아니라 Cursor 쪽 버그이며, 1단계에서 연결하는 WASM 어댑터는 OpenAI의 응답을 Cursor가 받아들이는 형식으로 변환해 주는 임시 대응책이다.

## 시작하기 전에 필요한 것

- Cursor 설치([cursor.com/download](https://cursor.com/download)).
- Token Station 계정과 API 키. [models.bytefuture.ai](https://models.bytefuture.ai)에서 무료로 가입할 수 있다. 가입 시 1달러 크레딧이 지급되며 카드는 필요 없다.
- Cursor Pro. Agent 모드에서의 커스텀 모델 선택은 자신의 API 키가 있어도 무료 플랜에서는 막혀 있어서, Chat 모드를 넘어서는 모든 용도에 Pro(월 20달러)가 필요하다.

## 1단계: OpenAI 어댑터를 연결한 Token Station API 키 만들기

Token Station 대시보드에서 **API Keys**를 열고 **Create new key**를 클릭한다. 이름을 붙이고(`Cursor`면 충분하다) **Create key**를 클릭한다. 바로 복사해 두자. 한 번만 표시되고 다시는 표시되지 않는다.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-create-api-key.mp4" type="video/mp4">
  </video>
  <figcaption>Token Station API 키를 만들고, 여기에 Cursor ↔ OpenAI adapter를 연결하는 과정.</figcaption>
</figure>

**API Keys**로 돌아가서 방금 만든 키를 찾아 **Edit**을 클릭한다. **WASM middleware** 항목은 처음에 "No WASM middleware assigned."로 표시된다. **Select WASM module** 드롭다운을 열고 **Cursor ↔ OpenAI adapter**를 선택한다. 이 항목은 OpenAI의 도구 호출 응답을 Cursor의 Agent 모드가 기대하는 형태로 다시 포맷한다. **Save changes**를 클릭한다. 확인 배너("WASM middleware installed and validated")가 나타나고, **Active keys** 테이블에서 그 키의 행에는 이제 **WASM** 열에 이 어댑터가 표시된다.

<figure>
  <img src="/blog/route-cursor-through-token-station/openai-adapter-confirmed.png" alt="Token Station의 API Keys 페이지. WASM middleware installed and validated 확인 배너와, Cursor 키의 행 WASM 열에 표시된 어댑터" />
  <figcaption>어댑터를 연결한 후의 Token Station API Keys 페이지: 확인 배너와, WASM 열에 표시된 키의 행.</figcaption>
</figure>

이 단계는 건너뛰지 말자. 어댑터를 연결하지 않으면 이 글의 나머지는 모두 그대로 작동하지만, Agent 모드는 코드를 읽고 논의하기만 할 뿐 실제로 파일을 바꾸지는 않는다.

## 2단계: Token Station을 커스텀 프로바이더로 등록하기

**Settings → Cursor Settings → Models**를 열고 **API Keys**까지 스크롤한 다음, 두 필드를 설정한다.

- **OpenAI API Key**: 방금 어댑터를 연결한 그 Token Station 키를 입력한다.
- **Override OpenAI Base URL**: 토글을 켜고, 기본값(`https://api.openai.com/v1`)을 `https://models.bytefuture.ai/v1`로 바꾼다.

OpenAI API Key 토글을 켜면 먼저 확인을 요청한다: "Are you sure you want to enable your own OpenAI API key? Several of Cursor's features require custom models (Tab, Apply from Chat, Agent), which cannot be billed to an API key." 확인하고 진행하면 된다. 예상된 동작이다.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>Cursor의 Models 설정에서 Token Station을 커스텀 OpenAI 호환 프로바이더로 등록하는 과정.</figcaption>
</figure>

키와 URL이 올바른지 확인할 때 "Verify" 버튼에 의존하지 말자. 항상 나타나는 것도 아니고, 나타나더라도 모든 경로를 커버하지는 않는다. 믿을 만한 확인 방법은 모델을 추가하고 실제로 메시지를 보내보는 것이며, 이는 다음에 다룬다.

## 3단계: OpenAI 계열을 커스텀 모델로 추가하기

여전히 Models 설정에서, 모델 목록 맨 아래의 커스텀 모델 입력란까지 스크롤해서 아래의 각 전체 라우트를 입력하고 **Add**를 클릭한다.

```
openai/gpt-6-astra
openai/gpt-5.6-sol
openai/gpt-5.6-terra
openai/gpt-5.6-luna
```

**Claude와 Grok 설정과 같은 이름 관련 함정인데, 여기서는 특히 걸리기 쉽다**: 이 모델들이 Cursor 자체의 "OpenAI API Key" 필드 아래 등록되니까 접두사 없는 모델 이름을 입력해도 될 거라고 생각할 수 있다. 안 된다. Cursor는 여기서 등록한 이름을 그대로 요청의 `model` 필드로 보내는데, Token Station의 실제 라우트 이름에는 모두 프로바이더 접두사가 붙어 있다. 접두사 없이 `gpt-6-astra`로 등록하면 요청이 `Model 'gpt-6-astra' not found` 오류로 실패한다. `openai/gpt-6-astra`로 등록하면 바로 작동한다.

| 모델 | 비용(입력/출력, 100만 토큰당) | 적합한 용도 |
|---|---|---|
| `openai/gpt-6-astra` | $10 / $50 | 가장 어렵고 가장 긴 에이전트 세션용. 멀티파일 리팩터링과 긴 Agent 모드 실행처럼, 토큰당 비용보다 수정 라운드를 줄이는 게 더 중요한 경우. |
| `openai/gpt-5.6-sol` | $5 / $30 | Astra의 절반 가격으로 대부분의 코딩 에이전트 단계에 쓰는 플래그십 기본 모델. |
| `openai/gpt-5.6-terra` | $2.50 / $15 | 반복되는 구현과 디버깅 루프. |
| `openai/gpt-5.6-luna` | $1 / $6 | 더 가벼운 단발성 질문, 탐색, 분류를 위해 메인 채팅을 직접 전환할 때. |

## 4단계: Agent 모드 파일 편집이 실제로 적용되는지 확인하기

어댑터를 연결하면 편집이 실제로 적용된다. 네 가지 라우트를 모두 추가한 다음 `openai/gpt-5.6-luna`를 선택하고, 실제 저장소([httpie](https://github.com/httpie/httpie))에 대해 진짜 편집을 하도록 요청한다.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/openai-add-models-and-edit.mp4" type="video/mp4">
  </video>
  <figcaption>네 가지 OpenAI 라우트를 모두 커스텀 모델로 추가한 다음, openai/gpt-5.6-luna가 Cursor의 Agent 모드에서 실제 파일 편집을 적용하는 과정.</figcaption>
</figure>

프롬프트는 이렇다: "please update the edit at the top of the readme to say 'model: gpt-5.6-luna'." Cursor는 `README.md`를 읽고 변경 사항을 적용한 다음 "Worked for 8s. Edited README.md, explored 1 file, +1 -1,"라고 보고했다. diff에서는 남아 있던 테스트용 표시가 `<!-- model: gpt-5.6-luna -->`로 바뀌었다. 실제 파일에 반영된 진짜 편집이고, 채팅 속 설명이 아니다.

Token Station 대시보드도 과금 쪽에서 같은 사실을 확인해준다.

<figure>
  <img src="/blog/route-cursor-through-token-station/openai-dashboard-activity.jpg" alt="Token Station 대시보드의 Recent Activity에 반복적인 openai/gpt-5.6-luna 요청이 표시된 모습, 각각 수천 토큰에 1센트 미만의 비용" />
  <figcaption>Token Station의 Recent Activity, 테스트 중 openai/gpt-5.6-luna 요청이 올바르게 과금된 모습.</figcaption>
</figure>

네 가지 라우트 `openai/gpt-6-astra`, `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna` 모두 이 방식으로 엔드투엔드로 작동하는 것이 확인됐다. 실제 파일 편집, 정확한 과금, 모두 1단계에서 연결한 같은 어댑터를 거친다.

## 5단계: 범위가 명확한 서브에이전트 정의하기

Cursor는 서브에이전트를 지원한다. YAML 프론트매터가 있는 마크다운 파일로, 프로젝트별로 `.cursor/agents/`에 두거나 전역으로 `~/.cursor/agents/`에 둘 수 있다. 코딩 세션에 유용한 두 가지 역할이 있다. 읽기 전용 조사 역할과, 변경 후 검증만 담당하는 테스트 실행 역할이다.

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

여기서는 특정 라우트를 지정하는 대신 `model: inherit`을 쓴다. Claude 글에서 기록했듯이, Cursor의 Task 도구는 커스텀 에이전트 파일에 무엇이 적혀 있든 서브에이전트의 모델로 `inherit`이나 자체 `composer-2.5-fast`만 받아들인다. 이는 Cursor 플랫폼 자체의 제약이며 OpenAI 모델에 국한된 문제가 아니어서, 여기 있는 모든 서브에이전트는 부모 대화가 사용 중인 모델로 동작한다. 그 외 서브에이전트의 나머지 부분은 모두 그대로 반영된다. `name`, `description`, `readonly`는 문서대로 작동하고, 자동 위임(메인 에이전트가 각 `description`을 읽고 언제 넘길지 판단하는 방식)과 명시적 호출(`/bill-the-explorer`) 모두 실제 위임을 일으킨다.

**서브에이전트 이름은 Cursor 자체의 내장 에이전트와 겹치지 않는 것으로 짓자.** `explore`는 실제로 존재하는 내장 이름이라, 직접 정의한 것 대신 그 내장 에이전트로 조용히 라우팅되며 아무 오류도 나지 않는다. `bill-the-explorer`와 `jill-the-test-runner`는 이 문제를 피한다.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>bill-the-explorer와 jill-the-test-runner 두 서브에이전트를 만드는 과정.</figcaption>
</figure>

이 파일들을 터미널에서 직접 만드는 대신 채팅에서 에이전트에게 작성해달라고 요청했는데도 사이드바에 여전히 서브에이전트가 표시되지 않는다면, 창을 새로고침한다(**Ctrl+Shift+P → "Reload Window"**). Cursor가 `.cursor/agents/`를 항상 실시간으로 다시 스캔하지는 않는다.

## 직접 시도해보기: 같은 httpie 작업

우리의 [Claude Sonnet 5 설정](/blog/route-cursor-through-token-station-ko.html)에서는 httpie의 실제 기능에 대해 완전한 코딩 세션을 실행했다. 리다이렉트를 따라간 뒤 실제로 도달한 URL(effective URL)을 기존 경과 시간 옆에 httpie의 `--meta` 출력에 추가하는 작업이었고, 조사와 검증은 위의 두 서브에이전트에 위임했다.

GPT-6 Astra나 GPT-5.6 계열을 대상으로 이 구체적인 다단계, 다중 에이전트 세션은 아직 실행해보지 않았으므로, 이 절은 "직접 시도해보기"이며 실제로 무슨 일이 있었는지에 대한 보고는 아니다. 4단계에서 네 가지 라우트 모두 Token Station을 통해 실제 Agent 모드 파일 편집을 적용할 수 있음이 확인됐으니, 같은 세 메시지 순서를 시도해볼 가치가 있다.

**메시지 1**, 조사를 위임한다.
```
/bill-the-explorer find how elapsed time is computed and displayed in HTTPie's --meta output, and identify where to add the effective URL, the URL actually reached after following any redirects, alongside it.
```

**메시지 2**, 조사 결과가 나오면 메인 에이전트로 돌아간다.
```
Using what bill-the-explorer found, add the effective URL next to the existing elapsed time in HTTPie's --meta output. Add a test that confirms it works for both a redirected and a non-redirected request.
```

**메시지 3**, 검증을 위임한다.
```
/jill-the-test-runner verify the new effective-URL test passes, along with the rest of the test suite. Report any failures separately from the two known pre-existing Big5 charset-detection failures in tests/test_encoding.py, which are unrelated to this change.
```

## 지금 되는 것

네 가지 OpenAI 라우트 `openai/gpt-6-astra`, `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna` 모두에서, Token Station을 통한 Cursor의 Agent 모드 파일 편집이 확인됐다. 실제 파일에 반영된 편집이 있고, Token Station 키에 정확히 과금되며, 대시보드에서도 확인된다. 1단계의 어댑터가 없으면 같은 라우트들은 Agent 모드에서 코드를 읽고 논의하기만 할 뿐 파일을 편집하지 않는다.

서브에이전트는 범위와 권한 지정 면에서는 작동한다. `name`, `description`, `readonly`는 모두 반영되고, 자동 호출과 명시적 호출(`/name`) 모두 실제 위임을 일으킨다. 서브에이전트 단위의 모델 라우팅은 프로바이더와 무관하게 커스텀 모델에 대해 현재 작동하지 않는다. Cursor의 Task 도구는 `inherit`나 자체 `composer-2.5-fast`만 받아들이기 때문에, 모든 서브에이전트는 부모 대화의 모델로 동작한다. 이는 Claude와 Grok 설정에서 기록한 것과 같은 Cursor 플랫폼 자체의 제약이며, OpenAI 모델에 국한된 문제가 아니다.

## 시작하기

[models.bytefuture.ai](https://models.bytefuture.ai/signup)에서 가입하자. 1달러 무료 크레딧, 카드 불필요, 첫 충전 시 최대 50달러 보너스도 받을 수 있다. 키를 export하고, OpenAI 어댑터를 연결하고, Cursor의 Models 설정에 연결한 다음, 위의 라우트들을 추가하자.

[Token Station 사용해보기](https://models.bytefuture.ai/intro.html)
