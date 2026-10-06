import { TransactionType } from '@shared/enums';
import type { GridCategory } from './categoryLayout';
import { buildCategoryGrid } from './categoryLayout';

const category = (id: number): GridCategory => ({
  id,
  name: `Category ${id}`,
  icon: 'other',
  transactionType: TransactionType.EXPENSE,
});

const ids = ({ tiles }: { tiles: GridCategory[] }) => tiles.map(({ id }) => id);
const active = (count: number) => Array.from({ length: count }, (_, index) => category(index + 1));

describe('buildCategoryGrid', () => {
  it('shows up to eight categories without More', () => {
    expect(buildCategoryGrid({ active: active(8), archived: null, promotedId: null })).toMatchObject({
      hasMore: false,
    });
    expect(ids(buildCategoryGrid({ active: active(3), archived: null, promotedId: null }))).toEqual([1, 2, 3]);
  });

  it('shows the first seven and More, with one picked from the list in the seventh place', () => {
    const grid = buildCategoryGrid({ active: active(12), archived: null, promotedId: 12 });

    expect(grid.hasMore).toBe(true);
    expect(ids(grid)).toEqual([1, 2, 3, 4, 5, 6, 12]);
    expect(ids(buildCategoryGrid({ active: active(12), archived: null, promotedId: 3 }))).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it('puts an archived category first', () => {
    expect(ids(buildCategoryGrid({ active: active(12), archived: category(99), promotedId: null }))).toEqual([
      99, 1, 2, 3, 4, 5, 6,
    ]);
  });
});
