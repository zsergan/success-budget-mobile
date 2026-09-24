import { limitSchema, toLimitRequest, type LimitFormValues } from './limitSchema';

const values = (overrides: Partial<LimitFormValues>): LimitFormValues => ({
  scope: 'category',
  categoryIds: [1],
  name: '',
  amount: '100',
  ...overrides,
});

const errorOf = (overrides: Partial<LimitFormValues>) =>
  limitSchema.validate(values(overrides)).then(
    () => undefined,
    (error: Error) => error.message,
  );

describe('amount', () => {
  it.each(['100', '99.5', '0.01', '99999999.99'])('accepts %s', async (amount) => {
    await expect(limitSchema.validate(values({ amount }))).resolves.toMatchObject({ amount });
  });

  it('normalizes a comma', async () => {
    await expect(limitSchema.validate(values({ amount: '12,5' }))).resolves.toMatchObject({ amount: '12.5' });
  });

  it('requires an amount', async () => {
    await expect(errorOf({ amount: '' })).resolves.toBe('Enter an amount');
  });

  it.each(['0', '0.00', '-5'])('rejects %s', async (amount) => {
    await expect(errorOf({ amount })).resolves.toBe('Enter an amount greater than zero');
  });

  it.each(['abc', '1,234,56'])('rejects %s as not a number', async (amount) => {
    await expect(errorOf({ amount })).resolves.toBe('Enter a valid number');
  });

  it.each(['1.234', '1e3', '.5', ' 5'])('rejects the format of %j', async (amount) => {
    await expect(errorOf({ amount })).resolves.toBe('Enter an amount with at most two decimal places');
  });

  it('rejects an amount above the backend maximum', async () => {
    await expect(errorOf({ amount: '100000000' })).resolves.toBe('Enter an amount up to 99999999.99');
  });
});

describe('categories', () => {
  it('rejects categories on the monthly total', async () => {
    await expect(errorOf({ scope: 'total', categoryIds: [1] })).resolves.toBe('A monthly total has no categories');
  });

  it('accepts the monthly total without categories', async () => {
    await expect(errorOf({ scope: 'total', categoryIds: [] })).resolves.toBeUndefined();
  });

  it.each([[[]], [[1, 2]]])('requires exactly one category for a single limit, not %j', async (categoryIds) => {
    await expect(errorOf({ scope: 'category', categoryIds })).resolves.toBe('Pick a category');
  });

  it.each([[[1]], [[1, 1]]])('requires two distinct categories for a group, not %j', async (categoryIds) => {
    await expect(errorOf({ scope: 'group', categoryIds, name: 'Fun' })).resolves.toBe('Pick at least two categories');
  });

  it('drops duplicate categories', async () => {
    await expect(
      limitSchema.validate(values({ scope: 'group', categoryIds: [1, 2, 1], name: 'Fun' })),
    ).resolves.toMatchObject({ categoryIds: [1, 2] });
  });
});

describe('name', () => {
  it.each(['', '   '])('requires a group name, not %j', async (name) => {
    await expect(errorOf({ scope: 'group', categoryIds: [1, 2], name })).resolves.toBe('Enter a limit name');
  });

  it('trims the group name', async () => {
    await expect(
      limitSchema.validate(values({ scope: 'group', categoryIds: [1, 2], name: '  Fun  ' })),
    ).resolves.toMatchObject({ name: 'Fun' });
  });

  it('allows 60 characters, counting an emoji once', async () => {
    await expect(errorOf({ scope: 'group', categoryIds: [1, 2], name: '🍕'.repeat(60) })).resolves.toBeUndefined();
  });

  it('rejects a group name over 60 characters', async () => {
    await expect(errorOf({ scope: 'group', categoryIds: [1, 2], name: 'a'.repeat(61) })).resolves.toBe(
      'Keep the name to 60 characters',
    );
  });

  it('ignores the name outside a group', async () => {
    await expect(errorOf({ scope: 'category', name: 'a'.repeat(61) })).resolves.toBeUndefined();
  });
});

describe('toLimitRequest', () => {
  it('sends the name only for a group', () => {
    expect(toLimitRequest(values({ scope: 'group', categoryIds: [1, 2], name: 'Fun' }))).toEqual({
      amount: '100',
      category_ids: [1, 2],
      name: 'Fun',
    });
    expect(toLimitRequest(values({ scope: 'category', name: 'Stale' }))).toEqual({ amount: '100', category_ids: [1] });
    expect(toLimitRequest(values({ scope: 'total', categoryIds: [], name: 'Stale' }))).toEqual({
      amount: '100',
      category_ids: [],
    });
  });
});
