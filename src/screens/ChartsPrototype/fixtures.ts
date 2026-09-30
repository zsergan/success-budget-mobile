import { AppColor } from '@shared/enums';

export interface TrendGroup {
  label: string;
  sub: string;
  dates: string;
  income: number | null;
  expense: number | null;
  isCurrent?: boolean;
}

export interface BreakdownGroup {
  name: string;
  amount: number;
  color: AppColor | 'other';
}

export interface TrendScenario {
  title: string;
  groups: TrendGroup[];
}

export interface DonutScenario {
  title: string;
  groups: BreakdownGroup[];
}

const week = (days: string[], subs: string[], values: [number | null, number | null][], current = -1) =>
  days.map((label, k) => ({
    label,
    sub: subs[k],
    dates: `${label} ${subs[k]}`,
    income: values[k][0],
    expense: values[k][1],
    isCurrent: k === current,
  }));

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const TREND_SCENARIOS: TrendScenario[] = [
  {
    title: 'Month · 5 weeks',
    groups: [
      { label: 'W1', sub: '1–6', dates: '1–6 Sep 2026', income: 3200, expense: 742.1 },
      { label: 'W2', sub: '7–13', dates: '7–13 Sep 2026', income: 0, expense: 588.4 },
      { label: 'W3', sub: '14–20', dates: '14–20 Sep 2026', income: 0, expense: 613.2 },
      { label: 'W4', sub: '21–27', dates: '21–27 Sep 2026', income: 850, expense: 882.1 },
      { label: 'W5', sub: '28–30', dates: '28–30 Sep 2026', income: 0, expense: 38.6, isCurrent: true },
    ],
  },
  {
    title: 'Month · 6 weeks',
    groups: [
      { label: 'W1', sub: '1–2', dates: '1–2 Aug 2026', income: 0, expense: 84.2 },
      { label: 'W2', sub: '3–9', dates: '3–9 Aug 2026', income: 3200, expense: 1612.4 },
      { label: 'W3', sub: '10–16', dates: '10–16 Aug 2026', income: 0, expense: 486.1 },
      { label: 'W4', sub: '17–23', dates: '17–23 Aug 2026', income: 0, expense: 402.55 },
      { label: 'W5', sub: '24–30', dates: '24–30 Aug 2026', income: 850, expense: 478.3 },
      { label: 'W6', sub: '31', dates: '31 Aug 2026', income: 0, expense: 43.2 },
    ],
  },
  {
    title: 'Week · future days',
    groups: week(
      DOW,
      ['28', '29', '30', '1', '2', '3', '4'],
      [
        [0, 38.6],
        [null, null],
        [null, null],
        [null, null],
        [null, null],
        [null, null],
        [null, null],
      ],
      0,
    ),
  },
  {
    title: 'Week · zero Wednesday',
    groups: week(
      DOW,
      ['14', '15', '16', '17', '18', '19', '20'],
      [
        [0, 84.1],
        [0, 22.4],
        [0, 0],
        [0, 312],
        [0, 96.3],
        [0, 58.4],
        [0, 40],
      ],
    ),
  },
  {
    title: 'Week · all zero',
    groups: week(
      DOW,
      ['7', '8', '9', '10', '11', '12', '13'],
      DOW.map(() => [0, 0]),
    ),
  },
  {
    title: 'Custom · 14 weeks',
    groups: (
      [
        ['1', 'Jul', '1–5 Jul', 0, 312.4],
        ['6', '', '6–12 Jul', 3200, 1580.2],
        ['13', '', '13–19 Jul', 0, 498.7],
        ['20', '', '20–26 Jul', 0, 522.3],
        ['27', '', '27 Jul – 2 Aug', 850, 510.7],
        ['3', 'Aug', '3–9 Aug', 3200, 1612.4],
        ['10', '', '10–16 Aug', 0, 486.1],
        ['17', '', '17–23 Aug', 0, 402.55],
        ['24', '', '24–30 Aug', 850, 478.3],
        ['31', '', '31 Aug – 6 Sep', 3200, 785.3],
        ['7', 'Sep', '7–13 Sep', 0, 588.4],
        ['14', '', '14–20 Sep', 0, 613.2],
        ['21', '', '21–27 Sep', 850, 882.1],
        ['28', '', '28 Sep', 0, 38.6],
      ] as const
    ).map(([label, sub, dates, income, expense], k) => ({ label, sub, dates, income, expense, isCurrent: k === 13 })),
  },
  {
    title: 'Year · future months',
    groups: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((label, k) => ({
      label,
      sub: '',
      dates: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][k]} 2026`,
      income: k > 8 ? null : [3200, 3200, 4050, 3200, 3800, 3200, 4200, 3200, 4050][k],
      expense: k > 8 ? null : [2980, 2740, 3310, 2890, 3420, 3120, 3650, 3080, 2864.4][k],
      isCurrent: k === 8,
    })),
  },
  {
    title: 'Month · all future',
    groups: [
      ['W1', '1–7'],
      ['W2', '8–14'],
      ['W3', '15–21'],
      ['W4', '22–28'],
    ].map(([label, sub]) => ({ label, sub, dates: `${sub} Feb 2027`, income: null, expense: null })),
  },
];

const { SLATE, AMBER, EVERGREEN, INDIGO, CLAY, PLUM } = AppColor;

export const DONUT_SCENARIOS: DonutScenario[] = [
  {
    title: '7 segments · shared tokens',
    groups: [
      { name: 'Housing', amount: 3750, color: SLATE },
      { name: 'Groceries', amount: 1592.1, color: EVERGREEN },
      { name: 'Restaurants', amount: 1030.4, color: CLAY },
      { name: 'Transportation', amount: 712.3, color: INDIGO },
      { name: 'Travel', amount: 620, color: INDIGO },
      { name: 'Subscriptions', amount: 494.67, color: PLUM },
      { name: 'Other', amount: 1111.78, color: 'other' },
    ],
  },
  {
    title: 'Month · 7 segments',
    groups: [
      { name: 'Housing', amount: 1250, color: SLATE },
      { name: 'Groceries', amount: 486.3, color: EVERGREEN },
      { name: 'Restaurants', amount: 312.8, color: CLAY },
      { name: 'Transportation', amount: 244.5, color: INDIGO },
      { name: 'Subscriptions', amount: 164.89, color: PLUM },
      { name: 'Kids & School Supply', amount: 135, color: AMBER },
      { name: 'Other', amount: 270.91, color: 'other' },
    ],
  },
  {
    title: 'One category · 100%',
    groups: [{ name: 'Housing', amount: 1250, color: SLATE }],
  },
  {
    title: 'Dominant + slivers',
    groups: [
      { name: 'Housing', amount: 11250, color: SLATE },
      { name: 'Cafe', amount: 12.4, color: AMBER },
      { name: 'Gifts', amount: 4, color: CLAY },
    ],
  },
];
