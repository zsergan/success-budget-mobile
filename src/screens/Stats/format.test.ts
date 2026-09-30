import {
  formatChange,
  formatComparisonLabel,
  formatDayMonth,
  formatMoney,
  formatPeriodWord,
  getMoneySign,
} from './format';

const now = new Date(2026, 8, 30, 12);

describe('formatMoney', () => {
  it('groups the digits of the string exactly', () => {
    expect(formatMoney('1234567890123.45', 'USD')).toBe('$1,234,567,890,123.45');
    expect(formatMoney('0.10', 'USD')).toBe('$0.10');
    expect(formatMoney('486.3', 'USD')).toBe('$486.30');
  });

  it('signs only when asked, with a real minus and no sign on zero', () => {
    expect(formatMoney('-510.50', 'USD')).toBe('$510.50');
    expect(formatMoney('-510.50', 'USD', { signed: true })).toBe('−$510.50');
    expect(formatMoney('1185.60', 'USD', { signed: true })).toBe('+$1,185.60');
    expect(formatMoney('0.00', 'USD', { signed: true })).toBe('$0.00');
    expect(formatMoney('-0.00', 'USD', { signed: true })).toBe('$0.00');
  });

  it("uses the currency's own symbol", () => {
    expect(formatMoney('10.00', 'EUR')).toBe('€10.00');
  });
});

describe('getMoneySign', () => {
  it('reads the sign from the string', () => {
    expect(getMoneySign('12.00')).toBe(1);
    expect(getMoneySign('-0.01')).toBe(-1);
    expect(getMoneySign('0.00')).toBe(0);
    expect(getMoneySign('-0.00')).toBe(0);
  });
});

describe('formatChange', () => {
  it('colors a rise by what it means for the figure', () => {
    expect(formatChange({ delta: '434.00', percent: 12.0 }, 'income')).toEqual({
      text: '+12%',
      tone: 'good',
      hasPercent: true,
    });
    expect(formatChange({ delta: '110.40', percent: 4.0 }, 'expense')).toEqual({
      text: '+4%',
      tone: 'bad',
      hasPercent: true,
    });
    expect(formatChange({ delta: '-13.70', percent: -26.2 }, 'expense').text).toBe('−26%');
  });

  it('keeps an unchanged figure neutral', () => {
    expect(formatChange({ delta: '0.00', percent: 0.3 }, 'income')).toEqual({
      text: '0%',
      tone: 'neutral',
      hasPercent: true,
    });
  });

  it('shows No comparison for a zero base', () => {
    expect(formatChange({ delta: '1700.00', percent: null }, 'income')).toEqual({
      text: 'No comparison',
      tone: 'neutral',
      hasPercent: false,
    });
  });
});

describe('formatComparisonLabel', () => {
  const zone = 'Europe/Moscow';

  it('names the days of a like-for-like cut in the period zone', () => {
    expect(
      formatComparisonLabel(
        { type: 'month', start_date: '2026-09-01', time_zone: zone },
        {
          start_date: '2026-08-01',
          end_date: '2026-08-31',
          to: '2026-08-31T20:59:59.999Z',
          actual_to: '2026-08-28T12:00:00.000Z',
        },
      ),
    ).toBe('vs 1–28 Aug');
  });

  it('names a whole previous month or year', () => {
    expect(
      formatComparisonLabel(
        { type: 'month', start_date: '2026-08-01', time_zone: zone },
        { start_date: '2026-07-01', end_date: '2026-07-31', to: 'x', actual_to: 'x' },
      ),
    ).toBe('vs July');
    expect(
      formatComparisonLabel(
        { type: 'month', start_date: '2026-01-01', time_zone: zone },
        { start_date: '2025-12-01', end_date: '2025-12-31', to: 'x', actual_to: 'x' },
      ),
    ).toBe('vs December 2025');
    expect(
      formatComparisonLabel(
        { type: 'year', start_date: '2025-01-01', time_zone: zone },
        { start_date: '2024-01-01', end_date: '2024-12-31', to: 'x', actual_to: 'x' },
      ),
    ).toBe('vs 2024');
  });

  it('names a whole week by its days and a cut year with its year', () => {
    expect(
      formatComparisonLabel(
        { type: 'week', start_date: '2026-09-07', time_zone: zone },
        { start_date: '2026-08-31', end_date: '2026-09-06', to: 'x', actual_to: 'x' },
      ),
    ).toBe('vs 31 Aug – 6 Sep');
    expect(
      formatComparisonLabel(
        { type: 'year', start_date: '2026-01-01', time_zone: zone },
        {
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          to: '2025-12-31T20:59:59.999Z',
          actual_to: '2025-09-28T12:00:00.000Z',
        },
      ),
    ).toBe('vs 1 Jan – 28 Sep 2025');
  });
});

describe('formatPeriodWord', () => {
  it('names months and years, and gives other periods their days', () => {
    expect(formatPeriodWord({ type: 'month', start_date: '2026-09-01', end_date: '2026-09-30' }, now)).toBe(
      'September',
    );
    expect(formatPeriodWord({ type: 'month', start_date: '2025-08-01', end_date: '2025-08-31' }, now)).toBe(
      'August 2025',
    );
    expect(formatPeriodWord({ type: 'year', start_date: '2026-01-01', end_date: '2026-12-31' }, now)).toBe('2026');
    expect(formatPeriodWord({ type: 'week', start_date: '2026-09-28', end_date: '2026-10-04' }, now)).toBe(
      '28 Sep – 4 Oct',
    );
    expect(formatPeriodWord({ type: 'custom', start_date: '2026-07-01', end_date: '2026-09-28' }, now)).toBe(
      '1 Jul – 28 Sep',
    );
  });
});

describe('formatDayMonth', () => {
  it('adds the year only outside the current one', () => {
    expect(formatDayMonth('2026-08-29', now)).toBe('29 Aug');
    expect(formatDayMonth('2025-08-29', now)).toBe('29 Aug 2025');
  });
});
