import { amountSchema } from './validation';

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
    // The old code sent .replace(',', '.') straight to the request with no
    // validation at all, so malformed input like this reached the backend
    // as-is. amountSchema now catches it client-side regardless of which
    // separator produced the second dot.
    await expect(amountSchema.validate('1,234,56')).rejects.toThrow('Enter a valid number');
  });

  it('rejects non-numeric input instead of letting it become NaN', async () => {
    await expect(amountSchema.validate('abc')).rejects.toThrow('Enter a valid number');
  });

  it('rejects an empty string', async () => {
    await expect(amountSchema.validate('')).rejects.toThrow();
  });

  it('rejects whitespace-only input', async () => {
    await expect(amountSchema.validate('   ')).rejects.toThrow('Enter a valid number');
  });
});
