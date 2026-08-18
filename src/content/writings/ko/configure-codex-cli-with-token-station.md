---
slug: "configure-codex-cli-with-token-station"
lang: "ko"
title: "Codex CLI를 Token Station에 연결하기: Windows, macOS, Linux"
summary: "Codex CLI에 Token Station 사용자 지정 Provider를 설정하고 각 운영체제에서 API key를 안전하게 로드한 뒤 Responses API 요청을 검증합니다."
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
cover: "blog/configure-codex-cli-with-token-station-cover.png"
draft: false
---

Codex CLI는 `config.toml`에서 사용자 지정 모델 Provider를 지원합니다. Token Station을 추가하면 `codex`와 `codex exec`를 그대로 사용하면서 Token Station API key로 요청을 보낼 수 있습니다.

이 글은 명령줄 버전 Codex용입니다. Codex App은 특히 macOS와 Linux 데스크톱에서 환경 변수 상속 방식이 다르므로 두 절차를 섞지 마세요.

## 준비 사항

- `codex --version`으로 확인할 수 있는 Codex CLI
- 사용 가능한 Token Station API key
- 대상 모델의 사용 권한과 잔액

> 실제 API key를 문서, 스크린샷, 채팅 또는 저장소에 공개하지 마세요.

## Token Station Provider 설정

Codex CLI는 다음 사용자 설정 파일을 읽습니다.

- Windows: `%USERPROFILE%\.codex\config.toml`
- macOS와 Linux: `~/.codex/config.toml`

다음을 추가합니다.

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

다음을 확인하세요.

- `model_provider = "token_station"`이 `[model_providers.token_station]`과 일치함
- `base_url`은 `/v1`까지만 입력하고 `/responses`를 추가하지 않음
- `wire_api`는 `"responses"`
- 모델 ID에 제공자 접두사가 있음

예시는 `openai/gpt-5.6-sol`을 사용합니다. Token Station에 표시되는 현재 전체 ID를 사용하세요.

Provider 설정은 환경 변수의 이름만 지정하고 값은 제공하지 않습니다. 값을 넣는 방법은 운영체제마다 다릅니다.

## Windows 설정

### key 임시 로드

PowerShell에서 실행합니다.

```powershell
$env:TOKEN_STATION_API_KEY = "실제 API Key"
```

현재 PowerShell과 하위 프로세스에서만 유효합니다.

### 사용자 환경 변수로 저장

```powershell
[Environment]::SetEnvironmentVariable(
  "TOKEN_STATION_API_KEY",
  "실제 API Key",
  "User"
)
```

저장 후 터미널을 닫고 새 PowerShell을 여세요.

key를 출력하지 않고 변수를 확인합니다.

```powershell
if ([string]::IsNullOrEmpty($env:TOKEN_STATION_API_KEY)) {
  "TOKEN_STATION_API_KEY가 설정되지 않았습니다"
} else {
  "TOKEN_STATION_API_KEY가 설정되어 있습니다"
}
```

삭제하려면:

```powershell
[Environment]::SetEnvironmentVariable(
  "TOKEN_STATION_API_KEY",
  $null,
  "User"
)
```

## macOS와 Linux 설정

Codex CLI를 실행할 터미널에서 설정합니다.

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

새 터미널에서도 로드하려면 Shell 설정 파일에 `export`를 추가하세요.

| Shell | 일반적인 설정 파일 |
| --- | --- |
| Zsh | `~/.zshrc` |
| Bash | `~/.bashrc` |
| Fish | `~/.config/fish/config.fish`, 문법이 다름 |

편집 후 새 터미널을 열거나 `source ~/.zshrc` 또는 `source ~/.bashrc`를 실행합니다.

> Shell 설정 파일의 key는 평문으로 저장됩니다. Git이나 공개 동기화 폴더에 포함하지 마세요.

## 설정 검증

`config.toml`이 정상적으로 파싱된다는 것은 요청이 Token Station에 도달했다는 증거가 아닙니다. 대화형 세션을 시작합니다.

```bash
codex
```

실행 후 다음을 보냅니다.

```text
Token Station 테스트 성공이라고만 답하세요
```

비대화형 요청도 실행할 수 있습니다.

```bash
codex exec 'Token Station 테스트 성공이라고만 답하세요'
```

PowerShell에서는 큰따옴표를 사용합니다.

```powershell
codex exec "Token Station 테스트 성공이라고만 답하세요"
```

응답 후 [Token Station 대시보드](https://bec.bytefuture.ai/dashboard)의 `Recent Activity`에서 시간, 상태, 모델을 비교하세요.

다음 조건을 모두 충족해야 설정이 완료됩니다.

- `codex` 또는 `codex exec`가 정상 응답함
- Token Station에 해당 요청이 있음
- 기록된 모델이 설정과 일치함

## 문제 해결

### `codex` 명령을 찾을 수 없음

Codex CLI가 설치되고 설치 경로가 `PATH`에 포함되었는지 확인하세요. 새 터미널에서 `codex --version`을 실행합니다.

### API key를 찾을 수 없음

변수 이름이 `TOKEN_STATION_API_KEY`인지, `config.toml`의 `env_key`와 일치하는지, 같은 터미널에서 Codex를 실행하는지 확인하세요.

### 401 또는 403

key가 잘못되었거나 공백이 포함되었거나 모델 권한 또는 잔액이 없을 수 있습니다.

### 404

다음을 확인합니다.

```toml
base_url = "https://bec.bytefuture.ai/v1"
wire_api = "responses"
```

Base URL에 `/responses`를 추가하지 마세요.

### 모델을 찾을 수 없거나 요청 실패

Token Station이 현재 제공하는 전체 모델 ID와 제공자 접두사를 사용하세요.

### 이전 설정이 계속 사용됨

현재 사용자의 `config.toml`을 편집했는지, 확장자가 올바른지, Codex CLI 프로세스를 다시 시작했는지 확인하세요.

## 보안

- 실제 key를 `config.toml`에 쓰지 않기
- key가 포함된 Shell 설정 파일을 Git에 커밋하지 않기
- 공유 컴퓨터에서는 임시 환경 변수 사용하기
- 유출 가능성이 있으면 key를 즉시 폐기하고 다시 발급하기

## 참고 자료

- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station 대시보드](https://bec.bytefuture.ai/dashboard)
