import { TransactionType } from '@shared/enums';
import { formatAmount, formatMoneyAmount, formatSignedAmount } from './transform';

describe('formatMoneyAmount', () => {
  it('always shows two decimal places', () => {
    expect(formatMoneyAmount('12', 'USD')).toBe('12.00 USD');
    expect(formatMoneyAmount('1234.5', 'USD')).toBe('1 234.50 USD');
    expect(formatMoneyAmount(0.1)).toBe('0.10');
  });

  it('keeps every cent of a total past the precision of a number', () => {
    expect(formatMoneyAmount('98765432109876543.21', 'USD')).toBe('98 765 432 109 876 543.21 USD');
    expect(formatMoneyAmount('-90071992547409.99')).toBe('-90 071 992 547 409.99');
  });

  it('shows a negative zero as zero', () => {
    expect(formatMoneyAmount('-0.00')).toBe('0.00');
  });
});

describe('formatAmount', () => {
  it('signs income with + and expense with -', () => {
    expect(formatAmount('850', TransactionType.INCOME, 'USD')).toBe('+850.00 USD');
    expect(formatAmount('84.2', TransactionType.EXPENSE, 'USD')).toBe('-84.20 USD');
  });
});

describe('formatSignedAmount', () => {
  it('prefixes a positive total with +', () => {
    expect(formatSignedAmount(1200, 'USD')).toBe('+1 200.00 USD');
  });

  it('prefixes a negative total with - and drops the raw minus', () => {
    expect(formatSignedAmount(-56.5, 'USD')).toBe('-56.50 USD');
  });

  it('shows zero without a sign', () => {
    expect(formatSignedAmount(0, 'USD')).toBe('0.00 USD');
  });

  it('signs a server total from its text without losing cents', () => {
    expect(formatSignedAmount('12345678901234567.89', 'USD')).toBe('+12 345 678 901 234 567.89 USD');
    expect(formatSignedAmount('-31.50', 'USD')).toBe('-31.50 USD');
    expect(formatSignedAmount('0.00', 'USD')).toBe('0.00 USD');
  });

  it('omits the currency when there is none', () => {
    expect(formatSignedAmount(-56)).toBe('-56.00');
  });
});
