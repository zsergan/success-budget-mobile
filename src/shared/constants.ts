import { AppColor } from '@shared/enums';
import theme, { colorScheme, colorThemes } from '@shared/theme';
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

// Mirrors the backend's temporary SPACE_LIMITS (success-budget-backend/src/shared/constants.ts) — not a considered business rule; change both together.
export const SPACE_LIMITS = {
  MAX_MEMBERS_PER_SPACE: 20,
  MAX_PENDING_INVITES_PER_SPACE: 10,
};

export const INVITE_EXPIRY_DAYS = 7;

// Fallback only: prefer the 429's `error.retryAfterMs` (see @api/errors).
export const INVITE_RATE_LIMIT_COOLDOWN_MS = 60_000;

const walletAppearance = colorThemes[colorScheme].wallets;

export const gradients = Object.fromEntries(
  Object.entries(walletAppearance).map(([color, { gradient }]) => [color, gradient]),
) as Record<AppColor, [string, string]>;

export const walletTextColors: Record<AppColor, { fg: string; dim: string; inner: string }> = walletAppearance;

export const DEFAULT_WALLET_DESIGN = AppColor.SLATE;

// A missing `design`, or a color newer than this build, falls back rather than crashing.
const APP_COLORS: readonly string[] = Object.values(AppColor);

export const resolveAppColor = (design?: AppColor): AppColor =>
  design && APP_COLORS.includes(design) ? design : DEFAULT_WALLET_DESIGN;

// Bottom padding a scrollable screen needs so its last row clears the floating Fab (58px button + 24px offset) with a visible gap, not just the tab bar underneath it.
export const FAB_SCROLL_CLEARANCE = theme.spacing.xxl + 70;
