---
slug: "configure-codex-app-with-token-station"
lang: "ko"
title: "Codex App을 Token Station에 연결하기: Windows, macOS, Linux"
summary: "Codex App에 Token Station을 사용자 지정 모델 Provider로 등록하고 각 운영체제에서 API key를 로드한 뒤 Responses API 전체 경로를 검증합니다."
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
cover: "blog/configure-codex-app-with-token-station-cover.png"
draft: false
---

Codex App은 `config.toml`에 사용자 지정 모델 Provider를 등록할 수 있습니다. Provider를 Token Station Responses API로 지정하면 Token Station API key로 제공되는 모델을 사용할 수 있습니다.

이 글은 Windows, macOS, Linux 설정을 다룹니다. 데스크톱 App과 터미널 프로그램은 서로 다른 경로에서 환경 변수를 받을 수 있습니다. macOS에서 Dock이나 Finder로 실행한 App은 일반적으로 `~/.zshrc`를 읽지 않습니다.

## 준비 사항

- Codex App
- [Token Station](https://bec.bytefuture.ai/intro.html) 계정과 API key
- 대상 모델의 사용 권한과 잔액

예시는 `openai/gpt-5.6-sol`을 사용합니다. Token Station에 표시되는 현재 전체 모델 ID를 확인하세요.

> 실제 API key를 `config.toml`, 스크린샷, 채팅 또는 저장소에 넣지 마세요. Codex가 환경 변수에서 읽도록 설정합니다.

## Token Station Provider 등록

Codex App에서 **설정 → 구성 → config.toml 열기**로 이동해 다음을 추가합니다.

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

기존 설정이 있다면 필요한 항목을 지우지 말고 병합하세요.

| 필드 | 용도 |
| --- | --- |
| `model` | 전체 기본 모델 ID |
| `model_provider` | Codex가 사용할 Provider 블록 |
| `name` | Provider 표시 이름 |
| `base_url` | Token Station API 루트 |
| `env_key` | API key를 저장하는 환경 변수 이름 |
| `wire_api` | Responses API 선택 |

두 `token_station` 값이 일치해야 합니다.

```toml
model_provider = "token_station"
[model_providers.token_station]
```

`base_url`은 `/v1`까지만 입력하고 `/responses`를 추가하지 마세요. 모델 ID의 제공자 접두사도 유지합니다.

Provider 설정은 환경 변수의 이름만 지정하고 값은 제공하지 않습니다. 게다가 데스크톱 앱이 보는 환경은 터미널이 보는 환경과 같지 않을 수 있습니다. 다음 세 절에서 운영체제별 방법을 다룹니다.

## Windows: API key 설정

**고급 시스템 설정 → 환경 변수**를 열고 사용자 변수를 만듭니다.

| 항목 | 값 |
| --- | --- |
| 변수 이름 | `TOKEN_STATION_API_KEY` |
| 변수 값 | 실제 Token Station API key |

변수 이름은 `config.toml`의 `env_key`와 정확히 일치해야 합니다. 저장한 뒤 Codex App을 완전히 종료하고 다시 여세요.

## macOS: API key 설정

Dock, Finder, Launchpad에서 실행한 App은 현재 터미널의 `export`를 보통 상속하지 않습니다. 그래픽 로그인 세션에 변수를 추가합니다.

```bash
launchctl setenv TOKEN_STATION_API_KEY '실제 API Key'
```

key를 출력하지 않고 존재 여부를 확인합니다.

```bash
if [ -n "$(launchctl getenv TOKEN_STATION_API_KEY)" ]; then
  echo "TOKEN_STATION_API_KEY가 설정되어 있습니다"
else
  echo "TOKEN_STATION_API_KEY가 설정되지 않았습니다"
fi
```

`Command + Q`로 Codex App을 종료한 뒤 Dock, Finder 또는 Launchpad에서 다시 여세요.

`launchctl setenv` 변수는 보통 현재 로그인 세션에서만 유효합니다. 로그아웃이나 재부팅 후 다시 설정해야 할 수 있습니다. 삭제하려면:

```bash
launchctl unsetenv TOKEN_STATION_API_KEY
```

## Linux: API key 설정

환경 변수 상속 방식은 배포판, 데스크톱 환경, 설치 방법에 따라 다릅니다. 터미널에서 Codex를 실행한다면 같은 Shell에서 설정하세요.

```bash
export TOKEN_STATION_API_KEY='실제 API Key'
```

존재 여부를 확인합니다.

```bash
if [ -n "${TOKEN_STATION_API_KEY:-}" ]; then
  echo "TOKEN_STATION_API_KEY가 설정되어 있습니다"
else
  echo "TOKEN_STATION_API_KEY가 설정되지 않았습니다"
fi
```

같은 터미널에서 Codex를 실행하세요. 새 터미널에서도 로드하려면 `export`를 `~/.bashrc` 또는 `~/.zshrc`에 추가합니다.

GNOME이나 KDE 메뉴에서 실행하고 systemd 사용자 세션을 사용한다면 다음을 시도할 수 있습니다.

```bash
systemctl --user set-environment TOKEN_STATION_API_KEY='실제 API Key'
```

App을 완전히 종료하고 다시 엽니다. 삭제하려면:

```bash
systemctl --user unset-environment TOKEN_STATION_API_KEY
```

> Shell 설정 파일의 key는 평문으로 저장됩니다. Git이나 공개 동기화 폴더에 포함하지 마세요.

## 전체 경로 검증

Codex App이 응답하는 것은 증거의 절반일 뿐입니다. 경로의 양쪽 끝을 모두 확인하세요.

1. Codex App을 완전히 종료하고 다시 열기
2. 새 대화 만들기
3. 다음 메시지 보내기

   ```text
   Token Station 테스트 성공이라고만 답하세요
   ```

4. 정상 응답 확인하기
5. [Token Station 대시보드](https://bec.bytefuture.ai/dashboard) 열기
6. `Recent Activity`에서 시간, 상태, 모델 비교하기

요청 경로는 다음과 같습니다.

```text
Codex App
→ config.toml의 token_station provider
  → TOKEN_STATION_API_KEY
  → https://bec.bytefuture.ai/v1/responses
→ Token Station 호출 기록
```

App 응답과 Token Station의 해당 기록이 모두 있어야 연결이 완료됩니다.

## 문제 해결

### API key를 찾을 수 없음

변수 이름이 `env_key = "TOKEN_STATION_API_KEY"`와 정확히 일치하는지 확인하고 설정 후 App을 다시 시작하세요. macOS에서 Dock으로 실행한다면 `launchctl setenv`를 사용합니다.

### 401 또는 403

key가 잘못되었거나 공백이 포함되었거나 모델 권한 또는 잔액이 없을 수 있습니다.

### 404

다음을 확인합니다.

```toml
base_url = "https://bec.bytefuture.ai/v1"
wire_api = "responses"
```

`/responses`를 중복해서 추가하지 마세요.

### 모델을 찾을 수 없음

Token Station이 제공하는 전체 모델 ID와 제공자 접두사를 사용하세요.

### 응답은 있지만 Token Station 기록이 없음

`model_provider`와 Provider 블록 이름이 일치하는지, App이 수정된 `config.toml`을 다시 읽었는지 확인하세요.

## 참고 자료

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station 대시보드](https://bec.bytefuture.ai/dashboard)
