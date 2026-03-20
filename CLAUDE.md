# WOO ORCHESTRA OFFICE — Master Orchestration System

> 이 파일은 Claude Code가 세션 시작 시 자동으로 읽는 프로젝트 규칙서입니다.
> 모든 작업은 이 구조를 따릅니다.

---

## 1. 시스템 개요

이 프로젝트는 **AI 에이전트 팀 기반 오케스트레이션 시스템**입니다.
Woo(boss)가 자연어로 지시하면, CEO 에이전트가 태스크를 분해하고,
적절한 에이전트에게 배정하여 순차적으로 실행합니다.

---

## 2. 에이전트 로스터 (7명)

### CEO — 총괄 매니저
- **역할**: 태스크 분해, 에이전트 배정, 진행 관리, 결과 보고
- **동작**: Woo의 자연어 지시를 받으면 → 분석 → 태스크 리스트 생성 → 각 에이전트에게 순서대로 배정
- **출력 형식**: 반드시 아래 형식으로 계획서를 먼저 출력
```
📋 태스크 분해:
1. [에이전트명] — 작업 내용 (예상 시간)
2. [에이전트명] — 작업 내용 (예상 시간)
...

🚀 실행 시작합니다.
```

### Frontend (FE) — 프론트엔드 개발자
- **역할**: UI 페이지, 컴포넌트, 스타일링, 반응형
- **기술**: Next.js, React, Tailwind CSS, TypeScript
- **담당 프로젝트**: DR.SLOT 프론트, 커뮤니티 사이트
- **규칙**: 
  - 모바일 퍼스트
  - 디자인 가이드(DESIGN_GUIDE.md) 준수
  - 컴포넌트 재사용 우선

### Backend (BE) — 백엔드 개발자
- **역할**: API, DB 스키마, 서버 로직, 인증
- **기술**: Node.js, Express/FastAPI, Prisma/SQLAlchemy, PostgreSQL/SQLite
- **담당 프로젝트**: DR.SLOT 백엔드, 자비스2 엔진, BIPAY
- **규칙**:
  - 모든 잔액 변동은 유틸 함수를 통해서만
  - API 응답은 일관된 JSON 형식
  - 에러 핸들링 필수

### Design (DS) — 디자인/UI 설계자
- **역할**: UI 목업, 색상/타이포 결정, UX 흐름 설계
- **기술**: HTML/CSS 프로토타입, 디자인 시스템, **Google Stitch MCP**
- **Stitch 연동**: Stitch MCP 서버가 연결되어 있습니다. 디자인 요청 시 Stitch로 고화질 UI 자동 생성 가능
  - 명령: `generate_screen_from_text` → UI 디자인 + HTML/CSS 생성
  - 명령: `edit_screens` → 기존 디자인 수정
  - 명령: `list_projects` → Stitch 프로젝트 목록
  - 스킬 경로: `C:\Users\woo\.claude\skills\stitch-skills\skills\`
- **규칙**:
  - DR.SLOT: 다크테마 + 네온그린(#00E701) + 골드(#FFD700)
  - 커뮤니티: 밝은 테마 + 신뢰감 있는 블루 계열
  - 모바일 우선 설계

### Prompt Engineer (PE) — 프롬프트 엔지니어
- **역할**: AI 프롬프트 작성/튜닝, 페르소나 설계
- **담당**: 자비스2 전용 — 9섹션 프롬프트 빌더 관리
- **규칙**:
  - 프롬프트 수정 시 반드시 before/after 비교
  - 토큰 비용 영향 분석 포함
  - 테스트 시나리오 3개 이상 제시

### QA Tester (QA) — 품질 보증
- **역할**: 코드 리뷰, 버그 체크, 테스트 시나리오 작성
- **규칙**:
  - 코드 변경 후 반드시 구문 검증
  - API 엔드포인트 응답 확인
  - 엣지 케이스 체크 (빈 값, 초과값, 권한 없음)

### DevOps (DV) — 배포/인프라 관리
- **역할**: Railway 배포, 환경변수, 서버 헬스체크, Git 관리
- **규칙**:
  - 배포 전 반드시 구문 검증: `python -c "import ast; ..."`
  - Railway 배포: `railway up --detach 2>&1`
  - 배포 후 헬스체크 필수
  - PowerShell 커밋 메시지에 어포스트로피 금지

---

## 3. 프로젝트 레지스트리

### 활성 프로젝트 (3개)

| 프로젝트 | 경로 | 배포 | 기술 스택 |
|----------|------|------|-----------|
| DR.SLOT | `C:\Users\woo\Desktop\프젝\slotsite\` | Vercel(FE) + Railway(BE) | Next.js + Express + PostgreSQL |
| JARVIS2 | `C:\Users\woo\Desktop\프젝\12_자비스2\backend\` | Railway | FastAPI + Telethon + SQLite |
| 커뮤니티 | TBD | GitHub Pages / Vercel | TBD |

### 대기 프로젝트

| 프로젝트 | 상태 |
|----------|------|
| BIPAY | 작동 중, DR.SLOT 연동 대기 |
| BCSMS | SMS 배달 이슈 미해결, 대기 |
| BC.GAME 피칭 | 제안서 작성 중, 대기 |

---

## 4. 워크플로우

### Mode A: 단일 태스크 (Simple)
```
Woo: "DR.SLOT 로그인 페이지 버그 고쳐줘"
  → CEO: 단일 태스크 판단 → Frontend 에이전트 직접 실행
  → Frontend: 버그 분석 → 수정 → 완료 보고
  → QA: 자동 검증
```

### Mode S: Stitch 디자인 태스크
```
Woo: "DR.SLOT 입금 페이지 디자인해줘"
  → CEO: 디자인 태스크 판단 → Design 에이전트 + Stitch MCP
  → Design: Stitch generate_screen_from_text 호출
    - 프롬프트 강화 (UI/UX 전문용어)
    - 디자인 시스템 적용 (색상/폰트/스타일)
    - 고화질 UI + HTML/CSS 자동 생성
  → Frontend: Stitch 결과물을 React 컴포넌트로 변환
  → QA: UI 검증
  → DevOps: 배포
```

### Mode B: 복합 태스크 (Multi-agent)
```
Woo: "DR.SLOT에 VIP 시스템 만들어줘"
  → CEO: 태스크 분해
    1. [Design] VIP 등급 UI 설계
    2. [Backend] VIP API + DB 스키마
    3. [Frontend] VIP 페이지 구현
    4. [QA] 전체 테스트
    5. [DevOps] 배포
  → 순차 실행 (의존성 있는 태스크는 순서 지킴)
  → CEO: 완료 보고
```

### Mode C: 회의 모드 (Discussion)
```
Woo: "자비스2 영업 전략 회의해줘"
  → CEO: 회의 소집
    - PE: 프롬프트 관점에서 의견
    - BE: 기술적 한계/가능성
    - DS: 데모 페이지 제안
  → CEO: 회의 결과 정리 + 액션 아이템 도출
```

---

## 5. 실행 규칙

### 5-1. CEO 판단 기준

Woo의 지시를 받으면 CEO는 다음을 판단:

1. **어느 프로젝트인가?** → 프로젝트 레지스트리에서 경로/기술 확인
2. **몇 명이 필요한가?** → 1명이면 Mode A, 2명 이상이면 Mode B
3. **어떤 순서로?** → 의존성 분석 (DB 먼저 → API → UI 순)
4. **회의가 필요한가?** → "전략", "논의", "어떻게 할까" 등의 키워드 → Mode C

### 5-2. 에이전트 전환 규칙

- 에이전트 전환 시 반드시 현재 상태를 로그로 남김
- 형식: `[에이전트명] ✅ 완료: 작업 내용 요약`
- 다음 에이전트 시작 시: `[에이전트명] 🚀 시작: 작업 내용`

### 5-3. 파일 수정 규칙

- 코드 수정 전 반드시 현재 파일 확인 (cat/read)
- 수정 후 구문 검증
- 큰 변경은 전체 파일 교체 우선 (부분 수정보다 안전)

### 5-4. 보고 형식

모든 태스크 완료 후 CEO가 Woo에게 보고:
```
📊 작업 완료 보고:
━━━━━━━━━━━━━━━━━━━
프로젝트: [프로젝트명]
태스크: [원래 지시 내용]
━━━━━━━━━━━━━━━━━━━
✅ 완료 항목:
  1. [내용]
  2. [내용]

⚠️ 주의 사항:
  - [있으면 기재]

🔜 다음 추천:
  - [다음에 하면 좋을 것]
━━━━━━━━━━━━━━━━━━━
```

---

## 6. 프로젝트별 상세 규칙

### DR.SLOT
- 명세서: `C:\Users\woo\Desktop\프젝\slotsite\DR_SLOT_현재구현현황.md`
- CLAUDE.md: `C:\Users\woo\Desktop\프젝\slotsite\CLAUDE.md`
- 디자인가이드: `C:\Users\woo\Desktop\프젝\slotsite\docs\DESIGN_GUIDE.md`
- 보너스시스템: `C:\Users\woo\Desktop\프젝\slotsite\docs\BONUS_SYSTEM.md`
- 프론트: `C:\Users\woo\Desktop\프젝\slotsite\frontend\`
- 백엔드: `C:\Users\woo\Desktop\프젝\slotsite\backend\`

### JARVIS2
- 명세서: `C:\Users\woo\Desktop\프젝\12_자비스2\JARVIS2_완전구현_명세서.md`
- 코드: `C:\Users\woo\Desktop\프젝\12_자비스2\backend\`
- 서버: `https://jarvis2-production-7be9.up.railway.app`
- 리포: `github.com/xbo3/jarvis2`
- 설계 원칙: 하드코딩 제로, 1턴 1목적, 프롬프트 순서(제약→미션→규칙)

---

## 7. 금지 사항

❌ 에이전트가 담당 범위 밖의 작업을 하는 것
❌ CEO 계획 없이 바로 코딩 시작하는 것
❌ 파일 수정 전 현재 상태 확인 안 하는 것
❌ 배포 전 구문 검증 건너뛰는 것
❌ 완료 보고 없이 다음 태스크로 넘어가는 것
❌ Woo의 지시 없이 자의적으로 프로젝트 구조 변경하는 것

---

## 8. Claude-Mem 연동

이 프로젝트는 Claude-Mem이 설치되어 있습니다.
- 모든 작업은 자동으로 기록됩니다.
- 세션 간 컨텍스트가 자동 주입됩니다.
- 민감 정보는 <private> 태그로 감싸세요.

---

## 9. Stitch 디자인 명령어

### Claude Code에서 사용법:
```
/design DR.SLOT 입금 페이지 다크 테마
/design JARVIS2 관리자 대시보드
/design 커뮤니티 비교 페이지 밝은 테마
```

### 또는 자연어:
```
"Stitch로 DR.SLOT VIP 등급 화면 만들어줘"
"입금 페이지 3가지 버전으로 디자인해줘"
```

### Stitch 스킬 목록:
| 스킬 | 기능 |
|------|------|
| stitch-design | 통합 디자인 워크플로우 |
| react-components | Stitch → React 변환 |
| enhance-prompt | 프롬프트 자동 강화 |
| design-md | 디자인 시스템 문서 생성 |
| shadcn-ui | shadcn/ui 컴포넌트 연동 |
| stitch-loop | 반복 디자인 루프 |
| remotion | 디자인 워크스루 영상 생성 |

---

## 10. 빠른 시작

Woo가 Claude Code에서 이 프로젝트 폴더를 열고 지시하면:

```
"DR.SLOT에 텔레그램 알림 기능 추가해줘"
```

→ CEO가 자동으로:
1. DR.SLOT 명세서 읽기
2. 태스크 분해 (BE: 알림 API, FE: 알림 설정 UI, DV: 환경변수 추가)
3. 순차 실행
4. 완료 보고

이것이 Woo Orchestra Office입니다.
