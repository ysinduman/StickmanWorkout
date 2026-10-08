export const EMBERS_PER_WORKOUT = 5;

export const EMBER_SHELF = [
  { id: 'kneeSleeve', price: 10 },
  { id: 'headband', price: 25 },
  { id: 'goldBelt', price: 60 },
] as const;

export type ShelfItemId = (typeof EMBER_SHELF)[number]['id'];
