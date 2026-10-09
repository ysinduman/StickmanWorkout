import theme from '../../constants/theme';

export interface PartEvolution {
  level: number;
  // 0 at lvl 1, 1.0 at lvl 50, up to 1.20 at lvl 100+
  growth: number;
  // 0 at <= 50, 0.02 at lvl 51, 1.0 at lvl 100
  vascularity: number;
  // 0 to 4 branching veins
  veinCount: number;
  // Color tier: 0 (Normal 1-99), 1 (Gold 100-199), 2 (Diamond 200-299), 3 (Mythic 300+)
  tier: number;
  // Main stroke color
  strokeColor: string;
  // Muscle fill color
  fillColor: string;
  // Vein stroke color
  veinColor: string;
  // Glow aura color if prestige
  glowColor: string | null;
  // Whether prestige level (>= 100) is reached
  isPrestige: boolean;
}

export const PRESTIGE_TIERS = [
  { minLevel: 100, name: 'Gold', color: '#FFD700', fill: '#FFE866', glow: '#FF8800', vein: '#FFF9D2' },
  { minLevel: 200, name: 'Diamond', color: '#00F0FF', fill: '#70F8FF', glow: '#0070F3', vein: '#E0FFFF' },
  { minLevel: 300, name: 'Mythic', color: '#BD00FF', fill: '#E276FF', glow: '#7928CA', vein: '#F8E8FF' },
];

/**
 * Calculates visual progression parameters for a muscle group.
 * @param level 1 to 100+
 * @param isPriority Whether this body part is pinned as priority zone
 */
export function getPartEvolution(level: number = 1, isPriority: boolean = false): PartEvolution {
  const safeLevel = Math.max(1, Math.floor(level));

  // 1 to 50: Linear/sub-quadratic expansion up to massive size at 50
  // 51+: Stays massive with subtle micro-density growth
  let growth = 0;
  if (safeLevel <= 50) {
    growth = (safeLevel - 1) / 49; // 0.0 at lvl 1 -> 1.0 at lvl 50
  } else {
    // 50 to 100: slight extra growth up to +20%
    growth = 1.0 + Math.min(0.2, (safeLevel - 50) * 0.004);
  }

  // 51 to 100: Vascularity kicks in and grows every single level
  let vascularity = 0;
  let veinCount = 0;
  if (safeLevel > 50) {
    vascularity = Math.min(1.0, (safeLevel - 50) / 50); // 0.02 at 51 -> 1.0 at 100
    veinCount = Math.min(4, Math.floor((safeLevel - 50) / 12) + 1);
  }

  // Tier checking for level 100+
  let tier = 0;
  let strokeColor: string = isPriority ? theme.colors.accent.primary : theme.colors.text.primary;
  let fillColor: string = isPriority ? theme.colors.accent.primary : theme.colors.text.primary;
  let veinColor = '#38BDF8'; // energetic vascular cyan
  let glowColor: string | null = null;
  let isPrestige = false;

  if (safeLevel >= 300) {
    tier = 3;
    const t = PRESTIGE_TIERS[2];
    strokeColor = t.color;
    fillColor = t.fill;
    glowColor = t.glow;
    veinColor = t.vein;
    isPrestige = true;
  } else if (safeLevel >= 200) {
    tier = 2;
    const t = PRESTIGE_TIERS[1];
    strokeColor = t.color;
    fillColor = t.fill;
    glowColor = t.glow;
    veinColor = t.vein;
    isPrestige = true;
  } else if (safeLevel >= 100) {
    tier = 1;
    const t = PRESTIGE_TIERS[0];
    strokeColor = t.color;
    fillColor = t.fill;
    glowColor = t.glow;
    veinColor = t.vein;
    isPrestige = true;
  }

  return {
    level: safeLevel,
    growth,
    vascularity,
    veinCount,
    tier,
    strokeColor,
    fillColor,
    veinColor,
    glowColor,
    isPrestige,
  };
}
