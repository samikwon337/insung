/**
 * Firebase 에뮬레이터 시드 스크립트
 * 실행: node scripts/seed.mjs
 * (에뮬레이터가 실행 중이어야 합니다)
 */

const EMULATOR_HOST = process.env.EMULATOR_HOST ?? 'localhost';
const AUTH_URL = `http://${EMULATOR_HOST}:9099`;
const FIRESTORE_URL = `http://${EMULATOR_HOST}:8080`;
const PROJECT_ID = 'demo-pms';

// ── Firestore REST 헬퍼 ──────────────────────────────────
async function firestoreSet(collection, docId, data) {
  const url = `${FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner',
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) throw new Error(`Firestore error: ${await res.text()}`);
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) {
      fields[k] = { nullValue: null };
    } else if (typeof v === 'boolean') {
      fields[k] = { booleanValue: v };
    } else if (typeof v === 'number') {
      fields[k] = { integerValue: String(v) };
    } else if (typeof v === 'string') {
      fields[k] = { stringValue: v };
    } else if (v instanceof Date) {
      fields[k] = { timestampValue: v.toISOString() };
    } else if (typeof v === 'object') {
      fields[k] = { mapValue: { fields: toFirestoreFields(v) } };
    }
  }
  return fields;
}

// ── Firebase Auth 에뮬레이터 REST 헬퍼 ───────────────────
async function createAuthUser(email, password, displayName) {
  const url = `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });
  if (!res.ok) {
    const err = await res.json();
    if (err.error?.message === 'EMAIL_EXISTS') {
      // 이미 존재하면 UID 조회
      const loginRes = await fetch(
        `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        console.log(`  ⚠ 이미 존재 (업데이트): ${email}`);
        return loginData.localId;
      }
      return null;
    }
    throw new Error(`Auth error: ${JSON.stringify(err)}`);
  }
  return (await res.json()).localId;
}

// ── 시드 데이터 ───────────────────────────────────────────
const now = new Date();
const year = new Date().getFullYear();

const organizations = [
  {
    id: 'company-001',
    name: 'INSUNG',
    type: 'COMPANY',
    parentId: null,
    leaderId: 'ceo-fixed-uid',
  },
  {
    id: 'division-001',
    name: '제조부문',
    type: 'DIVISION',
    parentId: 'company-001',
    leaderId: 'exec-fixed-uid',
  },
  {
    id: 'team-001',
    name: '생산1팀',
    type: 'TEAM',
    parentId: 'division-001',
    leaderId: 'lead-fixed-uid',
  },
];

// 고정 UID를 사용해 Auth + Firestore를 일치시킵니다
const users = [
  {
    uid: 'hr-fixed-uid',
    email: 'sslee@insungind.co.kr',
    password: 'Insung@1234!',
    name: '이상수',
    role: 'HR_ADMIN',
    position: 'HR관리자',
    orgId: 'company-001',
  },
  {
    uid: 'ceo-fixed-uid',
    email: 'sslee1@insungind.co.kr',
    password: 'Insung@1234!',
    name: '유대표',
    role: 'CEO',
    position: '대표이사',
    orgId: 'company-001',
  },
  {
    uid: 'exec-fixed-uid',
    email: 'sslee4@insungind.co.kr',
    password: 'Insung@1234!',
    name: '이철우',
    role: 'EXECUTIVE',
    position: '제조부문장',
    orgId: 'division-001',
  },
  {
    uid: 'lead-fixed-uid',
    email: 'sslee3@insungind.co.kr',
    password: 'Insung@1234!',
    name: '인영준',
    role: 'TEAM_LEAD',
    position: '생산1팀장',
    orgId: 'team-001',
  },
  {
    uid: 'member-fixed-uid',
    email: 'sslee2@insungind.co.kr',
    password: 'Insung@1234!',
    name: '이남훈',
    role: 'MEMBER',
    position: '주임',
    orgId: 'team-001',
  },
];

// ── Auth에 고정 UID로 사용자 생성 (에뮬레이터 batchCreate) ─
async function createAuthUserWithUid(uid, email, password, displayName) {
  const url = `${AUTH_URL}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:batchCreate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner',
    },
    body: JSON.stringify({
      users: [{ localId: uid, email, rawPassword: password, displayName, emailVerified: true }],
    }),
  });
  if (!res.ok) throw new Error(`batchCreate error: ${await res.text()}`);
  const data = await res.json();
  if (data.error?.length > 0) {
    const errMsg = data.error[0]?.message ?? '';
    if (errMsg.includes('DUPLICATE_LOCAL_ID') || errMsg.includes('EMAIL_EXISTS') || errMsg.includes('duplicate email') || errMsg.includes('localId belongs to an existing account')) {
      // 이미 존재 → 로그인으로 UID 확인 후 비밀번호 업데이트
      const loginRes = await fetch(
        `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        const existingUid = loginData.localId;
        if (existingUid !== uid) {
          // UID가 다르면 기존 계정 삭제 후 재생성
          await fetch(`${AUTH_URL}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:batchDelete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' },
            body: JSON.stringify({ localIds: [existingUid], force: true }),
          });
          return createAuthUserWithUid(uid, email, password, displayName);
        }
        console.log(`  ⚠ 이미 존재 (스킵): ${email}`);
        return existingUid;
      }
      console.log(`  ⚠ 이미 존재 (스킵): ${email}`);
      return uid;
    }
    throw new Error(`batchCreate error: ${JSON.stringify(data.error)}`);
  }
  return uid;
}

async function seed() {
  console.log('🌱 INSUNG 시드 데이터 생성 시작...\n');

  // 조직 생성
  console.log('📁 조직 생성...');
  for (const org of organizations) {
    await firestoreSet('organizations', org.id, {
      ...org,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✓ ${org.name} (${org.type})`);
  }

  // 사용자 생성
  console.log('\n👥 사용자 생성...');
  for (const user of users) {
    const uid = await createAuthUserWithUid(user.uid, user.email, user.password, user.name);
    await firestoreSet('users', uid, {
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.orgId,
      position: user.position,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  ✓ ${user.name} (${user.role}) — ${user.email}`);
  }

  // 평가 사이클 생성
  console.log('\n📅 평가 사이클 생성...');
  await firestoreSet('evaluationCycles', `cycle-${year}`, {
    year,
    goalStartDate: new Date(`${year}-01-01`),
    goalEndDate: new Date(`${year}-06-30`),
    evalStartDate: new Date(`${year}-01-01`),
    evalEndDate: new Date(`${year}-12-31`),
    isActive: true,
    createdAt: now,
  });
  console.log(`  ✓ ${year}년 평가 사이클`);

  // 등급 쿼터
  console.log('\n📊 등급 쿼터 생성...');
  // 비율(%) 기반 쿼터 (각 조직등급 행의 합 = 100)
  const quotas = [
    { orgGrade: 'A', memberGrade: 'A', count: 10 },
    { orgGrade: 'A', memberGrade: 'B', count: 30 },
    { orgGrade: 'A', memberGrade: 'C', count: 50 },
    { orgGrade: 'A', memberGrade: 'D', count: 10 },
    { orgGrade: 'A', memberGrade: 'E', count: 0  },
    { orgGrade: 'B', memberGrade: 'A', count: 0  },
    { orgGrade: 'B', memberGrade: 'B', count: 20 },
    { orgGrade: 'B', memberGrade: 'C', count: 60 },
    { orgGrade: 'B', memberGrade: 'D', count: 10 },
    { orgGrade: 'B', memberGrade: 'E', count: 10 },
    { orgGrade: 'C', memberGrade: 'A', count: 0  },
    { orgGrade: 'C', memberGrade: 'B', count: 10 },
    { orgGrade: 'C', memberGrade: 'C', count: 70 },
    { orgGrade: 'C', memberGrade: 'D', count: 10 },
    { orgGrade: 'C', memberGrade: 'E', count: 10 },
    { orgGrade: 'D', memberGrade: 'A', count: 0  },
    { orgGrade: 'D', memberGrade: 'B', count: 0  },
    { orgGrade: 'D', memberGrade: 'C', count: 60 },
    { orgGrade: 'D', memberGrade: 'D', count: 30 },
    { orgGrade: 'D', memberGrade: 'E', count: 10 },
    { orgGrade: 'E', memberGrade: 'A', count: 0  },
    { orgGrade: 'E', memberGrade: 'B', count: 0  },
    { orgGrade: 'E', memberGrade: 'C', count: 40 },
    { orgGrade: 'E', memberGrade: 'D', count: 30 },
    { orgGrade: 'E', memberGrade: 'E', count: 30 },
  ];
  for (const q of quotas) {
    await firestoreSet('gradeQuotas', `${q.orgGrade}-${q.memberGrade}`, q);
  }
  console.log(`  ✓ ${quotas.length}개 쿼터 등록`);

  console.log('\n✅ 시드 완료!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('테스트 계정 (공통 비밀번호: Insung@1234!)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  users.forEach(u => {
    const roleLabel = {
      HR_ADMIN: 'HR관리자 ',
      CEO: '최고관리자',
      EXECUTIVE: '임원    ',
      TEAM_LEAD: '팀장    ',
      MEMBER: '팀원    ',
    }[u.role];
    console.log(`  ${roleLabel}  ${u.name}  ${u.email}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed().catch(console.error);
