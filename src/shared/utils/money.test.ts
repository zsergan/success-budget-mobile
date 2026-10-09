import { toCents } from './money';

describe('toCents', () => {
  it.each([
    ['12.30', 1230],
    ['0.1', 10],
    ['99999999.99', 9999999999],
    [150.1, 15010],
    [0.29, 29],
    ['-5', -500],
  ])('reads %j as %d cents', (value, cents) => {
    expect(toCents(value)).toBe(cents);
  });

  it('refuses what is not a two-place amount', () => {
    expect(toCents('1.234')).toBeNaN();
    expect(toCents('abc')).toBeNaN();
  });
});
