import { amountSchema, positiveAmountSchema } from './validation';

describe('amountSchema', () => {
  it('accepts a plain integer', async () => {
    await expect(amountSchema.validate('100')).resolves.toBe('100');
  });

  it('accepts a dot as the decimal separator', async () => {
    await expect(amountSchema.validate('99.5')).resolves.toBe('99.5');
  });

  it('normalizes a comma decimal separator to a dot', async () => {
    await expect(amountSchema.validate('99,5')).resolves.toBe('99.5');
  });

  it('rejects input with more than one decimal separator', async () => {
    await expect(amountSchema.validate('1,234,56')).rejects.toThrow('Enter a valid number');
  });

  it('rejects non-numeric input instead of letting it become NaN', async () => {
    await expect(amountSchema.validate('abc')).rejects.toThrow('Enter a valid number');
  });

  it('rejects "Infinity" -- Number.isNaN alone would have let this through', async () => {
    await expect(amountSchema.validate('Infinity')).rejects.toThrow('Enter a valid number');
    await expect(amountSchema.validate('-Infinity')).rejects.toThrow('Enter a valid number');
  });

  it('rejects an empty string', async () => {
    await expect(amountSchema.validate('')).rejects.toThrow();
  });

  it('rejects whitespace-only input', async () => {
    await expect(amountSchema.validate('   ')).rejects.toThrow('Enter a valid number');
  });
});

describe('positiveAmountSchema', () => {
  it('accepts a normal positive amount', async () => {
    await expect(positiveAmountSchema.validate('12.50')).resolves.toBe('12.50');
  });

  it('rejects zero -- unlike plain amountSchema, which must allow it for a starting wallet balance', async () => {
    await expect(amountSchema.validate('0')).resolves.toBe('0');
    await expect(positiveAmountSchema.validate('0')).rejects.toThrow('Enter an amount greater than zero');
  });

  it('rejects a negative amount', async () => {
    await expect(positiveAmountSchema.validate('-5')).rejects.toThrow('Enter an amount greater than zero');
  });
});
