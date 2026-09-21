import { formatSignedAmount } from './transform';

describe('formatSignedAmount', () => {
  it('prefixes a positive total with +', () => {
    expect(formatSignedAmount(1200, 'USD')).toBe('+1 200 USD');
  });

  it('prefixes a negative total with - and drops the raw minus', () => {
    expect(formatSignedAmount(-56, 'USD')).toBe('-56 USD');
  });

  it('treats zero as positive rather than showing -0', () => {
    expect(formatSignedAmount(0, 'USD')).toBe('+0 USD');
  });

  it('omits the currency when there is none', () => {
    expect(formatSignedAmount(-56)).toBe('-56');
  });
});
