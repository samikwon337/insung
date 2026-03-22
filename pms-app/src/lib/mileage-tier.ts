export interface MileageTier {
  min: number;
  max: number;
  label: string;
  icon: string;
  color: string;        // 텍스트
  bg: string;           // 배경
  border: string;       // 테두리
  badge: string;        // 배지 (인라인)
  progressColor: string;
}

export const MILEAGE_TIERS: MileageTier[] = [
  {
    min: 0, max: 199,
    label: '새싹',       icon: '🌱',
    color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    progressColor: 'bg-emerald-400',
  },
  {
    min: 200, max: 399,
    label: '주니어',     icon: '📘',
    color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    progressColor: 'bg-blue-400',
  },
  {
    min: 400, max: 599,
    label: '시니어',     icon: '💡',
    color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    progressColor: 'bg-purple-400',
  },
  {
    min: 600, max: 799,
    label: '전문가',     icon: '🚀',
    color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    progressColor: 'bg-orange-400',
  },
  {
    min: 800, max: 999,
    label: '마스터',     icon: '🏆',
    color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    progressColor: 'bg-red-400',
  },
  {
    min: 1000, max: Infinity,
    label: '지식스타',   icon: '⭐',
    color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-700',
    progressColor: 'bg-amber-400',
  },
];

export function getTier(points: number): MileageTier {
  return MILEAGE_TIERS.find(t => points >= t.min && points <= t.max) ?? MILEAGE_TIERS[0];
}

/** 현재 등급 내 진행률 (0~100) */
export function getTierProgress(points: number): number {
  const tier = getTier(points);
  if (tier.max === Infinity) return 100;
  return Math.round(((points - tier.min) / (tier.max - tier.min + 1)) * 100);
}

/** 다음 등급까지 남은 점수 */
export function getPointsToNextTier(points: number): number | null {
  const tier = getTier(points);
  if (tier.max === Infinity) return null;
  return tier.max + 1 - points;
}
