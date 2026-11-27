import { groupAmountInput, sanitizeAmountInput } from './amountInput';

describe('sanitizeAmountInput', () => {
  it.each([
    ['1234', '1234'],
    ['12a3-4', '1234'],
    ['1 234 567', '1234567'],
    ['12,5', '12.5'],
    ['12.345', '12.34'],
    ['1.2.3', '1.23'],
    ['.5', '0.5'],
    ['007', '7'],
    ['0.', '0.'],
    ['', ''],
    ['$1,234.567', '1.23'],
  ])('keeps "%s" as "%s"', (text, expected) => {
    expect(sanitizeAmountInput(text)).toBe(expected);
  });
});

describe('groupAmountInput', () => {
  it.each([
    ['1234567', '1 234 567'],
    ['1234567.5', '1 234 567.5'],
    ['999', '999'],
    ['1000.', '1 000.'],
    ['', ''],
  ])('shows "%s" as "%s"', (value, expected) => {
    expect(groupAmountInput(value)).toBe(expected);
  });

  it('reads back as the same amount', () => {
    expect(sanitizeAmountInput(groupAmountInput('1234567.89'))).toBe('1234567.89');
  });
});
