# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PRD(제품 요구사항 문서) 작성을 도와주는 CLI 에이전트. Claude Opus 4.6 기반의 대화형 인터페이스로 사용자 아이디어를 구조화된 PRD 문서로 변환한다.

## Setup & Run

```bash
# 의존성 설치
pip install anthropic

# API 키 설정
export ANTHROPIC_API_KEY="your-api-key"

# 에이전트 실행
python prd_agent.py
```

## Architecture

`prd_agent.py` 단일 파일로 구성:

- **`SYSTEM_PROMPT`** — PM 역할과 PRD 구조를 정의하는 시스템 프롬프트
- **`run_prd_agent()`** — 메인 대화 루프. `client.messages.stream()`으로 스트리밍 응답
- **`save_prd()`** — 완성된 PRD를 `PRD_{제품명}_{타임스탬프}.md`로 저장
- **`[PRD_COMPLETE]`** — 에이전트가 PRD 완성 시 응답 끝에 붙이는 신호 태그

PRD 완성 감지 흐름: `[PRD_COMPLETE]` 태그 감지 → `extract_prd_content()`로 내용 추출 → 마크다운 파일 저장 → 추가 수정 여부 확인
