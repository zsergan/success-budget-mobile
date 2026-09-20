// SVG path data for the app's icon set, one path per 24x24 viewBox, rendered as a stroke-only line icon (see `Icon`).

const UI_ICON_PATHS = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 13l4 4L19 7',
  back: 'M15 5l-7 7 7 7',
  forward: 'M9 5l7 7-7 7',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M6 15l6-6 6 6',
  edit: 'M4 20h4l10-10-4-4L4 16v4zM14 6l4 4',
  trash:
    'M4 7h16M9.8 7V4.6h4.4V7M6.6 7l.9 12.3a1.4 1.4 0 0 0 1.4 1.3h6.2a1.4 1.4 0 0 0 1.4-1.3L17.4 7M10.2 10.8v6.4M13.8 10.8v6.4',
  more: 'M4.4 12a1.2 1.2 0 1 0 2.4 0 1.2 1.2 0 1 0-2.4 0M10.8 12a1.2 1.2 0 1 0 2.4 0 1.2 1.2 0 1 0-2.4 0M17.2 12a1.2 1.2 0 1 0 2.4 0 1.2 1.2 0 1 0-2.4 0',
  calendar: 'M4 6h16v14H4zM4 10h16M8 4v4M16 4v4',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z',
  'eye-off':
    'M4 4l16 16M9.6 5.4A9.6 9.6 0 0 1 12 5c6.5 0 10 6 10 6a17 17 0 0 1-3 3.6M6.3 7.7A17 17 0 0 0 2 11s3.5 6 10 6a9.9 9.9 0 0 0 3.4-.6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16 16l4.5 4.5',
  filter: 'M4 6h16M7 12h10M10 18h4',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0',
  lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.6-3.4 4.4-5 8-5s6.4 1.6 8 5',
  users:
    'M9 11.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM2.5 20c1.3-3.1 3.6-4.7 6.5-4.7s5.2 1.6 6.5 4.7M16 4.8a3.6 3.6 0 0 1 0 6.9M18 15.6c1.6.7 2.7 2.1 3.5 4.4',
  logout: 'M10 5H5v14h5M15 8l4 4-4 4M19 12H9',
  wallet: 'M4 7h14v12H4zM4 7l12-3v3M16 13h3',
  income: 'M12 5v14M6 13l6 6 6-6',
  expense: 'M12 19V5M6 11l6-6 6 6',
  transfer: 'M4 9h13l-3-3M20 15H7l3 3',
  home: 'M4 11l8-6 8 6v9h-5v-5h-6v5H4z',
  list: 'M5 7h14M5 12h14M5 17h9',
  limit: 'M4 17a8 8 0 1 1 16 0M12 17l4.5-5',
  chart: 'M4 20V9M10 20V4M16 20v-7M22 20H2',
  alert: 'M12 4l9 16H3zM12 10v4M12 17v.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.01',
  refresh: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  note: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h4',
  'trend-up': 'M12 19V5M6 11l6-6 6 6',
  'trend-down': 'M12 5v14M6 13l6 6 6-6',
} as const;

const CATEGORY_ICON_PATHS = {
  salary: 'M3 6.5h18v11H3zM14.8 12a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0M6 12h.9M17.1 12h.9',
  bonus: 'M12 3l2.5 5.2 5.5.8-4 4 1 5.6-5-2.8-5 2.8 1-5.6-4-4 5.5-.8z',
  freelance: 'M4 8h16v11H4zM9 8V6h6v2M4 13h16',
  investments: 'M3.5 19.5h17M4.5 16.2l4.4-4.7 3.3 2.8 5.8-6.4M13.8 7.9H18v4.2',
  dividends:
    'M5.5 5.9a6.5 2.4 0 1 0 13 0 6.5 2.4 0 1 0-13 0M5.5 5.9v4.2c0 1.33 2.91 2.4 6.5 2.4s6.5-1.07 6.5-2.4V5.9M5.5 10.1v4.2c0 1.33 2.91 2.4 6.5 2.4s6.5-1.07 6.5-2.4v-4.2M5.5 14.3v4.2c0 1.33 2.91 2.4 6.5 2.4s6.5-1.07 6.5-2.4v-4.2',
  refund:
    'M17.2 11V4.4l-2.2 1.3-2.2-1.3-2.2 1.3-2.2-1.3L6.2 5.7v13.6l2.2-1.3 1.6.9M9.2 8.8h5M9.2 11.8h4M20.5 17.6h-6.4M17.4 14.4l-3.4 3.2 3.4 3.2',
  grocery: 'M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 0 1 6 0v2',
  restaurant: 'M7 3v8a2.5 2.5 0 0 0 5 0V3M9.5 11v10M17 3c-1.6 1.4-2 3-2 5s.6 2.5 2 3v10',
  cafe: 'M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8zM16 9h2.5a2 2 0 0 1 0 4H16M4 21h13',
  housing: 'M4 11l8-6 8 6v9H4zM10 20v-6h4v6',
  utilities: 'M13 3l-7 10h5l-1 8 7-10h-5z',
  internet: 'M12 20h.01M8.5 16.5a5 5 0 0 1 7 0M5.5 13a9.5 9.5 0 0 1 13 0M2.5 9.5a14 14 0 0 1 19 0',
  transport: 'M7 4h10v11H7zM7 15h10M9.5 8h5M8.5 18v2M15.5 18v2',
  fuel: 'M4.5 20.2h10M6 20.2V5.6A1.6 1.6 0 0 1 7.6 4h3.8a1.6 1.6 0 0 1 1.6 1.6v14.6M6 10.2h7M15.4 8.8l2.6 2.5v5.5a1.5 1.5 0 0 0 3 0v-5.9l-2.4-2.8',
  car: 'M3.5 16.4h17v-3.1a1.6 1.6 0 0 0-1.1-1.5l-2.1-.7-1.9-2.5a2 2 0 0 0-1.6-.8H9.2a2 2 0 0 0-1.6.8l-1.9 2.5-2.1.7a1.6 1.6 0 0 0-1.1 1.5v3.1zM6.2 11.1h11.6M7.6 16.4v1.9M16.4 16.4v1.9',
  taxi: 'M3.5 16.4h17v-3.1a1.6 1.6 0 0 0-1.1-1.5l-2.1-.7-1.9-2.5a2 2 0 0 0-1.6-.8H9.2a2 2 0 0 0-1.6.8l-1.9 2.5-2.1.7a1.6 1.6 0 0 0-1.1 1.5v3.1zM6.2 11.1h11.6M7.6 16.4v1.9M16.4 16.4v1.9M9.2 7.8V5.2h5.6v2.6M11.1 5.2v2.6M12.9 5.2v2.6',
  health: 'M12 20s-7-4.4-7-9a3.8 3.8 0 0 1 7-2 3.8 3.8 0 0 1 7 2c0 4.6-7 9-7 9z',
  pharmacy: 'M6 8h12v12H6zM10 4h4v4h-4zM12 11v6M9 14h6',
  fitness: 'M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8',
  beauty:
    'M9.6 3.4h4.8v3.2H9.6zM8.4 6.6h7.2a1.2 1.2 0 0 1 1.2 1.2v11.6a1.2 1.2 0 0 1-1.2 1.2H8.4a1.2 1.2 0 0 1-1.2-1.2V7.8a1.2 1.2 0 0 1 1.2-1.2zM9.8 10.4h4.4',
  clothes: 'M9 4l3 2 3-2 5 3-2 4-2-1v10H8V10L6 11 4 7z',
  electronics: 'M4 5h16v11H4zM9 20h6M12 16v4',
  'home-goods': 'M5 10l7-6 7 6v10H5zM9 20v-6h6v6',
  education: 'M3 8l9-4 9 4-9 4zM7 11v5c0 1.5 2.4 3 5 3s5-1.5 5-3v-5',
  kids: 'M12 9.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8zM12 9.2v1.5M4.5 15.4a7.5 3.7 0 1 0 15 0 7.5 3.7 0 1 0-15 0M9.3 15.4a2.7 2.7 0 1 0 5.4 0 2.7 2.7 0 1 0-5.4 0',
  pets: 'M6.5 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17.5 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 21c-3 0-5-1.8-5-4.2 0-2.6 2.2-4.8 5-4.8s5 2.2 5 4.8C17 19.2 15 21 12 21z',
  travel:
    'M12 3.2c.9 0 1.5 1.1 1.5 2.6v3.4l6.9 4v2.2l-6.9-2v3.9l2.2 1.6v1.5L12 19.5l-3.7.9v-1.5l2.2-1.6v-3.9l-6.9 2v-2.2l6.9-4V5.8c0-1.5.6-2.6 1.5-2.6z',
  entertainment:
    'M3.6 9.6h16.8V19a1.5 1.5 0 0 1-1.5 1.5H5.1A1.5 1.5 0 0 1 3.6 19V9.6zM3.9 9.6l.8-3.4 15.4 2.3-.3 1.1M7.7 6.7l1.6 2.6M12 7.3l1.6 2.6M16.3 7.9l1.6 2.6',
  subscriptions: 'M4 6h16v12H4zM10 10l5 2-5 2z',
  gifts:
    'M4 10h16v4H4zM5.5 14h13v6h-13zM12 10v10M12 10C9.2 10 8 9.2 8 7.9S9.6 5.4 12 10zM12 10c2.8 0 4-.8 4-2.1S14.4 5.4 12 10z',
  charity:
    'M12 3.4a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6zM3.6 14.6l2.7-1.3a3 3 0 0 1 1.3-.3h3.5a1.35 1.35 0 0 1 0 2.7H9M3.6 14.6v5.2l3.1-.8 5.6 1.5a3 3 0 0 0 1.9-.2l5.5-2.7a1.45 1.45 0 0 0-1.2-2.6l-4 1.6',
  fees: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM8.8 15.2l6.4-6.4M8.3 9.3a1.2 1.2 0 1 0 2.4 0 1.2 1.2 0 1 0-2.4 0M13.3 14.7a1.2 1.2 0 1 0 2.4 0 1.2 1.2 0 1 0-2.4 0',
  taxes: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  savings: 'M5 12a7 7 0 0 1 14 0v6H5zM9 9h.01M5 15H3M19 15h2M12 4V2',
  other:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.7M11.4 17a.6.6 0 1 0 1.2 0 .6.6 0 1 0-1.2 0',
} as const;

// Old icon names aliased to a current path — category rows saved under the old names (unvalidated backend data) must still render.
const LEGACY_ICON_ALIASES: Record<string, keyof typeof UI_ICON_PATHS | keyof typeof CATEGORY_ICON_PATHS> = {
  add: 'plus',
  email: 'mail',
  error: 'alert',
  person: 'user',
  delete: 'trash',
  interests: 'other',
  'data-usage': 'limit',
  visibility: 'eye',
  'arrow-back': 'back',
  'visibility-off': 'eye-off',
  'sentiment-neutral': 'limit',
  'keyboard-arrow-right': 'forward',
  'arrow-outward': 'expense',
  'arrow-downward': 'income',
  paid: 'salary',
  store: 'grocery',
  money: 'savings',
  flight: 'travel',
  cable: 'internet',
  school: 'education',
  healing: 'health',
  category: 'other',
  fastfood: 'restaurant',
  checkroom: 'clothes',
  'water-drop': 'utilities',
  'directions-bus': 'transport',
  'directions-car': 'car',
  'sports-esports': 'entertainment',
  'shopping-basket': 'grocery',
  'card-giftcard': 'gifts',
};

export const ICON_PATHS: Record<string, string> = {
  ...UI_ICON_PATHS,
  ...CATEGORY_ICON_PATHS,
};

for (const [legacyName, currentName] of Object.entries(LEGACY_ICON_ALIASES)) {
  ICON_PATHS[legacyName] = ICON_PATHS[currentName];
}

export type UiIconName = keyof typeof UI_ICON_PATHS;
export type CategoryIconName = keyof typeof CATEGORY_ICON_PATHS;

// Picker order for the category icon grid — expense icons first, income icons last (matches the design's PICKER_ICONS ordering).
export const CATEGORY_ICON_LIST: CategoryIconName[] = [
  'grocery',
  'restaurant',
  'cafe',
  'housing',
  'utilities',
  'internet',
  'transport',
  'fuel',
  'car',
  'taxi',
  'health',
  'pharmacy',
  'fitness',
  'beauty',
  'clothes',
  'electronics',
  'home-goods',
  'education',
  'kids',
  'pets',
  'travel',
  'entertainment',
  'subscriptions',
  'gifts',
  'charity',
  'fees',
  'taxes',
  'savings',
  'salary',
  'bonus',
  'freelance',
  'investments',
  'dividends',
  'refund',
  'other',
];
