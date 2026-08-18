---
slug: "configure-claude-code-cli-with-token-station"
lang: "ko"
title: "Claude Code CLI를 Token Station에 연결하기: Windows, macOS, Linux"
summary: "Windows, macOS, Linux에서 Claude Code CLI를 Token Station에 연결하고 실제 요청과 Token Station 활동 기록으로 전체 경로를 검증합니다."
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

Claude Code CLI는 Anthropic Messages API를 통해 서드파티 모델 게이트웨이에 연결할 수 있습니다. 요청 주소, API key, 모델 ID를 Token Station으로 지정하면 익숙한 `claude` 명령으로 Token Station에서 제공하는 모델을 사용할 수 있습니다.

이 글은 Windows, macOS, Linux 설정을 다룹니다. Base URL 뒤에 `/v1`을 추가하지 말고, 모델 ID의 `openai/` 또는 `anthropic/` 같은 제공자 접두사를 유지해야 합니다.

## 준비 사항

- `claude --version`으로 확인할 수 있는 Claude Code CLI
- [Token Station](https://bec.bytefuture.ai/intro.html) 계정과 API key
- 대상 모델의 사용 권한 또는 사용 가능한 잔액

예시는 `openai/gpt-5.6-sol`을 사용합니다. 모델 ID는 바뀔 수 있으므로 [Token Station 모델 목록](https://bec.bytefuture.ai/models)에 표시되는 전체 ID를 사용하세요.

> 실제 API key를 저장소, 공개 문서, 스크린샷 또는 채팅에 넣지 마세요.

## 설정할 변수

| 환경 변수 | 용도 | 예시 |
| --- | --- | --- |
| `ANTHROPIC_BASE_URL` | Claude Code 요청을 Token Station으로 전송 | `https://bec.bytefuture.ai` |
| `ANTHROPIC_AUTH_TOKEN` | Token Station API key | 실제 key |
| `ANTHROPIC_MODEL` | 전체 기본 모델 ID | `openai/gpt-5.6-sol` |

Claude Code는 Base URL 뒤에 Anthropic Messages API 경로를 붙입니다. 다음 주소를 사용하세요.

```text
https://bec.bytefuture.ai
```

`https://bec.bytefuture.ai/v1`로 설정하면 경로가 중복되어 404가 발생할 수 있습니다.

모델 ID도 전체 형식을 유지합니다.

```text
openai/gpt-5.6-sol
```

`gpt-5.6-sol`로 줄이지 마세요.

## Windows 설정

### 임시 설정

PowerShell에서 실행합니다.

```powershell
$env:ANTHROPIC_BASE_URL = "https://bec.bytefuture.ai"
$env:ANTHROPIC_AUTH_TOKEN = "실제 API Key"
$env:ANTHROPIC_MODEL = "openai/gpt-5.6-sol"

claude
```

현재 PowerShell과 하위 프로세스에서만 유효하므로 첫 테스트에 적합합니다.

### 사용자 환경 변수로 저장

새 터미널에서도 설정을 읽게 하려면 실행합니다.

```powershell
[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_BASE_URL",
  "https://bec.bytefuture.ai",
  "User"
)

[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_AUTH_TOKEN",
  "실제 API Key",
  "User"
)

[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_MODEL",
  "openai/gpt-5.6-sol",
  "User"
)
```

현재 PowerShell을 닫고 새 창에서 `claude`를 실행하세요. 이미 실행 중인 프로세스는 새 변수를 받지 않습니다.

변수를 삭제하려면:

```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $null, "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_MODEL", $null, "User")
```

## macOS와 Linux 설정

Claude Code를 실행할 터미널에서 설정합니다.

```bash
export ANTHROPIC_BASE_URL='https://bec.bytefuture.ai'
export ANTHROPIC_AUTH_TOKEN='실제 API Key'
export ANTHROPIC_MODEL='openai/gpt-5.6-sol'

claude
```

현재 Shell과 하위 프로세스에서만 유효합니다. 새 터미널에서도 불러오려면 세 줄의 `export`를 Shell 설정 파일에 추가하세요.

| Shell | 일반적인 설정 파일 |
| --- | --- |
| Zsh | `~/.zshrc` |
| Bash | `~/.bashrc` |
| Fish | `~/.config/fish/config.fish`, 문법이 다름 |

편집 후 새 터미널을 열거나 현재 Shell에서 다시 불러옵니다.

```bash
source ~/.zshrc
```

Bash에서는:

```bash
source ~/.bashrc
```

> Shell 설정 파일의 API key는 디스크에 평문으로 저장됩니다. Git이나 공개 동기화 폴더에 포함하지 마세요.

## 연결 검증

Claude Code가 실행된다는 사실만으로 Token Station 사용 여부를 확인할 수는 없습니다. 변수가 설정된 같은 터미널에서 실제 요청을 보내세요.

```bash
claude -p 'Token Station 테스트 성공이라고만 답하세요'
```

PowerShell에서는:

```powershell
claude -p "Token Station 테스트 성공이라고만 답하세요"
```

응답을 받은 뒤 [Token Station 대시보드](https://bec.bytefuture.ai/dashboard)의 `Recent Activity`에서 요청 시간, 상태, 모델을 확인합니다.

다음 조건을 모두 충족해야 연결이 완료된 것입니다.

- Claude Code가 정상 응답함
- Token Station에 해당 요청이 기록됨
- 기록된 모델이 설정과 일치함

## 선택 사항: 모델 등급 매핑

Claude Code의 일부 작업은 Opus, Sonnet, Haiku 등급을 사용합니다. 각 등급을 서로 다른 Token Station 모델에 연결할 수 있습니다.

```bash
export ANTHROPIC_DEFAULT_OPUS_MODEL='openai/gpt-5.6-sol'
export ANTHROPIC_DEFAULT_SONNET_MODEL='openai/gpt-5.6-terra'
export ANTHROPIC_DEFAULT_HAIKU_MODEL='openai/gpt-5.6-luna'
```

PowerShell에서는:

```powershell
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "openai/gpt-5.6-sol"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "openai/gpt-5.6-terra"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "openai/gpt-5.6-luna"
```

한 모델만 고정하려면 `ANTHROPIC_MODEL`만 설정해도 됩니다. 현재 사용 가능한 모델은 Token Station 목록에서 확인하세요.

## 문제 해결

### Anthropic 계정 로그인을 계속 요구함

API key가 로드되었는지 확인하고 변수를 설정한 같은 터미널에서 Claude Code를 실행하세요. Windows 사용자 변수를 저장했다면 새 PowerShell을 여세요.

### 401 또는 403

API key가 잘못되었거나 공백이 포함되었거나 모델 권한 또는 잔액이 없을 수 있습니다. key를 다시 복사하고 Token Station에서 계정 상태를 확인하세요.

### 404

Base URL은 다음 값이어야 합니다.

```text
https://bec.bytefuture.ai
```

`/v1` 또는 `/v1/messages`를 추가하지 마세요.

### 모델을 찾을 수 없음

Token Station에 표시되는 전체 모델 ID와 제공자 접두사를 사용하세요.

### 응답은 있지만 Token Station 기록이 없음

현재 프로세스가 Token Station을 사용하지 않을 수 있습니다. `ANTHROPIC_BASE_URL`을 확인하고 같은 터미널에서 `claude -p`를 다시 실행하세요.

## 참고 자료

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station 모델 목록](https://bec.bytefuture.ai/models)
- [Token Station 대시보드](https://bec.bytefuture.ai/dashboard)
