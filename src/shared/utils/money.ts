// Exact cents of a decimal string ("12.30") or of a two-place number from the API, so money is only ever added as
// integers. NaN for anything else.
export const toCents = (value: string | number): number => {
  const text = typeof value === 'number' ? value.toFixed(2) : value.trim();
  const match = text.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) return NaN;

  const cents = Number(match[2]) * 100 + Number((match[3] ?? '').padEnd(2, '0'));

  return match[1] ? -cents : cents;
};
