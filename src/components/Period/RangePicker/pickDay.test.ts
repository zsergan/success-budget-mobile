import { pickDay } from './pickDay';

const current = { from: new Date(2026, 7, 1), to: new Date(2026, 7, 31, 23, 59, 59, 999) };

describe('pickDay', () => {
  it('turns a picked From into a Custom range and moves on to To', () => {
    expect(pickDay(current, 'from', new Date(2026, 7, 10, 12))).toEqual({
      period: { kind: 'custom', from: new Date(2026, 7, 10), to: current.to },
      nextField: 'to',
    });
  });

  it('pulls To along when From passes it', () => {
    expect(pickDay(current, 'from', new Date(2026, 8, 5)).period).toEqual({
      kind: 'custom',
      from: new Date(2026, 8, 5),
      to: new Date(2026, 8, 5, 23, 59, 59, 999),
    });
  });

  it('swaps the ends when To lands before From', () => {
    expect(pickDay(current, 'to', new Date(2026, 6, 20))).toEqual({
      period: { kind: 'custom', from: new Date(2026, 6, 20), to: new Date(2026, 7, 1, 23, 59, 59, 999) },
      nextField: 'from',
    });
  });
});
