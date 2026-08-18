---
slug: "codex-multi-model-subagents"
lang: "ko"
title: "Codex에서 다중 모델 Subagent 구성하기"
summary: "Codex 주 Agent가 복잡도, 위험, 검증 가능성에 따라 Subagent를 배정하는 방법을 Provider 설정, 역할과 권한, 전체 사례, 단계별 도입 절차와 함께 설명합니다."
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

큰 개발 작업을 한 모델이 모두 처리할 필요는 없습니다. 신뢰도 높은 주 Agent가 목표를 이해하고 범위가 명확한 작업을 서로 다른 모델의 Subagent에 위임한 뒤 테스트와 최종 검수를 담당할 수 있습니다.

핵심은 Agent 수가 아니라 통제 가능한 흐름입니다.

```text
목표
  → 주 Agent가 작업을 분해하고 라우팅
  → Subagent가 제한된 범위에서 실행
  → 테스트와 독립 검토
  → 주 Agent가 통합하고 최종 승인
```

## 주 Agent, Subagent, 도구

주 Agent는 계획, 의존성, 위험, 라우팅, 충돌 해결, 테스트, 최종 인도를 책임집니다. 코드를 가장 많이 쓰지 않더라도 그 모델은 판단과 교정에서 신뢰할 수 있어야 합니다.

Subagent는 범위가 좁고 검증 가능한 작업에서 가장 잘 동작합니다. `src/auth`를 수정하지 않고 조사하기, 한 모듈에 테스트를 추가하기, 지정된 디렉터리를 마이그레이션하기, 공식 문서에서 API를 추출하기, 두 구현을 비교하기 같은 작업입니다.

Agent가 실제로 건드릴 수 있는 범위를 정하는 것은 모델이 아니라 도구입니다. 파일, 코드 검색, 테스트, 브라우저, MCP 서비스, Git이 그 대상입니다. 도구 권한이 너무 넓거나 쓰기 범위가 불분명한 상태는 어떤 모델을 골라도 보완되지 않습니다.

## Profile과 Agent 역할 구분

Codex의 이름 있는 profile은 세션에 설정을 겹쳐 적용하는 기능입니다. 주 Agent가 자동 선택하는 역할 자체는 아닙니다. 다중 Agent 라우팅에는 역할 설명과 위임 경계가 추가로 필요합니다.

버전을 확인합니다.

```bash
codex --version
```

지원하지 않는 필드를 놓치지 않도록 엄격한 설정 검증을 사용합니다.

```bash
codex --strict-config
```

설치된 버전이 필드를 거부하면 해당 버전의 OpenAI Docs와 CLI 도움말을 따르세요.

## 모델 Provider 설정

Token Station에서는 하나의 Responses API Provider와 API key로 여러 모델을 사용할 수 있습니다. `~/.codex/config.toml`에 추가합니다.

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

환경 변수로 key를 제공합니다.

```bash
export TOKEN_STATION_API_KEY='실제 API Key'
```

PowerShell:

```powershell
$env:TOKEN_STATION_API_KEY = "실제 API Key"
```

Provider ID, 환경 변수 이름, `/v1`까지의 Base URL, `wire_api = "responses"`를 일치시키세요. 모델 ID에는 `openai/` 같은 제공자 접두사를 유지합니다.

## Agent 역할 정의

다음은 네 역할을 등록하는 구성 예시입니다. feature flag와 Agent 필드는 Codex 버전에 따라 바뀔 수 있으므로 `--strict-config`로 검증하세요.

```toml
[features]
multi_agent = true

[agents]
max_threads = 4
max_depth = 1

[agents.researcher]
description = "코드와 문서를 읽기 전용으로 조사하고 근거, 파일 위치, 결론을 반환"
config_file = "agents/researcher.toml"

[agents.implementer]
description = "명확히 지정된 파일 범위에서 기능을 구현하고 지정된 테스트를 실행"
config_file = "agents/implementer.toml"

[agents.test_writer]
description = "제품 동작을 바꾸지 않고 테스트와 실패 시나리오를 추가"
config_file = "agents/test-writer.toml"

[agents.security_reviewer]
description = "고위험 변경을 읽기 전용으로 검토하고 재현 가능한 시나리오를 제시"
config_file = "agents/security-reviewer.toml"
```

`description`에는 역할, 금지 사항, 기대 출력을 구체적으로 적어야 합니다.

### 읽기 전용 Researcher

```toml
model = "openai/gpt-5.6-luna"
model_provider = "token_station"
model_reasoning_effort = "low"
sandbox_mode = "read-only"

developer_instructions = """
지정된 범위만 조사하세요. 파일 경로, 줄 번호 또는 문서 출처를 인용하세요.
파일을 수정하거나 작업 범위를 확대하지 마세요.
사실, 추론, 추가 검증이 필요한 항목을 명확히 구분하세요.
"""
```

### Implementer

```toml
model = "openai/gpt-5.6-terra"
model_provider = "token_station"
model_reasoning_effort = "medium"
sandbox_mode = "workspace-write"

developer_instructions = """
작업에 명시된 디렉터리와 파일만 수정하세요.
인접 코드와 프로젝트 지침을 먼저 읽고 최소한의 완전한 변경을 구현하세요.
지정된 테스트를 실행하고 변경 파일, 테스트 결과, 남은 위험을 보고하세요.
"""
```

### 독립 Reviewer

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"
model_reasoning_effort = "high"
sandbox_mode = "read-only"

developer_instructions = """
구현자의 결론을 그대로 따르지 말고 독립적으로 구현을 검토하세요.
조치 가능하고 재현 가능한 문제만 보고하며 정확한 파일 위치를 제시하세요.
권한, 데이터 경계, 오류 처리, 테스트 누락을 중점적으로 확인하세요.
"""
```

다른 모델을 사용하려면 Token Station의 전체 ID를 지정하고 Responses API, 여러 차례의 도구 호출, 컨텍스트 제한을 먼저 검증하세요.

## 모델 선택 기준

요구 사항 분석, 설계, 인증, 권한, 마이그레이션, 결제, 삭제는 강한 모델과 독립 검토에 맡깁니다. 이름 변경, 포맷 정리, 테스트 생성처럼 테스트나 타입 검사로 저렴하게 검증할 수 있는 작업은 빠른 모델에 적합합니다.

판단 기준은 복잡도, 위험, 검증 가능성, 암묵적 컨텍스트 의존성입니다. 이전 대화에 크게 의존하는 작업은 위임 과정에서 정보가 손실될 수 있으므로 주 Agent가 직접 처리하는 편이 안전합니다.

## 명확한 라우팅 규칙 작성

프로젝트의 `AGENTS.md`에 짧고 실행 가능한 규칙을 추가합니다.

```markdown
작업이 복잡하거나 병렬화할 수 있거나 독립 검토가 필요하면 먼저 Subagent가 필요한지 판단하세요.

작업 라우팅 규칙:
- 단순하고 기계적이며 위험이 낮은 작업은 researcher 또는 빠른 역할에 맡기세요.
- 대량 코드 구현은 implementer에 맡기세요.
- 외부 자료 조사는 researcher에 맡기고 출처를 요구하세요.
- 테스트 추가는 test_writer에 맡기세요.
- 아키텍처, 보안, 권한, 최종 승인은 주 Agent가 담당하세요.
- 각 하위 작업에는 명확한 범위, 결과물, 승인 기준이 있어야 합니다.
- 쓰기 권한이 있는 두 Agent가 같은 파일을 동시에 수정하지 않게 하세요.
- Subagent 결과는 테스트 또는 독립 검토로 검증하세요.
- 작은 작업은 주 Agent가 직접 처리하고 Subagent 사용만을 위해 분할하지 마세요.
```

## 서드파티 모델 단계별 검증

OpenAI 호환 API라고 해서 Codex의 모든 동작을 지원하는 것은 아닙니다. 순수 텍스트, 정확한 파일 인용, 읽기 전용 검색, 작은 임시 수정, 테스트 실패 후 수정, 권한과 타임아웃 보고, Token Station 활동 기록 순서로 확인하세요.

## 전체 사례: 파일 업로드

이미지 형식, 크기 제한, 오브젝트 스토리지, 단위 테스트를 추가한다면 주 Agent는 다음 작업 그래프를 만들 수 있습니다.

```text
주 Agent
├── Researcher: 프레임워크 업로드 API와 객체 스토리지 SDK 조사
├── Implementer: 업로드 서비스와 API 구현
├── Test Writer: 형식, 크기, 예외 시나리오 테스트 작성
└── Security Reviewer: 경로 순회, MIME 위조, 리소스 남용 점검
```

Researcher:

```text
프로젝트에서 사용하는 Web 프레임워크와 객체 스토리지 SDK 문서를 읽으세요.

다음 내용만 반환하세요:
1. 권장 업로드 처리 방식.
2. 스트리밍 처리와 메모리 제한.
3. 공식적으로 권장되는 오류 처리 방식.
4. 관련 API 이름과 출처.

코드를 수정하지 마세요.
```

Implementer:

```text
src/upload 범위에서 업로드 서비스를 구현하세요.

요구 사항:
- 최대 파일 크기는 10 MB.
- JPEG, PNG, WebP만 허용.
- 클라이언트가 제공한 Content-Type을 신뢰하지 않음.
- 기존 객체 스토리지 클라이언트를 사용.
- 데이터베이스 구조를 변경하지 않음.
- 완료 후 변경 파일, 테스트 결과, 추가 검증 항목을 나열.
```

Test Writer:

```text
업로드 기능 테스트를 추가하세요.

반드시 다음을 포함하세요:
- 유효한 JPEG.
- 크기 제한을 초과한 파일.
- 확장자와 실제 내용이 일치하지 않는 파일.
- 빈 파일.
- 스토리지 서비스 실패.
- 동시 업로드 중 파일 이름 충돌.
```

Security Reviewer:

```text
업로드 구현만 검토하고 파일은 수정하지 마세요.

중점 확인 항목:
- 경로 순회.
- MIME 위조.
- 이미지 파서 취약점.
- 제한되지 않은 메모리 사용.
- 예측 가능한 파일 이름.
- 오류 메시지를 통한 정보 유출.

모든 지적에 파일 위치와 재현 가능한 시나리오를 포함하세요.
```

마지막으로 주 Agent가 diff, 전체 테스트, 충돌, 보안 결정을 확인합니다.

## 자주 발생하는 문제

### 한 줄 수정에 Subagent를 만들지 않는다

Subagent를 만들 때마다 컨텍스트 전달과 조정 비용이 발생합니다. 분할이 유리한 경우는 병렬로 실행할 수 있거나, 작업량이 크거나, 다른 전문성이 필요하거나, 독립적인 검증이 필요하거나, 경계가 매우 명확한 작업입니다.

### 여러 쓰기 Agent가 같은 파일을 수정하지 않게 한다

쓰기 범위는 디렉터리나 모듈 단위로 나눕니다. 한 Agent가 구현하고 다른 Agent는 읽기 전용으로 검토하며, 의존 관계가 있는 작업은 순서대로 실행하고, 최종 통합은 주 Agent가 담당합니다.

### 주 Agent는 결과를 무조건 신뢰할 수 없다

Subagent의 “완료”는 그 Agent가 끝났다고 판단했다는 뜻일 뿐입니다. 주 Agent는 여전히 diff를 읽고, 테스트를 실행하고, 오류 출력을 확인하고, 범위를 벗어난 수정이 없는지 확인하고, 결과가 원래 요구사항을 충족하는지 판단해야 합니다.

### API key와 비공개 코드를 보호한다

key는 환경 변수, 시크릿 관리자 또는 운영체제 자격 증명 저장소를 통해 전달합니다. 서드파티 Provider에 작업을 넘기면 프롬프트와 코드 컨텍스트가 그 서비스로 전송될 수 있습니다. 비공개 프로젝트라면 라우팅을 시작하기 전에 데이터 보존, 학습 사용, 저장 지역, 규정 준수 요건, 외부로 나가면 안 되는 디렉터리를 먼저 정리하세요.

Subagent에는 해당 작업에 필요한 최소한의 컨텍스트만 전달합니다.

### 저렴한 모델이 총비용을 낮추지는 않는다

자주 실패해 재시도하고 결국 강한 모델로 재작업하게 되는 저렴한 모델은, 처음부터 강한 모델을 쓰는 것보다 비싸질 수 있습니다.

```text
실질 비용 =
호출 비용
+ 재시도 비용
+ 주 Agent 검토 비용
+ 잘못된 변경을 수정하는 비용
```

모델은 100만 Token당 가격이 아니라 작업 종류별 실측 결과로 판단합니다.

## 단계별 도입

### 1단계: 주 Agent와 읽기 전용 Researcher

먼저 저장소 검색, 문서 조사, 구조화된 보고를 검증합니다. 읽기 전용 권한이면 실패했을 때의 비용이 작습니다.

### 2단계: 빠른 작업 Agent 추가

서식 정리, 테스트 골격, 문서 보완, 범위를 명시한 일괄 치환을 맡기고 결과는 도구로 검증하게 합니다.

### 3단계: 구현 Agent 추가

도구 호출과 파일 수정이 안정된 뒤에 워크스페이스 쓰기 권한을 부여하고, 쓰기 범위는 디렉터리나 파일 이름으로 명확히 제한합니다.

### 4단계: 독립 Reviewer 추가

구현과 검토를 서로 다른 모델에 배정하고, 각 모델이 실제로 무엇을 잡아내는지 비교합니다.

### 5단계: 자동 라우팅 전에 측정

성공률, 지연, Token 소비, 재시도율, 사람의 재작업 시간을 기록하고, 그 기록에 따라 작업과 모델의 대응을 조정합니다.

## 요약

성숙한 다중 모델 구성은 작업마다 Agent를 늘리지 않고, 항상 가장 강한 모델이나 가장 저렴한 모델을 고르지도 않습니다. 복잡도, 위험, 검증 가능성, 컨텍스트 의존도에 따라 충분한 실행자를 고르고, 중요한 결정과 권한 통제, 최종 품질은 주 Agent에 남깁니다.

먼저 신뢰할 수 있는 Provider 하나를 설정하고, 경계가 분명한 소수의 역할을 정의하세요. `--strict-config`로 현재 Codex 버전이 필드를 인식하는지 확인하고, 읽기 전용 작업부터 검증하며, 자동 라우팅과 쓰기 권한은 마지막에 엽니다.

## 참고 자료

- [OpenAI Docs: Codex Multi-agent](https://developers.openai.com/codex/multi-agent/)
- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station 모델 목록](https://bec.bytefuture.ai/models)
- [Token Station 대시보드](https://bec.bytefuture.ai/dashboard)
