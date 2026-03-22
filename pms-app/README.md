# INSUNG PMS — 목표성과관리 시스템

사내 목표 수립부터 연말 인사평가까지 전 과정을 디지털화한 웹 애플리케이션.

**Next.js 16 + Firebase (Auth / Firestore / Hosting) + shadcn/ui + Tailwind CSS v4**

---

## 목차

1. [기능 개요](#기능-개요)
2. [기술 스택](#기술-스택)
3. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
4. [Google Cloud / Firebase 연동](#google-cloud--firebase-연동)
5. [환경변수 설정](#환경변수-설정)
6. [개발 서버 실행](#개발-서버-실행)
7. [Firebase 배포](#firebase-배포)
8. [역할 체계](#역할-체계)
9. [프로젝트 구조](#프로젝트-구조)
10. [Firestore 보안 규칙 배포](#firestore-보안-규칙-배포)

---

## 기능 개요

| 기능 | 설명 |
|------|------|
| 인증 | Firebase Auth (Google SSO + 이메일/비밀번호), 초대 링크 |
| 사용자 관리 | 직접 등록 / 초대 링크 / 엑셀 일괄 업로드 |
| 조직 관리 | 회사 → 부문/공장 → 팀 계층 구조 CRUD |
| 목표 관리 | 목표 CRUD, 팀원→팀장→임원 승인 워크플로우, 변경 이력 |
| 진행상황 | 목표별 진행률 업데이트 + 코멘트 |
| 1on1 | 팀장-팀원 Q&A 채팅 형식 |
| 평가 관리 | 팀장 의견 → 임원 확정 → 공개 |
| 조직평가 | CEO 조직 등급 직접 지정, 등급 변경 이력 |
| 쿼터 관리 | 조직 등급 기반 개인 등급 자동 배분, HR_ADMIN 확정 |
| 마일리지 | 수동 조정, 등급 티어 표시 |
| 연간 목표 | 회사/조직 연간 목표 등록 및 대시보드 배너 표시 |
| 대시보드 | 역할별 요약 카드, 조직 트리 현황 (임원/CEO) |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16.2 (App Router, Static Export) |
| Language | TypeScript 5 |
| UI | React 19 + shadcn/ui + Tailwind CSS v4 |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Hosting | Firebase Hosting |
| Excel | SheetJS (xlsx) |
| Form | React Hook Form + Zod |

---

## 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 18 이상
- npm 9 이상
- Firebase CLI (`npm install -g firebase-tools`)
- Java 11 이상 (Firebase 에뮬레이터 실행에 필요)

### 설치

```bash
cd pms-app
npm install
```

---

## Google Cloud / Firebase 연동

### 1단계: Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 상단 프로젝트 선택 → **새 프로젝트**
3. 프로젝트 이름 입력 (예: `insung-pms`) → **만들기**

### 2단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **프로젝트 추가** → 1단계에서 만든 Google Cloud 프로젝트 선택
3. Google Analytics 연동 선택 후 **Firebase 추가 완료**

> Google Cloud 프로젝트와 Firebase 프로젝트는 자동으로 연결됩니다.

### 3단계: Firebase 서비스 활성화

#### Authentication 설정

1. Firebase Console → **Authentication** → **시작하기**
2. **Sign-in method** 탭
3. **Google** 활성화
   - 프로젝트 공개용 이름 입력
   - 지원 이메일 선택
   - **저장**
4. **이메일/비밀번호** 활성화 → **저장**

#### Firestore Database 설정

1. Firebase Console → **Firestore Database** → **데이터베이스 만들기**
2. 보안 규칙: **프로덕션 모드**로 시작 (나중에 rules 배포)
3. 위치: `asia-northeast3` (서울) 선택 → **완료**

#### Storage 설정

1. Firebase Console → **Storage** → **시작하기**
2. 보안 규칙: 기본값 그대로 → **다음**
3. 위치: `asia-northeast3` 선택 → **완료**

#### Hosting 설정

1. Firebase Console → **Hosting** → **시작하기**
2. Firebase CLI 안내를 따라 진행 (아래 CLI 설정에서 처리)

### 4단계: Firebase 웹 앱 등록 및 설정값 확인

1. Firebase Console → 프로젝트 설정 (톱니바퀴 아이콘)
2. **일반** 탭 → 하단 **내 앱** 섹션
3. **웹** 아이콘(`</>`) 클릭
4. 앱 닉네임 입력 (예: `pms-web`) → **앱 등록**
5. `firebaseConfig` 값 복사:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "insung-pms.firebaseapp.com",
  projectId: "insung-pms",
  storageBucket: "insung-pms.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 5단계: Firebase CLI 로그인 및 프로젝트 연결

```bash
# Firebase CLI 로그인
firebase login

# 프로젝트 목록 확인
firebase projects:list

# 현재 디렉토리를 Firebase 프로젝트에 연결 (pms-app 디렉토리에서 실행)
firebase use --add
# → 프로젝트 선택 후 별칭 입력 (예: default)
```

> `.firebaserc` 파일이 자동 생성됩니다:
> ```json
> { "projects": { "default": "insung-pms" } }
> ```

### 6단계: Authorized Domain 설정 (Google SSO 허용)

1. Firebase Console → **Authentication** → **Settings** 탭
2. **승인된 도메인** 섹션
3. Firebase Hosting 도메인이 자동 등록되어 있는지 확인
   - `insung-pms.web.app`
   - `insung-pms.firebaseapp.com`
4. 커스텀 도메인 사용 시 추가 등록 필요

---

## 환경변수 설정

`.env.local.example`을 복사하여 `.env.local` 생성:

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 4단계에서 복사한 값 입력:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=insung-pms.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=insung-pms
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=insung-pms.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# 로컬 에뮬레이터 사용 여부 (로컬 개발 시 true)
NEXT_PUBLIC_USE_EMULATOR=false
```

> `.env.local`은 `.gitignore`에 포함되어 있어 절대 커밋되지 않습니다.

---

## 개발 서버 실행

### 방법 1: Firebase 에뮬레이터 + Next.js 동시 실행 (권장)

실제 Firebase 프로젝트 없이 로컬에서 완전한 개발 환경 구성:

```bash
# .env.local에서 에뮬레이터 모드 활성화
NEXT_PUBLIC_USE_EMULATOR=true

# 에뮬레이터 + 개발 서버 동시 실행
npm run dev:local
```

에뮬레이터 UI: http://localhost:4000
Next.js 앱: http://localhost:3000

#### 시드 데이터 투입 (에뮬레이터 실행 중)

```bash
npm run seed
```

시드 데이터 포함 내용:
- 테스트 사용자 5명 (각 역할별)
- 조직 구조 (회사 → 부문 → 팀)
- 샘플 목표 및 평가 데이터

### 방법 2: 실제 Firebase 프로젝트 연결

```bash
# .env.local에서 에뮬레이터 비활성화
NEXT_PUBLIC_USE_EMULATOR=false

npm run dev
```

http://localhost:3000 접속

---

## Firebase 배포

### 1. 빌드

```bash
npm run build
# → out/ 디렉토리에 정적 파일 생성
```

### 2. Firestore 보안 규칙 배포

```bash
firebase deploy --only firestore:rules
```

### 3. Firebase Hosting 배포

```bash
firebase deploy --only hosting
```

### 4. 전체 배포 (rules + hosting)

```bash
firebase deploy
```

배포 완료 후 URL:
- `https://insung-pms.web.app`
- `https://insung-pms.firebaseapp.com`

### 배포 스크립트 (CI/CD)

```bash
npm run build && firebase deploy
```

---

## Firestore 보안 규칙 배포

보안 규칙은 `firestore.rules`에 정의되어 있습니다.

주요 규칙:
- 모든 컬렉션: 로그인한 사용자만 접근
- `users`: 본인 + HR_ADMIN/CEO만 쓰기
- `goals`: 본인 목표만 생성, 팀장/임원은 팀원 목표 수정 가능
- `orgGradeHistories`: CEO만 생성 (조직 등급 변경 이력)
- `divisionGradeQuotas`: HR_ADMIN/CEO만 쓰기
- `mileages`: 본인/HR_ADMIN/CEO만 읽기, HR_ADMIN/CEO만 쓰기
- `invitations`: 토큰을 아는 사람이면 읽기 가능 (UUID가 보안 역할)

```bash
# 규칙만 배포
firebase deploy --only firestore:rules

# 규칙 에뮬레이터에서 테스트
firebase emulators:start --only firestore
```

---

## 역할 체계

| 역할 | 코드 | 설명 |
|------|------|------|
| 팀원 | `MEMBER` | 본인 목표 관리, 진행상황 업데이트, 1on1 |
| 팀장 | `TEAM_LEAD` | 팀원 목표 승인/반려, 평가등급 추천, 1on1 진행 |
| 임원 | `EXECUTIVE` | 산하 조직 조회, 개인 평가등급 최종 확정 |
| 최고관리자 | `CEO` | 전사 현황, 조직 등급 지정, 전체 관리 |
| HR관리자 | `HR_ADMIN` | 사용자/조직 관리, 쿼터 확정, 평가 사이클 설정 |

---

## 프로젝트 구조

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/login/        # 로그인 페이지
│   ├── (dashboard)/         # 로그인 후 영역
│   │   ├── dashboard/       # 메인 대시보드
│   │   ├── goals/           # 목표 관리
│   │   ├── approvals/       # 승인 대기함
│   │   ├── progress/        # 진행상황
│   │   ├── oneon1/          # 1on1 Q&A
│   │   ├── evaluation/      # 평가 관리
│   │   └── admin/           # 관리자 (사용자/조직/설정)
│   └── invite/[token]/      # 초대 수락
├── components/
│   ├── layout/              # Sidebar, Header, AuthGuard
│   ├── goals/               # 목표 관련 컴포넌트
│   ├── evaluation/          # 평가 관련 컴포넌트
│   └── ui/                  # shadcn/ui 컴포넌트
├── contexts/
│   └── AuthContext.tsx      # 전역 인증 상태
├── lib/
│   ├── firebase.ts          # Firebase 초기화
│   ├── firestore.ts         # Firestore CRUD 헬퍼
│   └── mileage-tier.ts      # 마일리지 등급 계산
└── types/
    └── index.ts             # 전체 타입 정의
```

---

## 관련 문서

- [PRD (제품 요구사항)](../PRD_목표성과관리시스템.md)
- [TDD (기술 설계)](../TDD_목표성과관리시스템.md)
- [작업 현황](../WORK_STATUS.md)
