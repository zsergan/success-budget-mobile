import type { TransactionCategoryModel } from '@api/models';

export type GridCategory = Pick<TransactionCategoryModel, 'id' | 'name' | 'icon' | 'color' | 'transactionType'> & {
  ownRecentCount?: number;
};

export const GRID_SLOTS = 8;

interface GridInput {
  active: GridCategory[];
  // An edit's archived category: first, and kept there until the form closes.
  archived: GridCategory | null;
  // One picked from the full list: it takes the last tile until the form closes.
  promotedId: number | null;
}

// What the user records most often of late comes first, ties in their own order; the full list keeps that order.
const byOwnUse = (categories: GridCategory[]) =>
  [...categories].sort((a, b) => (b.ownRecentCount ?? 0) - (a.ownRecentCount ?? 0));

// Up to eight tiles; past that, seven and More.
export const buildCategoryGrid = ({ active, archived, promotedId }: GridInput) => {
  const byUse = byOwnUse(active);
  const all = archived ? [archived, ...byUse] : byUse;

  if (all.length <= GRID_SLOTS) return { tiles: all, hasMore: false };

  const tiles = all.slice(0, GRID_SLOTS - 1);
  const promoted = tiles.some(({ id }) => id === promotedId) ? undefined : all.find(({ id }) => id === promotedId);

  if (promoted) tiles[tiles.length - 1] = promoted;

  return { tiles, hasMore: true };
};
