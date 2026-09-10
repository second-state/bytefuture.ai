---
slug: "route-cursor-through-token-station"
lang: "ko"
title: "Cursor를 Token Station에 연결하기: Claude Sonnet 5와 Haiku"
summary: "Cursor는 Settings의 Models 패널에서 커스텀 OpenAI 호환 프로바이더를 지원한다. Token Station을 지정하면 Claude Sonnet 5와 Haiku가 선택 가능한 모델로 나타나며, Agent 모드까지 완전히 지원한다. 채팅뿐 아니라 실제 파일 편집이 가능하고, 조사와 검증을 맡기는 전용 서브에이전트도 쓸 수 있다."
category: "tutorial"
date: "2026-08-26"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-cover.png"
draft: false
---

Cursor는 Settings → Models에서 커스텀 OpenAI 호환 프로바이더를 지원한다. Token Station의 엔드포인트를 지정하면 Claude Sonnet 5와 Haiku를 선택 가능한 모델로 추가할 수 있고, 모두 자신의 Token Station 키로 과금된다. Token Station에 있는 다른 몇몇 모델 계열과 달리, 이 둘은 Cursor의 Agent 모드를 완전히 지원한다. 채팅뿐 아니라 실제 파일 편집이 가능하다는 뜻이다. 여기서는 설정 과정을 처음부터 끝까지 다룬다. 직접 해보면서 만난 이름 관련 함정도 포함해서다. 마지막에는 실제 코딩 세션까지 보여준다. Sonnet 5가 오픈소스 프로젝트에서 실제 기능을 구현하고, 조사와 검증을 두 개의 전용 서브에이전트에 위임하는 과정이다.

설정에 들어가기 전에, Cursor에 직접 돈을 내는 대신 왜 굳이 Token Station을 거쳐 Cursor를 라우팅하는지 분명히 짚어볼 필요가 있다. 구체적인 이유는 세 가지다. Cursor의 Pro 플랜은 일부 모델(Grok 4.6, Grok 4.5, Composer 2.5)을 공유 월간 사용량 풀에 묶어 두고, 나머지 모델은 각 모델 자체의 API 가격으로 별도의 풀에서 과금한다. 하지만 어느 풀도 실제로 무엇에 얼마를 썼는지 모델별, 요청별로 나눠 보여주지는 않는다. Token Station 키는 이 두 풀을 모두 건너뛴다. BYOK 요청은 Token Station의 엔드포인트로 곧장 전달되어 Cursor 자체의 과금을 전혀 거치지 않고, 프로바이더의 실제 요율로 마진 없이 자신의 대시보드에 그대로 나타난다. 둘째, Cursor가 여러 코딩 도구 중 하나일 뿐이라면(예를 들어 Claude Code나 Codex, OpenClaw도 함께 쓴다면), 같은 Token Station 키와 같은 모델 ID가 그 모든 도구에서 똑같이 작동한다. 도구마다 별도의 키를 발급받고, 따로 충전하고, 따로 정산을 맞추는 대신 추적해야 할 계정과 잔액이 하나로 줄어든다. 셋째, Token Station의 카탈로그는 300개 이상의 모델, 30개가 넘는 프로바이더를 아우르며, Cursor가 자체 풀에 담아 놓은 범위를 훨씬 뛰어넘는다.

## 시작하기 전에 필요한 것

- Cursor 설치([cursor.com/download](https://cursor.com/download)).
- Token Station 계정과 API 키. [models.bytefuture.ai](https://models.bytefuture.ai)에서 무료로 가입할 수 있다. 가입 시 1달러 크레딧이 지급되며 카드는 필요 없다.
- Cursor Pro. Agent 모드에서의 커스텀 모델 선택은 자신의 API 키가 있어도 무료 플랜에서는 막혀 있어서, Chat 모드를 넘어서는 모든 용도에 Pro(월 20달러)가 필요하다.

## 1단계: Token Station을 커스텀 프로바이더로 등록하기

**Settings → Cursor Settings → Models**를 열고 **API Keys**까지 스크롤한 다음, 두 필드를 설정한다.

- **OpenAI API Key**: Token Station 키를 입력한다.
- **Override OpenAI Base URL**: 토글을 켜고, 기본값을 `https://models.bytefuture.ai/v1`로 바꾼다.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>Cursor의 Models 설정에서 Token Station을 커스텀 OpenAI 호환 프로바이더로 등록하는 과정.</figcaption>
</figure>

키와 URL이 올바른지 확인할 때 "Verify" 버튼에 의존하지 말자. 항상 나타나는 것도 아니고, 나타나더라도 모든 경로를 커버하지는 않는다. 믿을 만한 확인 방법은 2단계다: 모델을 추가하고 실제로 메시지를 보내보는 것.

## 2단계: Claude Sonnet 5와 Haiku를 커스텀 모델로 추가하기

여전히 Models 설정에서, **+ Add Custom Model**을 두 번 클릭해 다음을 추가한다.

```
anthropic/claude-sonnet-5
anthropic/claude-haiku-4-5
```

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/add-models.mp4" type="video/mp4">
  </video>
  <figcaption>anthropic/claude-sonnet-5와 anthropic/claude-haiku-4-5를 커스텀 모델로 추가하는 과정.</figcaption>
</figure>

**여기가 함정이다**: 여기서 등록한 이름을 Cursor는 그대로 요청의 `model` 필드로 보낸다. Token Station의 실제 라우트 이름에는 `anthropic/` 접두사가 붙어 있다. 접두사 없이 `claude-sonnet-5`로 등록하면 모든 요청이 `Model 'claude-sonnet-5' not found` 오류로 실패하는데, 접두사가 없는 그 모델은 실제로 존재하지 않기 때문이다. 접두사를 붙여 등록하면 바로 작동한다.

Cursor에 받아들여진 것뿐 아니라 실제로 엔드투엔드로 작동하는지 확인하려면, 채팅을 열어 새로 추가한 모델 중 하나를 선택하고 아무 메시지나 보낸 다음 [Token Station 대시보드](https://models.bytefuture.ai/dashboard)를 확인한다. 실제 응답과 함께 Recent Activity에 해당하는 항목이 나타난다면, 키와 base URL, 모델 이름이 모두 올바르다는 뜻이다.

| 모델 | 적합한 용도 |
|---|---|
| `anthropic/claude-sonnet-5` | 메인 코딩 모델. 플래닝, 구현, Agent 모드에서의 파일 편집에. |
| `anthropic/claude-haiku-4-5` | 가벼운 단발성 질문을 위해 메인 채팅을 직접 전환할 수 있는 더 저렴한 모델. 아직 서브에이전트용 저비용 등급이 되지 못하는 이유는 3단계 참고. |

## 3단계: 범위가 명확한 서브에이전트 정의하기

Cursor는 서브에이전트를 지원한다. YAML 프론트매터가 있는 마크다운 파일로, 프로젝트별로 `.cursor/agents/`에 두거나 전역으로 `~/.cursor/agents/`에 둘 수 있다. 코딩 세션에 유용한 두 가지 역할이 있다. 읽기 전용 조사 역할과, 변경 후 검증만 담당하는 테스트 실행 역할이다.

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

**서브에이전트 이름은 Cursor 자체의 내장 에이전트와 겹치지 않는 것으로 짓자.** 처음에는 `explore`라는 이름을 썼는데, Cursor가 아무 오류 메시지도 없이 우리가 정의한 것 대신 같은 이름의 내장 에이전트로 조용히 라우팅하고 있었다. 지정한 내용이 왜 전혀 반영되지 않는지 알 수 없는 상태였다. `bill-the-explorer`와 `jill-the-test-runner`는 이 충돌을 피한다.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>bill-the-explorer와 jill-the-test-runner 두 서브에이전트를 만드는 과정.</figcaption>
</figure>

`bill-the-explorer`의 `readonly: true`는 파일 편집과 상태를 변경하는 셸 명령을 막는데, 순수 조사 역할에 딱 맞는다. `jill-the-test-runner`는 테스트 명령을 실제로 실행해야 하므로 이 제한을 두지 않았고, 대신 지시문에서 소스 파일을 건드리지 말라고 명시했다.

**저 `model:` 줄에 대해.** 이는 유효하고 문서화된 Cursor 문법이며, 메인 대화와 비용 등급이 나뉘길 기대하며 두 서브에이전트 모두 `anthropic/claude-haiku-4-5`로 설정했다. 하지만 그렇게 되지 않았다. 세션을 담당하던 에이전트에게 직접 이유를 물었더니 정확한 답이 돌아왔다. 서브에이전트를 실행하기 위해 호출하는 Task 도구는 고정된 허용 목록에 있는 `model` 파라미터만 받아들이는데, 현재는 `inherit` 아니면 Cursor 자체의 `composer-2.5-fast`뿐이고, 커스텀 에이전트 파일의 `model:` 프론트매터는 아예 읽지 않는다는 것이다. 전달할 수 있는 유효한 커스텀 값이 없으니 `inherit`로 기본 설정되고, 결과적으로 모든 서브에이전트는 부모 대화가 사용 중인 모델, 이 구성에서는 Sonnet 5로 동작하며 Haiku로는 동작하지 않는다. `name`, `description`, `readonly`는 제대로 반영되어 작동하지만, `model`은 현재 작동하지 않는다. 그것도 Haiku만이 아니라 어떤 커스텀 모델이든 마찬가지다. 이는 Cursor 자체 커뮤니티 포럼에 올라온 여러 독립적인 보고와도 일치하므로, 이 설정만의 문제가 아니라 알려진 현재 진행형 제약이라는 뜻이다.

그래도 서브에이전트는 역할과 권한에 따라 위임 작업을 나누는 데는 확실히 유용하다. 읽기 전용 조사 역할과, 보고만 하는 테스트 실행 역할을, 자동 위임(메인 에이전트가 각 `description`을 읽고 언제 위임할지 스스로 판단하는 방식)으로도, `/bill-the-explorer`나 `/jill-the-test-runner`를 통한 명시적 호출로도 쓸 수 있다. 다만 그 위임 작업에 지금 당장 더 저렴한 모델을 쓸 수 있는 건 아니다.

이 파일들을 터미널에서 직접 만드는 대신 채팅에서 에이전트에게 작성해달라고 요청했는데도 사이드바에 여전히 서브에이전트가 표시되지 않는다면, 창을 새로고침한다(**Ctrl+Shift+P → "Reload Window"**). Cursor가 `.cursor/agents/`를 항상 실시간으로 다시 스캔하지는 않는다.

## 4단계: 실제 기능을 구현하는 과정 지켜보기

프로바이더, 모델, 서브에이전트가 모두 준비되면 Sonnet 5는 조사, 구현, 검증까지 포함하는 실제 코딩 세션을 처음부터 끝까지 실행할 수 있다. 그 사이 읽기 전용 단계와 검증 단계는 각각의 서브에이전트에 위임하면서다.

대상으로는 [httpie](https://github.com/httpie/httpie)를 사용했다. 실제로 존재하고, 규모도 적당하며, 테스트도 잘 갖춰진 오픈소스 프로젝트다. httpie의 `--meta`/`-m` 플래그는 요청의 경과 시간을 출력하지만, 리다이렉트를 따라간 뒤 실제로 도달한 URL은 아직 보여주지 않는다. 이는 작고 범위가 명확하며 실제로 유용한 기능으로, 손대기 전에 기존 코드를 먼저 살펴봐야 하는 종류의 작업이다.

위임을 확실하게 트리거하는 방법은 명시적 호출이었다. 그냥 문장으로 "explore 서브에이전트를 써서"라고 요청해서는 실제로 위임되지 않았다. 메인 에이전트는 자기 컨텍스트 안에서 작업하면서 그렇게 한 것처럼 말만 할 뿐이었다. 서브에이전트 이름 앞에 슬래시를 붙여 하나의 독립된 메시지로 보내는 방식이 효과가 있었다.

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

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/demo-httpie.mp4" type="video/mp4">
  </video>
  <figcaption>Sonnet 5가 조사를 bill-the-explorer에 위임하고, 직접 변경 사항을 구현한 다음, 검증을 jill-the-test-runner에 위임한다. 전 과정이 Token Station을 통해 이루어진다.</figcaption>
</figure>

서브에이전트의 모델 라우팅이 아직 반영되지 않기 때문에, [Token Station 대시보드](https://models.bytefuture.ai/dashboard)에서는 조사와 검증을 포함한 세션 전체가 `anthropic/claude-sonnet-5`로 과금된다. 원래 보여주려던 비용 등급 분리는 아니다. 이 영상이 실제로 보여주는 것은 이렇다. `bill-the-explorer`는 철저히 읽기 전용으로 동작하며 코드를 바꾸기 전에 결과를 보고하고, `jill-the-test-runner`는 그 이후에 동작해 검증한다. 역할이 뚜렷이 나뉜 작업이 순서대로 이루어지고 있지만, 아직 가격까지 나뉘지는 않았다는 뜻이다.

## 지금 되는 것

Chat 모드와 Agent 모드 모두에서 Sonnet 5와 Haiku는 Token Station을 통해 Cursor 안에서 사용할 수 있다. 실제 응답, 실제 파일 편집이 이루어지고, Token Station 키에 정확히 과금되며, 대시보드에서도 확인된다.

서브에이전트는 역할 구분과 권한 관리 면에서는 작동한다. `name`, `description`, `readonly`는 모두 제대로 반영되고, 자동 위임과 명시적 호출(`/name`) 모두 실제 위임을 트리거한다. 다만 서브에이전트 단위의 모델 라우팅은 커스텀 모델에 대해서는 아직 작동하지 않는다. Cursor의 Task 도구는 `inherit`나 자체 `composer-2.5-fast`만 받아들이기 때문에, 프론트매터의 `model:`에 무엇을 지정하든 모든 서브에이전트는 부모 대화가 사용 중인 모델로 동작한다. 이는 Cursor 플랫폼 자체의 제약이며, 에이전트 스스로 직접 확인해준 내용이고 다른 곳의 독립적인 보고와도 일치한다. Token Station이나 Haiku에 국한된 문제가 아니다.

OpenAI의 GPT-6 Astra와 GPT-5.6 계열(Sol, Terra, Luna)도 이제 실제 Agent 모드 파일 편집을 포함해 작동하는 것이 확인됐다. Token Station API 키에 연결한 어댑터가 이를 가능하게 한다. 구체적인 설정은 [GPT-6 Astra와 GPT-5.6 설정 가이드](/blog/route-cursor-through-token-station-openai-ko.html)를 참고하자.

Token Station의 xAI 라우트인 `xai/grok-4.6`도 같은 커스텀 프로바이더 설정으로 Cursor에서 사용할 수 있다. 메인 코딩 역할에 Grok을 써보고 싶다면 이 라우트를 쓰면 된다. 구체적인 설정은 자매편 글인 [Cursor에서 Grok 4.6 실행하기](/blog/route-cursor-through-token-station-grok-4-6-ko.html)를 참고하자.

## 시작하기

[models.bytefuture.ai](https://models.bytefuture.ai/signup)에서 가입하자. 1달러 무료 크레딧, 카드 불필요, 첫 충전 시 최대 50달러 보너스도 받을 수 있다. 키를 export하고 Cursor의 Models 설정에 연결한 다음, 두 가지 라우트를 추가하자.

[Token Station 사용해보기](https://models.bytefuture.ai/intro.html)
