---
slug: "route-cursor-through-token-station-grok-4-6"
lang: "ko"
title: "Cursor를 Token Station에 연결하기: Grok 4.6"
summary: "Cursor는 Settings의 Models 패널에서 커스텀 OpenAI 호환 프로바이더를 지원한다. Token Station을 지정하면 xAI의 Grok 4.6이 선택 가능한 모델로 나타나며, 자신의 키로 과금되고 Agent 모드에서의 파일 편집도 확인됐다. Claude Sonnet 5와 Haiku 설정의 자매편으로, Grok에서 무엇이 다른지 다룬다."
category: "tutorial"
date: "2026-08-26"
cta: "https://models.bytefuture.ai/intro.html"
cover: "blog/route-cursor-through-token-station-grok-4-6-cover.png"
draft: false
---

Cursor는 Settings → Models에서 커스텀 OpenAI 호환 프로바이더를 지원한다. Token Station의 엔드포인트를 지정하면 xAI의 Grok 4.6을 선택 가능한 모델로 추가할 수 있고, 자신의 Token Station 키로 과금된다. 이 글은 [Claude Sonnet 5와 Haiku 설정](/blog/route-cursor-through-token-station-ko.html) 글의 자매편이다. 프로바이더 등록과 서브에이전트 정의는 어떤 모델을 추가하든 완전히 동일한 방식으로 작동하므로, 이 글은 짧게 유지하고 더 깊은 조사 내용(Cursor 자체의 내장 에이전트와 이름이 겹치는 문제, 그리고 서브에이전트가 부모 대화와 다른 모델로 실제로 동작하지 못하게 막는 Cursor 플랫폼 버그)은 그 글을 참고하도록 한다. Grok에 특유한 부분은 2단계와 아래 Agent 모드에 관한 내용이다.

설정에 들어가기 전에, Cursor에 직접 돈을 내는 대신 왜 굳이 Token Station을 거쳐 Cursor를 라우팅하는지 분명히 짚어볼 필요가 있다. 구체적인 이유는 세 가지다. Cursor의 Pro 플랜은 일부 모델(Grok 4.6, Grok 4.5, Composer 2.5)을 공유 월간 사용량 풀에 묶어 두고, 나머지 모델은 각 모델 자체의 API 가격으로 별도의 풀에서 과금한다. 하지만 어느 풀도 실제로 무엇에 얼마를 썼는지 모델별, 요청별로 나눠 보여주지는 않는다. Token Station 키는 이 두 풀을 모두 건너뛴다. BYOK 요청은 Token Station의 엔드포인트로 곧장 전달되어 Cursor 자체의 과금을 전혀 거치지 않고, 프로바이더의 실제 요율로 마진 없이 자신의 대시보드에 그대로 나타난다. 둘째, Cursor가 여러 코딩 도구 중 하나일 뿐이라면(예를 들어 Claude Code나 Codex, OpenClaw도 함께 쓴다면), 같은 Token Station 키와 같은 모델 ID가 그 모든 도구에서 똑같이 작동한다. 도구마다 별도의 키를 발급받고, 따로 충전하고, 따로 정산을 맞추는 대신 추적해야 할 계정과 잔액이 하나로 줄어든다. 셋째, Token Station의 카탈로그는 300개 이상의 모델, 30개가 넘는 프로바이더를 아우르며, Cursor가 자체 풀에 담아 놓은 범위를 훨씬 뛰어넘는다.

Grok에 특유한 부분 하나를 미리 짚어두자면, Cursor 자체의 Pro 플랜은 이미 Grok 4.6을 자체 "Cursor Models" 풀에 포함시켜, Cursor 자체의 사용량 풀 가격으로 과금하고 있다. 대신 Grok 4.6을 Token Station으로 라우팅한다는 것은, Cursor의 번들 할당량을 소진하는 대신 위에서 말한 비용 가시성과 통합 관리의 이점을 누리면서 xAI의 API 요율을 직접 지불한다는 뜻이다.

## 시작하기 전에 필요한 것

- Cursor 설치([cursor.com/download](https://cursor.com/download)).
- Token Station 계정과 API 키. [models.bytefuture.ai](https://models.bytefuture.ai)에서 무료로 가입할 수 있다. 가입 시 1달러 크레딧이 지급되며 카드는 필요 없다.
- Cursor Pro. Agent 모드에서의 커스텀 모델 선택은 자신의 API 키가 있어도 무료 플랜에서는 막혀 있어서, Chat 모드를 넘어서는 모든 용도에 Pro(월 20달러)가 필요하다.

## 1단계: Token Station을 커스텀 프로바이더로 등록하기

**Settings → Cursor Settings → Models**를 열고 **API Keys**까지 스크롤한 다음, 두 필드를 설정한다.

- **OpenAI API Key**: Token Station 키를 입력한다.
- **Override OpenAI Base URL**: 토글을 켜고, 기본값을 `https://models.bytefuture.ai/v1`로 바꾼다.

이 단계는 앞으로 추가할 모델과 무관하게 동일하므로, 자매편 글과 같은 영상을 그대로 사용한다.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/register-provider.mp4" type="video/mp4">
  </video>
  <figcaption>Cursor의 Models 설정에서 Token Station을 커스텀 OpenAI 호환 프로바이더로 등록하는 과정.</figcaption>
</figure>

키와 URL이 올바른지 확인할 때 "Verify" 버튼에 의존하지 말자. 항상 나타나는 것도 아니고, 나타나더라도 모든 경로를 커버하지는 않는다. 믿을 만한 확인 방법은 2단계다: 모델을 추가하고 실제로 메시지를 보내보는 것.

## 2단계: Grok 4.6을 커스텀 모델로 추가하기

여전히 Models 설정에서, **+ Add Custom Model**을 클릭해 다음을 추가한다.

```
xai/grok-4.6
```

**Claude 설정과 같은 함정**: 여기서 등록한 이름을 Cursor는 그대로 요청의 `model` 필드로 보낸다. Token Station의 실제 라우트 이름에는 `xai/` 접두사가 붙어 있다. 접두사 없이 `grok-4.6`으로 등록하면 요청이 `Model 'grok-4.6' not found` 오류로 실패한다. 접두사를 붙여 등록하면 바로 작동한다.

Cursor에 받아들여진 것뿐 아니라 실제로 엔드투엔드로 작동하는지 확인하려면, 채팅을 열어 Grok 4.6을 선택하고 아무 메시지나 보낸 다음 [Token Station 대시보드](https://models.bytefuture.ai/dashboard)를 확인한다. 실제 응답과 함께 Recent Activity에 해당하는 항목이 나타난다면, 키와 base URL, 모델 이름이 모두 올바르다는 뜻이다.

<figure>
  <img src="/blog/route-cursor-through-token-station/grok-dashboard-activity.jpg" alt="Token Station 대시보드의 Recent Activity에 xai/grok-4.6 요청이 0.01달러로 표시된 모습" />
  <figcaption>Cursor를 통해 보낸 실제 요청이 Token Station 키에 과금되어 Recent Activity에 xai/grok-4.6으로 표시된다.</figcaption>
</figure>

| 모델 | 적합한 용도 |
|---|---|
| `xai/grok-4.6` | 메인 코딩 모델. 플래닝, 구현, 채팅, 그리고 확인된 Agent 모드 파일 편집까지(아래 참고). |

Grok 4.6은 Token Station을 통해 Agent 모드 파일 편집도 지원한다. 채팅뿐 아니라 실제로 파일에 적용되는 편집이다.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/grok-agent-mode-edit.mp4" type="video/mp4">
  </video>
  <figcaption>Token Station을 통해 라우팅된 Grok 4.6이 Cursor의 Agent 모드에서 파일을 직접 편집한다.</figcaption>
</figure>

## 3단계: 범위가 명확한 서브에이전트 정의하기

자매편 글과 같은 두 서브에이전트, 읽기 전용 조사 역할과 테스트 검증 역할이 여기서도 똑같이 작동한다. `model:` 필드가 왜 서브에이전트를 실제로 다른 모델로 라우팅하지 못하는지, 그리고 왜 이 두 이름으로 정했는지에 대한 전체 내용은 [Claude Sonnet 5와 Haiku 글](/blog/route-cursor-through-token-station-ko.html)에 있다. 여기서는 짧은 버전만 다룬다.

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

여기서는 특정 모델을 지정하는 대신 명시적으로 `model: inherit`를 사용한다. Cursor의 Task 도구가 현재 서브에이전트에 지정된 커스텀 모델을 반영하지 않아서, 무엇을 지정하든 서브에이전트는 메인 대화가 사용 중인 모델(이 구성에서는 Grok 4.6)로 동작하기 때문이다. `inherit`는 이 사실을 있는 그대로 보여주며, 실제로는 존재하지 않는 비용 등급을 암시하지 않는다.

이 서브에이전트들을 만드는 과정은 자매편 글과 완전히 동일하므로, 같은 영상을 그대로 사용한다.

<figure>
  <video controls preload="metadata" playsinline>
    <source src="/blog/route-cursor-through-token-station/subagents.mp4" type="video/mp4">
  </video>
  <figcaption>bill-the-explorer와 jill-the-test-runner 두 서브에이전트를 만드는 과정.</figcaption>
</figure>

자매편 글에서 반복할 가치가 있는 내용이 하나 더 있다. 서브에이전트 이름은 Cursor 자체의 내장 에이전트와 겹치지 않는 것으로 짓자. `explore`는 실제로 존재하는 내장 이름이라, 직접 정의한 것 대신 그 내장 에이전트로 조용히 라우팅되며 아무 오류도 나지 않는다. `bill-the-explorer`와 `jill-the-test-runner`는 이 문제를 피한다.

## 직접 시도해보기: 같은 httpie 작업

우리는 Claude Sonnet 5로 이 두 서브에이전트에 조사와 검증을 위임하며 [httpie](https://github.com/httpie/httpie)의 실제 기능에 대해 전체 세션을 실행했다. 리다이렉트를 따라간 뒤 실제로 도달한 URL을, 기존 경과 시간 옆에 httpie의 `--meta` 출력으로 추가하는 작업이었다. 그 세션과 영상은 자매편 글에 있다.

Grok 4.6을 메인 모델로 해서 서브에이전트 위임을 포함한 그 동일한 다단계 세션은 아직 실행해보지 않았으므로, 이 절은 이 구체적인 작업에서 무슨 일이 있었는지에 대한 보고가 아니라 여전히 "직접 시도해보기"다. 위에서 확인된 것은 Grok 4.6이 Token Station을 통해 실제 Agent 모드 파일 편집을 적용할 수 있다는 점이며, 따라서 전체 작업이 실패할 것이라고 볼 근본적인 이유는 더 이상 없다. 위임을 확실하게 트리거하는 방법은 명시적 호출이라는 것이 확인됐다. 그냥 문장으로 "explore 서브에이전트를 써서"라고 요청해서는 실제로 위임되지 않는다. 같은 세 메시지 순서를, 그대로 Grok 4.6을 선택한 상태에서 시도해볼 가치가 있다.

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

단발성 Agent 모드 편집은 이미 확인됐다. 이 메시지 순서가 실제로 테스트하는 것은, 실제 서브에이전트 위임을 포함한 조사-구현-검증 워크플로 전체가 Claude Sonnet 5 때와 마찬가지로 다단계 세션에서도 안정적으로 이어지는가다.

## 지금 되는 것

Chat 모드와 Agent 모드 모두에서 Grok 4.6은 Token Station을 통해 Cursor 안에서 사용할 수 있다. 실제 응답, 실제 파일 편집이 이루어지고, Token Station 키에 정확히 과금되며, 대시보드에서도 확인된다. 프로바이더 등록과 서브에이전트 정의는 Claude 설정과 완전히 동일한데, 둘 다 어떤 모델을 추가하는지와 무관하기 때문이다.

이로써 Grok 4.6은 Claude Sonnet 5, 그리고 OpenAI의 GPT-6 Astra와 GPT-5.6 계열과 나란히, Token Station을 통해 Agent 모드 편집을 안정적으로 구동하는 라우트가 됐다. 도구 호출 호환성은 결국 모델과 프로바이더에 따라 실제로 달라진다는 것이 드러났으므로, Grok은 Claude와의 유추가 아니라 그 자체의 실측 증거로 여기서 확인된 것이다. OpenAI 모델이 어떻게 거기에 도달했는지는 Token Station API 키에 연결한 어댑터 덕분이며, 자세한 내용은 [GPT-6 Astra와 GPT-5.6 설정 가이드](/blog/route-cursor-through-token-station-openai-ko.html)를 참고하자.

아직 테스트하지 않은 구체적인 부분은, Grok 4.6을 메인 모델로 해서 조사 위임, 구현, 검증 위임까지 포함하는 실제 작업에 대한 완전한 다단계 세션이다. 그 바탕이 되는 단발 편집 능력은 이미 확인됐고, 엔드투엔드 워크플로는 위의 "직접 시도해보기"에 해당한다.

서브에이전트 단위의 모델 라우팅은 어떤 모델을 쓰든 자매편 글에서 설명한 것과 같은 제약을 가진다. Cursor의 Task 도구는 `inherit`나 자체 `composer-2.5-fast`만 받아들이기 때문에, 서브에이전트는 항상 부모 대화가 사용 중인 모델로 동작한다. 이는 Cursor 플랫폼 자체의 제약이며, Grok이나 Claude, Token Station에 국한된 문제가 아니다.

## 시작하기

[models.bytefuture.ai](https://models.bytefuture.ai/signup)에서 가입하자. 1달러 무료 크레딧, 카드 불필요, 첫 충전 시 최대 50달러 보너스도 받을 수 있다. 키를 export하고 Cursor의 Models 설정에 연결한 다음, `xai/grok-4.6`을 추가하자.

[Token Station 사용해보기](https://models.bytefuture.ai/intro.html)
