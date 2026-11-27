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
