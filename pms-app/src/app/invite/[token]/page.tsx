import InviteClient from './InviteClient';

// output: 'export' 정적 빌드 시 동적 경로 허용
// 실제 토큰 값은 런타임에 클라이언트에서 URL로부터 읽음
export function generateStaticParams() {
  return [];
}

export default function InvitePage() {
  return <InviteClient />;
}
