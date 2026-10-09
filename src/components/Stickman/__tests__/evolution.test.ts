import { getPartEvolution } from '../evolution';

describe('Stickman Part Evolution Engine', () => {
  test('Level 1: minimum baseline size, 0 vascularity, normal tier', () => {
    const evo = getPartEvolution(1);
    expect(evo.growth).toBe(0);
    expect(evo.vascularity).toBe(0);
    expect(evo.veinCount).toBe(0);
    expect(evo.tier).toBe(0);
    expect(evo.isPrestige).toBe(false);
    expect(evo.glowColor).toBeNull();
  });

  test('Level 25: mid growth (approx 0.49), 0 vascularity', () => {
    const evo = getPartEvolution(25);
    expect(evo.growth).toBeCloseTo(24 / 49, 2);
    expect(evo.vascularity).toBe(0);
    expect(evo.veinCount).toBe(0);
    expect(evo.tier).toBe(0);
    expect(evo.isPrestige).toBe(false);
  });

  test('Level 50: massive growth (1.0), 0 vascularity', () => {
    const evo = getPartEvolution(50);
    expect(evo.growth).toBe(1.0);
    expect(evo.vascularity).toBe(0);
    expect(evo.veinCount).toBe(0);
    expect(evo.tier).toBe(0);
    expect(evo.isPrestige).toBe(false);
  });

  test('Level 51: first appearance of vascularity (0.02) and 1 vein', () => {
    const evo = getPartEvolution(51);
    expect(evo.growth).toBeGreaterThanOrEqual(1.0);
    expect(evo.vascularity).toBeCloseTo(0.02, 2);
    expect(evo.veinCount).toBe(1);
    expect(evo.tier).toBe(0);
    expect(evo.isPrestige).toBe(false);
  });

  test('Level 75: half vascularity (0.50) and 3 veins', () => {
    const evo = getPartEvolution(75);
    expect(evo.vascularity).toBe(0.5);
    expect(evo.veinCount).toBe(3);
    expect(evo.tier).toBe(0);
    expect(evo.isPrestige).toBe(false);
  });

  test('Level 99: high vascularity (0.98), 4 veins, still tier 0', () => {
    const evo = getPartEvolution(99);
    expect(evo.vascularity).toBeCloseTo(0.98, 2);
    expect(evo.veinCount).toBe(4);
    expect(evo.tier).toBe(0);
    expect(evo.isPrestige).toBe(false);
  });

  test('Level 100: Gold Prestige Tier reached (#FFD700), max vascularity (1.0)', () => {
    const evo = getPartEvolution(100);
    expect(evo.growth).toBe(1.2);
    expect(evo.vascularity).toBe(1.0);
    expect(evo.veinCount).toBe(4);
    expect(evo.tier).toBe(1);
    expect(evo.isPrestige).toBe(true);
    expect(evo.strokeColor).toBe('#FFD700');
    expect(evo.fillColor).toBe('#FFE866');
    expect(evo.glowColor).toBe('#FF8800');
  });

  test('Level 200: Diamond Prestige Tier (#00F0FF)', () => {
    const evo = getPartEvolution(200);
    expect(evo.tier).toBe(2);
    expect(evo.isPrestige).toBe(true);
    expect(evo.strokeColor).toBe('#00F0FF');
    expect(evo.glowColor).toBe('#0070F3');
  });

  test('Level 300: Mythic Prestige Tier (#BD00FF)', () => {
    const evo = getPartEvolution(300);
    expect(evo.tier).toBe(3);
    expect(evo.isPrestige).toBe(true);
    expect(evo.strokeColor).toBe('#BD00FF');
    expect(evo.glowColor).toBe('#7928CA');
  });
});
