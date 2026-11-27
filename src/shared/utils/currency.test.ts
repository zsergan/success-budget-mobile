import { currencySymbol, withCurrencySymbol } from './currency';

describe('currency symbols', () => {
  it('reads the narrow symbol of a currency', () => {
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('EUR')).toBe('€');
    expect(currencySymbol('GBP')).toBe('£');
  });

  it('falls back to the code for one the device cannot format', () => {
    expect(currencySymbol('??')).toBe('??');
    expect(withCurrencySymbol('12.00', '??')).toBe('?? 12.00');
  });

  it('puts the symbol after the sign of an amount', () => {
    expect(withCurrencySymbol('-75.00', 'USD')).toBe('-$75.00');
    expect(withCurrencySymbol('+2 400.00', 'EUR')).toBe('+€2 400.00');
    expect(withCurrencySymbol('0.00', 'USD')).toBe('$0.00');
    expect(withCurrencySymbol('12.00')).toBe('12.00');
  });
});
