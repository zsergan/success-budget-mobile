import { TransactionType } from '@shared/enums';
import { formatAmount, formatMoneyAmount, formatSignedAmount } from './transform';

describe('formatMoneyAmount', () => {
  it('always shows two decimal places', () => {
    expect(formatMoneyAmount('12', 'USD')).toBe('12.00 USD');
    expect(formatMoneyAmount('1234.5', 'USD')).toBe('1 234.50 USD');
    expect(formatMoneyAmount(0.1)).toBe('0.10');
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

  it('omits the currency when there is none', () => {
    expect(formatSignedAmount(-56)).toBe('-56.00');
  });
});
