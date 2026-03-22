# INSUNG PMS 작업 현황 (2026-03-22 기준)

## 프로젝트 개요

**INSUNG 목표성과관리 시스템 (PMS)**
Next.js 14 (App Router) + Firebase (Auth + Firestore) + shadcn/ui + Tailwind CSS

---

## 구현 완료 목록

### 1. 인증 (Auth)
- [x] Firebase Auth 기반 로그인 (`/app/(auth)/login/page.tsx`)
- [x] `AuthContext` — 로그인 상태 및 `userProfile` 전역 제공
- [x] `useAuth` 훅
- [x] `AuthGuard` — 역할 기반 라우트 보호
- [x] 개발용 역할 전환기 `DevRoleSwitcher`

### 2. 사용자 관리 (`/admin/users`) — HR_ADMIN / CEO 전용
- [x] 전체 사용자 목록 + 검색
- [x] 사용자 추가 / 수정 (다이얼로그)
- [x] 활성화 / 비활성화 토글
- [x] 사용자 삭제
- [x] 엑셀 양식 다운로드
- [x] 엑셀 일괄 업로드 (신규 등록 + 기존 업데이트, 오류 행 표시)
- [x] 초대 링크 생성 (`/invite/[token]`) — 7일 유효
- [x] 직접 등록 (Firebase Auth 즉시 생성 + 임시 비밀번호 `Insung@1234!`)

### 3. 초대 수락 (`/invite/[token]`)
- [x] 토큰 유효성 검사 (invalid / expired / used 상태 처리)
- [x] 비밀번호 설정 후 Firebase Auth 계정 생성
- [x] placeholder 문서 삭제 + UID 기반 재생성
- [x] 수락 후 대시보드로 자동 이동

### 4. 조직 관리 (`/admin/organizations`) — HR_ADMIN / CEO 전용
- [x] 조직 CRUD (회사 / 본부 / 사업부 / 팀 계층 구조)
- [x] 조직 리더(leaderId) 지정

### 5. 목표 관리

#### 목표 상태 흐름
```
DRAFT → PENDING_APPROVAL → LEAD_APPROVED (팀원만) → APPROVED
                                                    ↓
                                               IN_PROGRESS
                                                    ↓
                                             COMPLETED / PENDING_ABANDON → ABANDONED
                         REJECTED ←──────────────────────────────
```

- [x] 목표 목록 (`/goals`) — 연도 필터, 상태별 뱃지
- [x] 목표 상세 (`/goals/[id]`) — 진행률 업데이트, 이력 조회
- [x] 목표 등록 (`/goals/new`) — 제목 / 세부내용 / 기한 / 가중치
- [x] `GoalCard`, `GoalStatusBadge` 컴포넌트
- [x] `OrgGoalTree` — 임원/CEO용 조직 트리 목표 현황
- [x] `GoalForm` 컴포넌트
- [x] Firestore `goalHistories` 변경 이력 기록

### 6. 승인 관리 (`/approvals`)
- [x] 팀장: 팀원 목표 1차 승인 / 반려
- [x] 임원: LEAD_APPROVED 목표 최종 승인 / 반려
- [x] 포기(PENDING_ABANDON) 요청 처리

### 7. 진행상황 (`/progress`)
- [x] 진행 중 목표의 진행률 업데이트
- [x] 진행상황 코멘트 기록

### 8. 1on1 대화 (`/oneon1`)
- [x] 1on1 목록 (팀장: 리더 뷰 / 팀원: 멤버 뷰)
- [x] 1on1 생성 (`/oneon1/new`)
- [x] 1on1 채팅 Q&A (`/oneon1/[id]`) — 질문/답변 형식
- [x] `lastMessagePreview` 미리보기

### 9. 평가 관리 (`/evaluation`)
- [x] **팀원**: 내 평가 결과 조회 (PUBLISHED 상태일 때만 표시)
- [x] **팀장**: 팀원 등급 의견 제출 (A~E)
- [x] **임원**: 팀장 의견 참고 후 최종 등급 확정, 조직별 그룹핑
- [x] 조직 평가 결과 + 등급 쿼터 잔여 표시

### 10. 조직 평가 관리 (`/evaluation/org`) — HR_ADMIN / CEO 전용
- [x] 연도별 조직 평가 등급 업로드
- [x] CEO 최종 승인

### 11. 연간 목표 관리 (`/admin/annual-goals`) — HR_ADMIN / CEO 전용
- [x] 회사 연간 목표 등록/수정
- [x] 조직별 연간 목표 등록/수정

### 12. 마일리지 (`/admin/mileage`) — HR_ADMIN / CEO 전용
- [x] 전체 사용자 마일리지 조회
- [x] 마일리지 수동 조정 + 메모
- [x] `MileageCard` — 대시보드 내 개인 마일리지 + 등급 표시
- [x] `mileage-tier.ts` — 등급 계산 로직

### 13. 관리자 설정 (`/admin/settings`)
- [x] 평가 사이클 설정 (목표 수립 기간, 평가 기간)
- [x] 등급 쿼터 설정 (조직등급 → 개인등급 배분 수)

### 14. 대시보드 (`/dashboard`)
- [x] **팀원/팀장**: 요약 카드 (전체 목표 수, 평균 진행률, 완료, 승인대기)
- [x] 회사/조직 연간 목표 배너
- [x] 마일리지 카드
- [x] 최근 진행 중인 목표 3개
- [x] 예정 1on1 3개
- [x] **임원/CEO**: 조직 트리 전체 목표 현황

### 15. 레이아웃
- [x] `Sidebar` — 역할별 메뉴 필터링
- [x] `Header` — 페이지 타이틀
- [x] 반응형 대시보드 레이아웃

### 16. Firestore 헬퍼 (`/lib/firestore.ts`)
모든 컬렉션 CRUD 함수 구현:
- users, organizations, goals, goalHistories, progressUpdates
- oneOnOnes (+ questions 서브컬렉션), orgEvaluations, individualEvaluations
- evaluationCycles, gradeQuotas, mileages, annualGoals, invitations

---

## 데이터 모델 (Firestore 컬렉션)

| 컬렉션 | 설명 |
|--------|------|
| `users` | 사용자 (Firebase Auth UID = document ID) |
| `organizations` | 조직 계층 구조 |
| `goals` | 목표 |
| `goalHistories` | 목표 변경 이력 |
| `progressUpdates` | 진행상황 업데이트 |
| `oneOnOnes` | 1on1 대화 |
| `oneOnOnes/{id}/questions` | 1on1 Q&A (서브컬렉션) |
| `orgEvaluations` | 조직 평가 결과 |
| `individualEvaluations` | 개인 인사평가 |
| `evaluationCycles` | 평가 사이클 설정 |
| `gradeQuotas` | 등급 쿼터 설정 |
| `mileages` | 마일리지 (userId = document ID) |
| `annualGoals` | 연간 목표 (회사/조직) |
| `invitations` | 사용자 초대 토큰 |

---

## 역할별 접근 권한

| 페이지 | MEMBER | TEAM_LEAD | EXECUTIVE | CEO | HR_ADMIN |
|--------|--------|-----------|-----------|-----|----------|
| 대시보드 | ✅ | ✅ | ✅ (조직 트리) | ✅ (전체 트리) | ✅ |
| 목표 | ✅ | ✅ | - | - | - |
| 승인 | - | ✅ | ✅ | - | - |
| 진행상황 | ✅ | ✅ | - | - | - |
| 1on1 | ✅ | ✅ | - | - | - |
| 평가 | ✅ (결과만) | ✅ (의견 제출) | ✅ (등급 확정) | - | - |
| 조직 평가 | - | - | - | ✅ | ✅ |
| 연간 목표 설정 | - | - | - | ✅ | ✅ |
| 마일리지 관리 | - | - | - | ✅ | ✅ |
| 사용자 관리 | - | - | - | ✅ | ✅ |
| 조직 관리 | - | - | - | ✅ | ✅ |
| 시스템 설정 | - | - | - | ✅ | ✅ |

---

### 17. 부문/공장 조직평가 관리 (`/evaluation/org`) — 2026-03-22 추가
- [x] **CEO**: DIVISION/HEADQUARTERS 조직 등급 직접 지정 (즉시 APPROVED)
- [x] CEO 등급 변경 이력 자동 기록 (`orgGradeHistories` 컬렉션)
- [x] 이력 다이얼로그 — 이전 등급 → 신규 등급, 변경 일시 표시
- [x] **HR_ADMIN**: 조직별 개인 등급 쿼터 확정
- [x] 전역 비율 설정 기반 자동 계산 (총 인원 × 비율, 합계 보정)
- [x] 산하 하위 조직 포함 총 인원 재귀 계산
- [x] 확정 인원 합계 ≠ 총 인원 시 확정 버튼 비활성 + 경고
- [x] 확정 후 재조정 가능 (CONFIRMED → DRAFT 초기화)
- [x] CEO 등급 변경 시 기확정 쿼터 자동 DRAFT 초기화 + 경고
- [x] 사이드바에 CEO/HR_ADMIN 공통 "조직평가 관리" 메뉴 추가
- 신규 Firestore 컬렉션: `orgGradeHistories`, `divisionGradeQuotas`
- 신규 타입: `OrgGradeHistory`, `DivisionGradeQuota`

---

## 미구현 / 추후 개선 사항

- [ ] 사용자 초대 후 Firebase Auth 계정 상태 확인 (초대 대기 → 활성 자동 갱신)
- [ ] 알림 시스템 (승인 요청 시 실시간 알림)
- [ ] 평가 결과 공개(PUBLISHED) 기능 — HR_ADMIN이 개인별 공개 처리
- [ ] 목표 검색 / 필터 기능 (현재 연도 필터만 존재)
- [ ] 1on1 날짜/스케줄 기능 (현재 채팅 Q&A 형식만)
- [ ] 모바일 반응형 최적화
- [ ] Firebase Security Rules 정의
- [ ] 테스트 코드
