import { AppColor } from '@shared/enums';
import theme, { colorScheme } from '@shared/theme';
import { resolveApiBaseUrl } from '@shared/utils/apiBaseUrl';

const API_BASE_URLS = {
  local: 'http://localhost:3000/api/v1',
  dev: 'https://success-budget-backend-staging-x3dqf.ondigitalocean.app/api/v1',
  prod: null,
};

// Expo inlines EXPO_PUBLIC_* only when read as `process.env.NAME`, so pass them in rather than read them in the helper.
export const BASE_API_URL = resolveApiBaseUrl({
  urls: API_BASE_URLS,
  env: process.env.EXPO_PUBLIC_API_ENV,
  overrideUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  isDevBuild: __DEV__,
});
export const AUTH_TOKEN_KEY = 'sbm-AUTH_TOKEN_KEY';
export const BALANCE_HIDDEN_KEY = 'sbm-BALANCE_HIDDEN';
export const THEME_PREFERENCE_KEY = 'sbm-THEME_PREFERENCE';

// Mirrors the backend's temporary SPACE_LIMITS (success-budget-backend/src/shared/constants.ts) — not a considered business rule, revisit if the backend's changes.
export const SPACE_LIMITS = {
  MAX_MEMBERS_PER_SPACE: 20,
  MAX_PENDING_INVITES_PER_SPACE: 10,
};

export const INVITE_EXPIRY_DAYS = 7;

// The invite endpoint is rate-limited to 5/60s on the backend via
// ThrottlerGuard, which does send a Retry-After header -- prefer
// `error.retryAfterMs` (see getRejectValue) and only fall back to this
// fixed window when the header is missing or unparsable.
export const INVITE_RATE_LIMIT_COOLDOWN_MS = 60_000;

// Wallet-card gradient presets, paired per color scheme like the rest of the theme (angle/stops in WalletGradientBackground.tsx).
const walletGradientsByScheme: Record<'light' | 'dark', Record<AppColor, [string, string]>> = {
  light: {
    [AppColor.SLATE]: ['#2f3a4b', '#1d2430'],
    [AppColor.AMBER]: ['#c07d10', '#8a5406'],
    [AppColor.EVERGREEN]: ['#24614a', '#123528'],
    [AppColor.INDIGO]: ['#36428a', '#1e2450'],
    [AppColor.CLAY]: ['#984034', '#5e2419'],
    [AppColor.PLUM]: ['#66305f', '#3a1a36'],
  },
  dark: {
    [AppColor.SLATE]: ['#1a2230', '#0f1520'],
    [AppColor.AMBER]: ['#5d3a05', '#331f02'],
    [AppColor.EVERGREEN]: ['#12352a', '#0a1e18'],
    [AppColor.INDIGO]: ['#1c2250', '#111533'],
    [AppColor.CLAY]: ['#5a231a', '#33130e'],
    [AppColor.PLUM]: ['#3a1a36', '#220f20'],
  },
};

export const gradients: Record<AppColor, [string, string]> = walletGradientsByScheme[colorScheme];

/**
 * Foreground (`fg`) / secondary (`dim`) text colors per wallet gradient
 * preset, plus `inner` — the translucent tint behind the Income/Expense
 * boxes inside the card (design stage 7, `Home Stage 2.dc.html`).
 */
const walletTextColorsByScheme: Record<
  'light' | 'dark',
  Record<AppColor, { fg: string; dim: string; inner: string }>
> = {
  light: {
    [AppColor.SLATE]: { fg: '#fdfdfe', dim: '#a6b1c1', inner: 'rgba(253,253,254,.09)' },
    [AppColor.AMBER]: { fg: '#fffaf0', dim: '#f0d5a6', inner: 'rgba(255,250,240,.14)' },
    [AppColor.EVERGREEN]: { fg: '#f2fbf6', dim: '#9cc9b4', inner: 'rgba(242,251,246,.12)' },
    [AppColor.INDIGO]: { fg: '#f4f5ff', dim: '#a8afdd', inner: 'rgba(244,245,255,.12)' },
    [AppColor.CLAY]: { fg: '#fff5f2', dim: '#e0b0a4', inner: 'rgba(255,245,242,.13)' },
    [AppColor.PLUM]: { fg: '#fdf3fc', dim: '#cfa8c9', inner: 'rgba(253,243,252,.13)' },
  },
  dark: {
    [AppColor.SLATE]: { fg: '#f2f4f8', dim: '#8794a8', inner: 'rgba(255,176,32,.12)' },
    [AppColor.AMBER]: { fg: '#ffe6b8', dim: '#c69a52', inner: 'rgba(255,200,107,.14)' },
    [AppColor.EVERGREEN]: { fg: '#d6f0e2', dim: '#6f9d87', inner: 'rgba(77,192,123,.14)' },
    [AppColor.INDIGO]: { fg: '#dfe2ff', dim: '#7d85c4', inner: 'rgba(143,155,255,.16)' },
    [AppColor.CLAY]: { fg: '#fbd9d0', dim: '#b5786a', inner: 'rgba(242,105,90,.15)' },
    [AppColor.PLUM]: { fg: '#f2d6ee', dim: '#a97ba2', inner: 'rgba(217,143,208,.15)' },
  },
};

export const walletTextColors: Record<AppColor, { fg: string; dim: string; inner: string }> =
  walletTextColorsByScheme[colorScheme];

export const DEFAULT_WALLET_DESIGN = AppColor.SLATE;

// Wallets saved before stage 6 may carry an old `design` value (see legacy icon aliases in shared/icons.ts); unrecognized values fall back rather than crash.
export const resolveAppColor = (design?: AppColor): AppColor =>
  design && design in gradients ? design : DEFAULT_WALLET_DESIGN;

// Bottom padding a scrollable screen needs so its last row clears the floating Fab (58px button + 24px offset) with a visible gap, not just the tab bar underneath it.
export const FAB_SCROLL_CLEARANCE = theme.spacing.xxl + 70;
