---
slug: "codex-multi-model-subagents"
lang: "en"
title: "Orchestrate Multi-Model Subagents in Codex"
summary: "A detailed guide to routing Codex subagents by complexity, risk, and verifiability, with provider setup, role configuration, permission boundaries, a complete example, and a staged rollout plan."
category: "tutorial"
date: "2026-08-17"
cta: "https://bec.bytefuture.ai/intro.html"
draft: false
---

Codex does not need to run every part of a large engineering task through one model. A capable main agent can interpret the goal, delegate bounded work to specialized subagents, and retain final responsibility for testing and acceptance.

The useful pattern is a controlled loop:

```text
Goal
  → Main agent decomposes and routes
  → Subagent works within defined boundaries
  → Tests and independent review
  → Main agent integrates and accepts
```

This avoids spending a flagship model on mechanical changes, makes parallel work possible, and separates implementation from review. The main agent decides whether to delegate, what context and permissions each task receives, and which checks must pass.

## Main agent, subagents, and tools

The main agent handles planning, dependencies, risk, routing, conflict resolution, tests, and final delivery. Its model should be reliable at judgment and correction, even if it does not write most of the code.

Subagents work best on narrow, verifiable tasks: inspect `src/auth` without editing, add tests for one module, migrate a specified directory, extract APIs from official documentation, or compare two implementations.

Tools provide access to files, code search, tests, browsers, MCP services, and Git. Model choice cannot compensate for excessive permissions or an unclear write scope.

## Profiles are not agent roles

A named Codex profile layers configuration onto a session. It does not by itself become a role that the main agent can select automatically. Multi-agent routing also needs a role description and delegation boundary.

Codex may define roles through `[agents.<name>]` entries and separate configuration files. These fields can change between versions. Check the installed version:

```bash
codex --version
```

Use strict configuration validation so unsupported fields fail visibly:

```bash
codex --strict-config
```

If the installed version rejects a field, follow its current OpenAI Docs and CLI help instead of disabling validation.

## Configure a model provider

Token Station can expose several models through one Responses API provider and API key. Add this base configuration to `~/.codex/config.toml`:

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"

[model_providers.token_station]
name = "Token Station"
base_url = "https://bec.bytefuture.ai/v1"
env_key = "TOKEN_STATION_API_KEY"
wire_api = "responses"
```

Provide the key through the environment:

```bash
export TOKEN_STATION_API_KEY='YOUR_REAL_API_KEY'
```

PowerShell:

```powershell
$env:TOKEN_STATION_API_KEY = "YOUR_REAL_API_KEY"
```

Keep the provider ID, environment variable name, `/v1` base URL, and `wire_api = "responses"` consistent. Use complete Token Station model IDs, including prefixes such as `openai/`, `glm/`, or `google/`.

## Define bounded agent roles

The following structure illustrates a lead agent with four roles. Feature flags and agent fields may vary by Codex version, so validate it with `--strict-config` and current OpenAI Docs.

```toml
[features]
multi_agent = true

[agents]
max_threads = 4
max_depth = 1

[agents.researcher]
description = "Read-only investigation of code and docs; return evidence, file locations, and conclusions"
config_file = "agents/researcher.toml"

[agents.implementer]
description = "Implement within an explicit file scope and run the specified tests"
config_file = "agents/implementer.toml"

[agents.test_writer]
description = "Add tests and failure cases without changing product behavior"
config_file = "agents/test-writer.toml"

[agents.security_reviewer]
description = "Review high-risk changes read-only and provide reproducible scenarios"
config_file = "agents/security-reviewer.toml"
```

Descriptions should state the role, boundaries, and expected output. “Help with coding” is too vague to route reliably.

### Read-only researcher

```toml
model = "openai/gpt-5.6-luna"
model_provider = "token_station"
model_reasoning_effort = "low"
sandbox_mode = "read-only"

developer_instructions = """
Investigate only the specified scope. Cite file paths, line numbers, or documentation sources.
Do not modify files or expand the task scope.
Clearly separate facts, inferences, and items that still need verification.
"""
```

### Implementer

```toml
model = "openai/gpt-5.6-terra"
model_provider = "token_station"
model_reasoning_effort = "medium"
sandbox_mode = "workspace-write"

developer_instructions = """
Modify only the directories and files explicitly listed in the task.
Read adjacent code and project instructions before implementing the smallest complete change.
Run the specified tests and report changed files, results, and remaining risks.
"""
```

### Independent reviewer

```toml
model = "openai/gpt-5.6-sol"
model_provider = "token_station"
model_reasoning_effort = "high"
sandbox_mode = "read-only"

developer_instructions = """
Review the implementation independently without adopting the implementer's conclusions.
Report only actionable, reproducible issues and include precise file locations.
Focus on permissions, data boundaries, error handling, and test gaps.
"""
```

Other models can replace these examples when their complete Token Station IDs are available. Test Responses API behavior, multi-turn tool calls, and context limits before enabling automatic routing.

## Route by complexity, risk, and verifiability

| Task | Useful model traits | Reason |
| --- | --- | --- |
| Requirements and architecture | Strong reasoning, high reliability | Early errors affect all later work |
| Renames and formatting | Fast and inexpensive | Mechanical and easy to verify |
| Multi-file implementation | Strong coding and context | Must track dependencies |
| Research | Fast, stable extraction | Coverage and evidence matter |
| Test generation | Reliable instruction following | Tests provide direct verification |
| Security review | Careful reasoning | False negatives and positives are costly |
| Final review | Different model from implementer | Reduces correlated mistakes |

Keep cross-module decisions and high-risk authentication, permissions, migrations, payments, and deletion with a strong model and independent review. Fast models fit work that tests, type checks, or formatters can verify cheaply. Tasks that depend heavily on implicit conversation context may be safer with the main agent.

## Write explicit routing rules

Add concise rules to the project `AGENTS.md`:

```markdown
When a task is complex, parallelizable, or needs independent review, first decide whether subagents are necessary.

Task routing rules:
- Give simple, mechanical, low-risk work to the researcher or a fast role.
- Give bulk code implementation to the implementer.
- Give external research to the researcher and require sources.
- Give test additions to the test_writer.
- Keep architecture, security, permissions, and final acceptance with the main agent.
- Every subtask must include a clear scope, output, and acceptance criteria.
- Do not let two write-capable agents modify the same file at the same time.
- Validate subagent results with tests or an independent check.
- Let the main agent handle small tasks directly; do not split work merely to use a subagent.
```

## Validate every third-party model

OpenAI-compatible APIs do not necessarily support every Codex behavior. Test each model in stages: plain text, accurate file reading, read-only search, a small temporary edit, correction after a test failure, permission and timeout errors, and the resulting Token Station activity record.

One successful text response does not establish reliable agentic coding or tool use.

## Complete example: file uploads

Suppose the project needs image validation, size limits, object storage, and unit tests. The main agent can build this task graph:

```text
Main agent
├── Researcher: investigate framework upload APIs and the object storage SDK
├── Implementer: implement the upload service and API
├── Test Writer: test formats, size limits, and failure cases
└── Security Reviewer: check path traversal, MIME spoofing, and resource abuse
```

Research task:

```text
Read the documentation for the project's web framework and object storage SDK.

Return only:
1. The recommended upload handling method.
2. Streaming and memory limits.
3. The officially recommended error handling approach.
4. Relevant API names and sources.

Do not modify code.
```

Implementation task:

```text
Implement the upload service within src/upload.

Requirements:
- Maximum file size: 10 MB.
- Allow only JPEG, PNG, and WebP.
- Do not trust the client-provided Content-Type.
- Use the existing object storage client.
- Do not change the database schema.
- When complete, list changed files, test results, and items still needing verification.
```

Test task:

```text
Add tests for the upload feature.

Cover all of the following:
- Valid JPEG.
- File over the size limit.
- Extension does not match the actual content.
- Empty file.
- Storage service failure.
- Filename collision during concurrent uploads.
```

Security review:

```text
Review only the upload implementation. Do not modify files.

Focus on:
- Path traversal.
- MIME spoofing.
- Image parser vulnerabilities.
- Unbounded memory use.
- Predictable filenames.
- Error message disclosure.

Every finding must include a file location and a reproducible scenario.
```

The main agent then inspects the diff, runs the full test suite, resolves conflicts, and makes the final security decision.

## Common failure modes

Do not create subagents for one-line work. Do not allow two writable agents to edit the same file. Treat “completed” as a claim until the main agent checks the diff and runs tests.

Keep API keys in environment variables or a credential manager. Sending work to a third-party provider may transmit prompts and source context. Private projects should review retention, training use, storage location, compliance requirements, and directories that must not leave the environment.

Cheaper tokens do not guarantee a lower total cost:

```text
Effective cost =
Invocation cost
+ Retry cost
+ Main-agent review cost
+ Cost of repairing incorrect changes
```

Measure success rate, latency, retries, and human rework for each task class.

## Roll out in stages

Start with a read-only researcher. Add a fast worker for formatting, test scaffolds, and bounded replacements. Grant workspace write access only after tool use is stable. Add an independent reviewer, then introduce automatic routing based on observed task results.

The mature design does not always choose the strongest or cheapest model. It selects an adequate model for each job while keeping critical decisions, permission control, and final quality with the main agent.

## References

- [OpenAI Docs: Codex Multi-agent](https://developers.openai.com/codex/multi-agent/)
- [Token Station](https://bec.bytefuture.ai/intro.html)
- [Token Station model list](https://bec.bytefuture.ai/models)
- [Token Station dashboard](https://bec.bytefuture.ai/dashboard)
