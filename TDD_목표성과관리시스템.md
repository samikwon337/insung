# TDD: 목표성과관리 시스템 기술 설계 문서
# Technical Design Document (TDD)

> 최초 작성일: 2026-03-21
> 최종 업데이트: 2026-03-22
> 연관 문서: PRD_목표성과관리시스템.md

---

## 1. 기술 스택

| 영역 | 기술 | 버전 | 선택 이유 |
|------|------|------|-----------|
| Frontend Framework | Next.js | 16.2.1 | SSR/SSG 지원, Firebase Hosting 호환 |
| Language | TypeScript | ^5 | 타입 안정성, 유지보수 용이 |
| UI Runtime | React | 19.2.4 | 최신 Concurrent 기능 |
| Styling | Tailwind CSS | ^4 | 빠른 UI 구성 |
| UI 컴포넌트 | shadcn/ui | ^4.1.0 | 레몬베이스 수준의 깔끔한 디자인 |
| Database | Firebase Firestore | firebase ^12 | Google 무료 티어, 실시간 동기화, NoSQL 유연성 |
| Authentication | Firebase Auth | firebase ^12 | Google SSO + 이메일/비밀번호 |
| File Storage | Firebase Storage | firebase ^12 | 엑셀 업로드 저장 |
| Deployment | Firebase Hosting | - | Google 무료 CDN |
| Excel 처리 | xlsx (SheetJS) | ^0.18.5 | 조직평가 엑셀 업로드/파싱 |
| 상태 관리 | React Context + useState | - | 규모 대비 간결, Redux 불필요 |
| 폼 관리 | React Hook Form + Zod | ^7 / ^4 | 유효성 검사 통합 |
| 날짜 처리 | date-fns | ^4 | 경량 날짜 유틸 |
| 알림 토스트 | sonner | ^2 | 간결한 토스트 알림 |
| 병렬 개발 | concurrently | ^9 | 에뮬레이터 + 개발 서버 동시 실행 |

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│              Firebase Hosting                │
│         (Next.js Static Export)              │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Pages   │  │Components│  │  Context  │  │
│  │(App Dir) │  │(shadcn)  │  │(Auth/Data)│  │
│  └────┬─────┘  └──────────┘  └─────┬─────┘  │
│       │                             │        │
│       └──────────┬──────────────────┘        │
│                  │                           │
│           ┌──────▼──────┐                   │
│           │  lib/        │                   │
│           │  firestore.ts│                   │
│           │  auth.ts     │                   │
│           └──────┬───────┘                   │
└──────────────────┼────────────────────────────┘
                   │ Firebase SDK (클라이언트 직접 호출)
        ┌──────────▼──────────────┐
        │     Firebase            │
        │  ┌─────────────────┐    │
        │  │  Authentication  │    │
        │  ├─────────────────┤    │
        │  │   Firestore DB   │    │
        │  ├─────────────────┤    │
        │  │    Storage       │    │
        │  └─────────────────┘    │
        └─────────────────────────┘
```

> Next.js는 `output: 'export'` 설정으로 정적 빌드 → Firebase Hosting 배포
> API Routes 대신 Firebase SDK를 클라이언트에서 직접 호출

---

## 3. Firestore 데이터 모델 (ERD)

### 컬렉션 전체 목록

| 컬렉션 | 설명 |
|--------|------|
| `users` | 사용자 (Firebase Auth UID = document ID) |
| `organizations` | 조직 계층 구조 |
| `goals` | 목표 |
| `goalHistories` | 목표 변경 이력 |
| `progressUpdates` | 진행상황 업데이트 |
| `oneOnOnes` | 1on1 대화 |
| `oneOnOnes/{id}/questions` | 1on1 Q&A (서브컬렉션) |
| `orgEvaluations` | 조직 평가 결과 (레거시) |
| `orgGradeHistories` | 조직 평가 등급 변경 이력 (CEO) |
| `divisionGradeQuotas` | 부문별 개인 등급 쿼터 확정치 |
| `individualEvaluations` | 개인 인사평가 |
| `evaluationCycles` | 평가 사이클 설정 |
| `gradeQuotas` | 등급 쿼터 전역 비율 설정 |
| `mileages` | 마일리지 (userId = document ID) |
| `annualGoals` | 연간 목표 (회사/조직) |
| `invitations` | 사용자 초대 토큰 |

### 컬렉션 상세 스키마

```
firestore/
├── users/
│   └── {uid}
│       ├── email: string
│       ├── name: string
│       ├── role: 'MEMBER' | 'TEAM_LEAD' | 'EXECUTIVE' | 'CEO' | 'HR_ADMIN'
│       ├── organizationId: string  → organizations/{id}
│       ├── position: string
│       └── isActive: boolean
│
├── organizations/
│   └── {orgId}
│       ├── name: string
│       ├── type: 'COMPANY' | 'DIVISION' | 'HEADQUARTERS' | 'TEAM'
│       ├── parentId: string | null  → organizations/{id}
│       └── leaderId: string | null  → users/{uid}
│
├── goals/
│   └── {goalId}
│       ├── userId: string        → users/{uid}
│       ├── organizationId: string
│       ├── cycleYear: number     (e.g. 2026)
│       ├── title: string
│       ├── description: string
│       ├── dueDate: timestamp
│       ├── weight: number        (가중치 %, 본인 목표 합계 100)
│       ├── status: GoalStatus    (DRAFT | PENDING_APPROVAL | LEAD_APPROVED | APPROVED |
│       │                          IN_PROGRESS | COMPLETED | PENDING_ABANDON | ABANDONED | REJECTED)
│       ├── progress: number      (0~100)
│       ├── approvedBy: string | null
│       └── approvedAt: timestamp | null
│
├── goalHistories/
│   └── {historyId}
│       ├── goalId: string
│       ├── changedBy: string
│       ├── changeType: string
│       ├── previousStatus: string
│       ├── newStatus: string
│       ├── comment: string
│       └── createdAt: timestamp
│
├── progressUpdates/
│   └── {updateId}
│       ├── goalId: string
│       ├── userId: string
│       ├── progress: number
│       ├── comment: string
│       └── createdAt: timestamp
│
├── oneOnOnes/
│   └── {id}
│       ├── leaderId: string
│       ├── memberId: string
│       ├── organizationId: string
│       ├── title: string
│       ├── lastMessagePreview: string
│       ├── createdAt: timestamp
│       └── questions/ (서브컬렉션)
│           └── {qId}
│               ├── authorId: string
│               ├── authorRole: string
│               ├── content: string
│               └── createdAt: timestamp
│
├── orgGradeHistories/
│   └── {id}
│       ├── organizationId: string
│       ├── cycleYear: number
│       ├── previousGrade: string | null
│       ├── newGrade: string
│       ├── changedBy: string    (CEO uid)
│       └── changedAt: timestamp
│
├── divisionGradeQuotas/
│   └── {id}           (organizationId_year 형태)
│       ├── organizationId: string
│       ├── cycleYear: number
│       ├── orgGrade: string     (CEO가 지정한 조직 등급)
│       ├── quotas: { A: number, B: number, C: number, D: number, E: number }
│       ├── totalMembers: number
│       ├── status: 'DRAFT' | 'CONFIRMED'
│       ├── confirmedBy: string | null
│       └── confirmedAt: timestamp | null
│
├── individualEvaluations/
│   └── {id}
│       ├── userId: string
│       ├── organizationId: string
│       ├── cycleYear: number
│       ├── requestedGrade: string | null   (팀장 추천)
│       ├── requestedBy: string | null
│       ├── requestedAt: timestamp | null
│       ├── confirmedGrade: string | null   (임원 확정)
│       ├── confirmedBy: string | null
│       ├── confirmedAt: timestamp | null
│       └── status: 'DRAFT' | 'LEAD_REQUESTED' | 'EXECUTIVE_CONFIRMED' | 'PUBLISHED'
│
├── evaluationCycles/
│   └── {id}
│       ├── year: number
│       ├── goalStartDate: timestamp
│       ├── goalEndDate: timestamp
│       ├── evalStartDate: timestamp
│       ├── evalEndDate: timestamp
│       └── isActive: boolean
│
├── gradeQuotas/         (전역 비율 설정)
│   └── {id}
│       ├── orgGrade: string     (조직평가 등급)
│       ├── ratios: { A: number, B: number, C: number, D: number, E: number }  (%)
│       └── updatedAt: timestamp
│
├── mileages/
│   └── {userId}
│       ├── userId: string
│       ├── total: number
│       ├── tier: string         ('BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM')
│       └── history: Array<{ amount, memo, createdAt, changedBy }>
│
├── annualGoals/
│   └── {id}
│       ├── type: 'COMPANY' | 'ORGANIZATION'
│       ├── organizationId: string | null
│       ├── year: number
│       ├── content: string
│       └── updatedAt: timestamp
│
└── invitations/
    └── {token}          (UUID v4)
        ├── email: string
        ├── role: UserRole
        ├── organizationId: string
        ├── createdAt: timestamp
        ├── expiresAt: timestamp  (7일)
        └── usedAt: timestamp | null
```

### 조직 계층 예시

```
organizations/
  company-001  (type: COMPANY, parentId: null)
    ├── division-001  (type: DIVISION, parentId: company-001)  ← 생산부문
    │     ├── team-001  (type: TEAM, parentId: division-001)   ← 생산1팀
    │     └── team-002  (type: TEAM, parentId: division-001)   ← 생산2팀
    └── division-002  (type: DIVISION, parentId: company-001)  ← 영업부문
          └── team-003  (type: TEAM, parentId: division-002)   ← 영업팀
```

---

## 4. 권한(RBAC) 설계

### Firestore Security Rules 컬렉션별 권한

| 컬렉션 | MEMBER | TEAM_LEAD | EXECUTIVE | CEO | HR_ADMIN |
|--------|--------|-----------|-----------|-----|----------|
| users (본인) | R/W | R/W | R | R | R/W |
| users (타인) | R | R | R | R | R/W |
| organizations | R | R | R | R | R/W |
| goals (본인) | R/W | R/W | R | R | R |
| goals (팀원) | ❌ | R/W | R | R | R |
| goalHistories | R/create | R/create | R | R | R |
| progressUpdates | R/create(본인) | R/create | R | R | R |
| oneOnOnes | R/W(참여자) | R/W | R | R | R |
| orgGradeHistories | R | R | R | R/create | R |
| divisionGradeQuotas | R | R | R | R/W | R/W |
| individualEvaluations | R/W(본인) | R/W(요청) | R/W(확정) | R | R/W |
| evaluationCycles | R | R | R | R | R/W |
| gradeQuotas | R | R | R | R | R/W |
| annualGoals | R | R | R | R | R/W |
| mileages | R(본인) | ❌ | ❌ | R/W | R/W |
| invitations | R(공개) | ❌ | ❌ | R/create | R/create |

### 핵심 권한 규칙
1. **팀원**: 본인 목표만 수정 가능, 확정은 팀장 승인 필수
2. **팀장**: 소속 팀원 목표 승인/반려, 평가등급 요청(확정 불가)
3. **임원**: 산하 팀 전체 조회, 개인 평가등급 확정
4. **CEO**: 조직 등급 직접 지정 + 이력 관리, 전체 조회
5. **HR관리자**: 사용자/조직 관리, 쿼터 확정, 평가 사이클 설정

---

## 5. 프로젝트 폴더 구조

```
pms-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 루트 레이아웃 (AuthProvider 포함)
│   │   ├── page.tsx                  # 루트 → /login 리다이렉트
│   │   ├── globals.css               # 전역 스타일
│   │   ├── (auth)/                   # 비로그인 영역
│   │   │   └── login/page.tsx        # 로그인 페이지
│   │   ├── (dashboard)/              # 로그인 필요 영역
│   │   │   ├── layout.tsx            # 사이드바 + 헤더 레이아웃
│   │   │   ├── dashboard/page.tsx    # 홈 대시보드
│   │   │   ├── goals/                # 목표 관리
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── approvals/page.tsx    # 승인 대기함 (팀장/임원)
│   │   │   ├── progress/page.tsx     # 진행상황
│   │   │   ├── oneon1/               # 1on1
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── evaluation/           # 평가 관리
│   │   │   │   ├── page.tsx
│   │   │   │   └── org/page.tsx      # 조직평가 (CEO/HR_ADMIN)
│   │   │   └── admin/                # 관리자
│   │   │       ├── users/page.tsx
│   │   │       ├── organizations/page.tsx
│   │   │       ├── annual-goals/page.tsx
│   │   │       ├── mileage/page.tsx
│   │   │       └── settings/page.tsx
│   │   └── invite/
│   │       └── [token]/page.tsx      # 초대 수락
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # 역할별 메뉴 필터링
│   │   │   ├── Header.tsx
│   │   │   └── AuthGuard.tsx         # 권한 없으면 리다이렉트
│   │   ├── ui/                       # shadcn/ui 컴포넌트
│   │   ├── goals/
│   │   │   ├── GoalCard.tsx
│   │   │   ├── GoalForm.tsx
│   │   │   ├── GoalStatusBadge.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── OrgGoalTree.tsx       # 임원/CEO용 조직 트리
│   │   ├── evaluation/
│   │   │   ├── GradeSelect.tsx
│   │   │   └── QuotaTable.tsx
│   │   ├── dashboard/
│   │   │   └── MileageCard.tsx
│   │   └── common/
│   │       ├── DataTable.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── DevRoleSwitcher.tsx   # 개발용 역할 전환기
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx           # 전역 인증/유저 상태
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useGoals.ts
│   │   └── useOrganization.ts
│   │
│   ├── lib/
│   │   ├── firebase.ts               # Firebase 초기화 (에뮬레이터 분기 포함)
│   │   ├── firestore.ts              # DB 헬퍼 함수 (전체 컬렉션 CRUD)
│   │   ├── auth.ts                   # 인증 헬퍼
│   │   ├── mileage-tier.ts           # 마일리지 등급 계산 로직
│   │   └── utils.ts                  # 공통 유틸
│   │
│   └── types/
│       └── index.ts                  # 전체 타입 정의
│
├── scripts/
│   └── seed.mjs                      # Firestore 시드 데이터
├── public/
├── .env.local                        # Firebase 환경변수 (gitignore)
├── .env.local.example                # 환경변수 템플릿
├── firebase.json                     # Firebase Hosting + 에뮬레이터 설정
├── firestore.rules                   # Firestore 보안 규칙
├── storage.rules                     # Storage 보안 규칙
├── .firebaserc                       # Firebase 프로젝트 연결
├── docker-compose.yml                # Firebase 에뮬레이터 Docker 설정
├── Dockerfile.emulator               # 에뮬레이터 Docker 이미지
└── next.config.ts                    # output: 'export' 정적 빌드 설정
```

---

## 6. 주요 업무 흐름 (Flow)

### 6-1. 인증 흐름

```
[Google SSO]
사용자: [Google로 로그인] 클릭
  → Firebase signInWithPopup(GoogleAuthProvider)
    → Google 계정 선택 팝업
      → 인증 성공 → Firebase Auth UID 발급
        → Firestore users/{uid} 존재 여부 확인
          → 존재: 프로필 로드 → 대시보드 이동
          → 없음: "접근 권한이 없습니다" 안내 후 로그아웃

[이메일/비밀번호]
HR관리자: 직원 이메일로 사용자 직접 등록 → 임시 비밀번호 발급
  또는
HR관리자: 초대 링크 생성 (7일 유효 UUID 토큰)
  → 직원: 초대 링크 접속 → 비밀번호 설정 → Firebase Auth 계정 활성화
    → 대시보드로 자동 이동
```

### 6-2. 목표 수립 흐름

```
팀원: 목표 작성 (DRAFT)
  → [승인 요청] 클릭 → PENDING_APPROVAL
    → 팀장: 승인 대기함 확인
      → [승인] → LEAD_APPROVED
        → 임원: [최종 승인] → APPROVED → 자동으로 IN_PROGRESS
        → 임원: [반려] + 사유 → REJECTED
      → [반려] + 사유 → REJECTED
        → 팀원: 재수정 후 재요청 가능
```

### 6-3. 연말 평가 흐름

```
CEO: 부문/공장 조직 등급 직접 지정 (즉시 APPROVED, 이력 자동 기록)
  → HR관리자: 쿼터 비율 설정 확인
    → HR관리자: 조직별 개인 쿼터 확정 (총 인원 재귀 계산 + 자동 배분)
      → 팀장: 팀원별 등급 추천 → individualEvaluations (LEAD_REQUESTED)
        → 임원: [확정] → EXECUTIVE_CONFIRMED
          → HR관리자: 일괄 공개 → PUBLISHED (팀원 조회 가능)
```

### 6-4. 쿼터 자동 계산 로직

```
예) 팀 인원 10명, 조직평가 A등급인 경우
gradeQuotas 전역 비율 조회 (orgGrade='A')
→ ratios: { A: 10%, B: 30%, C: 50%, D: 10%, E: 0% }
→ 계산: A:1명, B:3명, C:5명, D:1명, E:0명 = 합계 10명 (합계 보정 적용)

divisionGradeQuotas에 저장:
  quotas: { A:1, B:3, C:5, D:1, E:0 }
  status: CONFIRMED (HR_ADMIN 확정 후)

※ 산하 하위 조직 포함 재귀 인원 계산
※ 확정 인원 합계 ≠ 총 인원 시 확정 버튼 비활성 + 경고
※ CEO가 조직 등급 변경 시 기확정 쿼터 자동 DRAFT 초기화
```

---

## 7. 개발 환경 (로컬)

### Firebase 에뮬레이터

```bash
# 에뮬레이터 포트
Auth:      9099
Firestore: 8080
Storage:   9199
UI:        4000

# 실행
npm run dev:local        # 에뮬레이터 + Next.js 동시 실행
npm run emulator         # 에뮬레이터만 실행
npm run seed             # 시드 데이터 투입
```

### 에뮬레이터 연결 분기 (lib/firebase.ts)

```typescript
// NEXT_PUBLIC_USE_EMULATOR=true 환경변수로 분기
if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
}
```

---

## 8. 환경변수

```bash
# .env.local — Firebase 프로젝트 설정
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# 로컬 에뮬레이터 사용 여부
NEXT_PUBLIC_USE_EMULATOR=false
```

---

## 9. 배포 구성

```
next build → out/ (정적 파일)
  → firebase deploy --only hosting

Firebase 무료 티어(Spark) 한도:
  - Hosting: 10GB 저장, 360MB/일 전송
  - Firestore: 1GB 저장, 50K 읽기/일, 20K 쓰기/일
  - Authentication: 무제한
  - Storage: 5GB
  → 사내 시스템 규모(수백 명 이하)에서는 무료로 충분
```

---

## 10. 타입 정의 (주요 타입)

```typescript
// types/index.ts

type UserRole = 'MEMBER' | 'TEAM_LEAD' | 'EXECUTIVE' | 'CEO' | 'HR_ADMIN'
type OrgType = 'COMPANY' | 'DIVISION' | 'HEADQUARTERS' | 'TEAM'
type GoalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'LEAD_APPROVED' | 'APPROVED' |
                  'IN_PROGRESS' | 'COMPLETED' | 'PENDING_ABANDON' | 'ABANDONED' | 'REJECTED'
type EvalStatus = 'DRAFT' | 'LEAD_REQUESTED' | 'EXECUTIVE_CONFIRMED' | 'PUBLISHED'
type EvalGrade = 'A' | 'B' | 'C' | 'D' | 'E'
type QuotaStatus = 'DRAFT' | 'CONFIRMED'
type MileageTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
```

---

## 11. 미결 기술 결정 사항

- [ ] **알림 방식**: 이메일(Firebase Extension) vs 인앱 알림(Firestore 실시간 onSnapshot)
- [ ] **모바일 반응형**: 완전 반응형 vs PC 최적화만
- [ ] **엑셀 다운로드**: 평가 결과 리포트 필요 여부
- [ ] **다국어 지원**: 현재 한국어 단일
- [ ] **테스트**: 단위 테스트(Vitest) + E2E(Playwright) 도입 여부
- [ ] **평가 공개(PUBLISHED)**: HR_ADMIN 일괄 공개 UI 구현 필요
