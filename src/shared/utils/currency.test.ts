import { currencySymbol, matchesCurrency, orderCurrencies, pickDefaultCurrency, withCurrencySymbol } from './currency';

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

const CURRENCIES = [
  { id: 1, code: 'USD', name: 'US Dollar' },
  { id: 2, code: 'EUR', name: 'Euro' },
  { id: 3, code: 'RUB', name: 'Russian Ruble' },
  { id: 4, code: 'AMD', name: 'Armenian Dram' },
];

describe('the default currency', () => {
  it('is the phone region’s when it is offered', () => {
    expect(pickDefaultCurrency(CURRENCIES, 'RUB')?.code).toBe('RUB');
  });

  it('falls back to US dollars, then to the first currency', () => {
    expect(pickDefaultCurrency(CURRENCIES, 'XYZ')?.code).toBe('USD');
    expect(pickDefaultCurrency(CURRENCIES, null)?.code).toBe('USD');
    expect(pickDefaultCurrency(CURRENCIES.slice(1), null)?.code).toBe('EUR');
  });
});

describe('the currency list', () => {
  it('puts the suggested currencies first, in order, then the rest by name', () => {
    expect(orderCurrencies(CURRENCIES, ['RUB', 'USD']).map(({ code }) => code)).toEqual(['RUB', 'USD', 'AMD', 'EUR']);
  });

  it('matches a search on the code, the name or the symbol', () => {
    expect(CURRENCIES.filter((currency) => matchesCurrency(currency, 'eu')).map(({ code }) => code)).toEqual(['EUR']);
    expect(CURRENCIES.filter((currency) => matchesCurrency(currency, 'rub')).map(({ code }) => code)).toEqual(['RUB']);
    expect(CURRENCIES.filter((currency) => matchesCurrency(currency, '€')).map(({ code }) => code)).toEqual(['EUR']);
    expect(CURRENCIES.filter((currency) => matchesCurrency(currency, '  ')).length).toBe(4);
  });
});
