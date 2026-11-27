// What a typed or pasted amount keeps: digits and one decimal point (a comma counts as one), at most two places
// after it, and no leading zeros before other digits. "1 234,567" becomes "1234.56".
export const sanitizeAmountInput = (text: string) => {
  const cleaned = text.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const point = cleaned.indexOf('.');
  const whole = (point === -1 ? cleaned : cleaned.slice(0, point)).replace(/^0+(?=\d)/, '');

  if (point === -1) return whole;

  const fraction = cleaned
    .slice(point + 1)
    .replace(/\./g, '')
    .slice(0, 2);

  return `${whole || '0'}.${fraction}`;
};

// The same amount with its thousands set apart by spaces, as the app shows money: "1234567.5" reads "1 234 567.5".
export const groupAmountInput = (value: string) => {
  const [whole, ...rest] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return rest.length ? `${grouped}.${rest.join('')}` : grouped;
};
