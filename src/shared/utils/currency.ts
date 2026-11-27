import { getLocales } from 'expo-localization';

export interface CurrencyAffixes {
  prefix: string;
  suffix: string;
}

const affixCache = new Map<string, CurrencyAffixes>();

// The currency's own symbol and side, e.g. "$" before or " kr" after; the code if the device can't tell.
export const getCurrencyAffixes = (currency: string): CurrencyAffixes => {
  let affixes = affixCache.get(currency);
  if (affixes) return affixes;

  try {
    const sample = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(0);
    const [prefix, suffix = ''] = sample.split(/0[.,]?0*/);
    affixes = { prefix, suffix };
  } catch {
    affixes = { prefix: `${currency} `, suffix: '' };
  }

  affixCache.set(currency, affixes);
  return affixes;
};

// The symbol alone, for a label beside an amount field or a badge: "$", "€", "kr".
export const currencySymbol = (currency: string) => {
  const { prefix, suffix } = getCurrencyAffixes(currency);

  return (prefix || suffix).trim();
};

// Puts the symbol around a formatted amount, after its sign: "-$75.00", "+€12.50", "100.00 kr".
export const withCurrencySymbol = (text: string, currency?: string) => {
  if (!currency) return text;

  const { prefix, suffix } = getCurrencyAffixes(currency);
  const sign = /^[-+−]/.test(text) ? text[0] : '';

  return `${sign}${prefix}${text.slice(sign.length)}${suffix}`;
};

// The currency of the phone's region ("RUB" in Russia), or null when the device does not say.
export const deviceCurrencyCode = (): string | null => {
  try {
    return getLocales().find((locale) => locale.currencyCode)?.currencyCode ?? null;
  } catch {
    return null;
  }
};

const FALLBACK_CURRENCY = 'USD';

// What a new space starts with: the region's currency when it is offered, else US dollars, else the first one.
export const pickDefaultCurrency = <T extends { code: string }>(currencies: T[], regionCode = deviceCurrencyCode()) =>
  currencies.find((currency) => currency.code === regionCode) ??
  currencies.find((currency) => currency.code === FALLBACK_CURRENCY) ??
  currencies[0];

// The currencies a picker lists: the suggested ones first, in that order, then the rest by name.
export const orderCurrencies = <T extends { code: string; name: string }>(currencies: T[], suggested: string[]) => {
  const rank = (code: string) => {
    const index = suggested.indexOf(code);
    return index === -1 ? suggested.length : index;
  };

  return [...currencies].sort((a, b) => rank(a.code) - rank(b.code) || a.name.localeCompare(b.name));
};

// Matches a search on the code, the name or the symbol, ignoring case.
export const matchesCurrency = (currency: { code: string; name: string }, query: string) => {
  const text = query.trim().toLowerCase();
  if (!text) return true;

  return [currency.code, currency.name, currencySymbol(currency.code)].some((part) =>
    part.toLowerCase().includes(text),
  );
};
