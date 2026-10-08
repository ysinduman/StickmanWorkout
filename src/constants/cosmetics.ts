export type CosmeticId = 'chalk_dust' | 'wrist_wrap' | 'ember_crown';

export const COSMETIC_IDS: CosmeticId[] = ['chalk_dust', 'wrist_wrap', 'ember_crown'];

/**
 * One drop per saved workout. Chalk dust 70%, wrist wrap 25%, ember crown 5%.
 */
export function rollCosmeticDrop(random: number = Math.random()): CosmeticId {
  if (random < 0.7) return 'chalk_dust';
  if (random < 0.95) return 'wrist_wrap';
  return 'ember_crown';
}
