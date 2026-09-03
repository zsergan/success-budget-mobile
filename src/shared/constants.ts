import { WalletDesign } from '@shared/enums';
import { colorScheme } from '@shared/theme';

const LOCAL_API_BASE_URL = 'http://localhost:3000/api/v1';

const isLocalUrl = (url: string) => url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');

// Fail fast on a misconfigured non-local URL rather than sending credentials over plain HTTP.
const resolveApiBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (!configuredUrl) {
    return LOCAL_API_BASE_URL;
  }

  if (!isLocalUrl(configuredUrl) && !configuredUrl.startsWith('https://')) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must use https:// outside of local development');
  }

  return configuredUrl;
};

export const BASE_API_URL = resolveApiBaseUrl();
export const AUTH_TOKEN_KEY = 'sbm-AUTH_TOKEN_KEY';
export const BALANCE_HIDDEN_KEY = 'sbm-BALANCE_HIDDEN';

/**
 * Wallet-card gradient presets (design stage 6, Home Stage 2.dc.html) —
 * each a dark background meant for near-white text in both app themes,
 * with its own light/dark pair (152deg, stops at 0%/78%). `gradients`
 * resolves against the same `colorScheme` as the rest of the theme, so
 * consumers keep the flat `gradients[design]` lookup they already had.
 */
const walletGradientsByScheme: Record<'light' | 'dark', Record<WalletDesign, [string, string]>> = {
  light: {
    [WalletDesign.SLATE]: ['#2f3a4b', '#1d2430'],
    [WalletDesign.AMBER]: ['#c07d10', '#8a5406'],
    [WalletDesign.EVERGREEN]: ['#24614a', '#123528'],
    [WalletDesign.INDIGO]: ['#36428a', '#1e2450'],
    [WalletDesign.CLAY]: ['#984034', '#5e2419'],
    [WalletDesign.PLUM]: ['#66305f', '#3a1a36'],
  },
  dark: {
    [WalletDesign.SLATE]: ['#1a2230', '#0f1520'],
    [WalletDesign.AMBER]: ['#5d3a05', '#331f02'],
    [WalletDesign.EVERGREEN]: ['#12352a', '#0a1e18'],
    [WalletDesign.INDIGO]: ['#1c2250', '#111533'],
    [WalletDesign.CLAY]: ['#5a231a', '#33130e'],
    [WalletDesign.PLUM]: ['#3a1a36', '#220f20'],
  },
};

export const gradients: Record<WalletDesign, [string, string]> = walletGradientsByScheme[colorScheme];

/** Foreground (`fg`) / secondary (`dim`) text colors per wallet gradient preset. */
const walletTextColorsByScheme: Record<'light' | 'dark', Record<WalletDesign, { fg: string; dim: string }>> = {
  light: {
    [WalletDesign.SLATE]: { fg: '#fdfdfe', dim: '#a6b1c1' },
    [WalletDesign.AMBER]: { fg: '#fffaf0', dim: '#f0d5a6' },
    [WalletDesign.EVERGREEN]: { fg: '#f2fbf6', dim: '#9cc9b4' },
    [WalletDesign.INDIGO]: { fg: '#f4f5ff', dim: '#a8afdd' },
    [WalletDesign.CLAY]: { fg: '#fff5f2', dim: '#e0b0a4' },
    [WalletDesign.PLUM]: { fg: '#fdf3fc', dim: '#cfa8c9' },
  },
  dark: {
    [WalletDesign.SLATE]: { fg: '#f2f4f8', dim: '#8794a8' },
    [WalletDesign.AMBER]: { fg: '#ffe6b8', dim: '#c69a52' },
    [WalletDesign.EVERGREEN]: { fg: '#d6f0e2', dim: '#6f9d87' },
    [WalletDesign.INDIGO]: { fg: '#dfe2ff', dim: '#7d85c4' },
    [WalletDesign.CLAY]: { fg: '#fbd9d0', dim: '#b5786a' },
    [WalletDesign.PLUM]: { fg: '#f2d6ee', dim: '#a97ba2' },
  },
};

export const walletTextColors: Record<WalletDesign, { fg: string; dim: string }> =
  walletTextColorsByScheme[colorScheme];

export const DEFAULT_WALLET_DESIGN = WalletDesign.SLATE;

// Wallets saved before this stage may still carry a pre-stage-6 `design`
// value (green/yellow/blue/red/pink) from the backend — same situation
// as the legacy category-icon aliases in shared/icons.ts. There's no
// natural old->new color mapping worth preserving here (pre-launch data,
// per design stage 6), so any unrecognized value just falls back to the
// default preset instead of crashing the card that renders it.
export const resolveWalletDesign = (design?: WalletDesign): WalletDesign =>
  design && design in gradients ? design : DEFAULT_WALLET_DESIGN;

export const ALL_OTHERS_CATEGORIES_ID = 9999999;
