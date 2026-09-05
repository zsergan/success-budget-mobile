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

// Wallet-card gradient presets, paired per color scheme like the rest of the theme (angle/stops in WalletGradientBackground.tsx).
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

/**
 * Foreground (`fg`) / secondary (`dim`) text colors per wallet gradient
 * preset, plus `inner` — the translucent tint behind the Income/Expense
 * boxes inside the card (design stage 7, `Home Stage 2.dc.html`).
 */
const walletTextColorsByScheme: Record<
  'light' | 'dark',
  Record<WalletDesign, { fg: string; dim: string; inner: string }>
> = {
  light: {
    [WalletDesign.SLATE]: { fg: '#fdfdfe', dim: '#a6b1c1', inner: 'rgba(253,253,254,.09)' },
    [WalletDesign.AMBER]: { fg: '#fffaf0', dim: '#f0d5a6', inner: 'rgba(255,250,240,.14)' },
    [WalletDesign.EVERGREEN]: { fg: '#f2fbf6', dim: '#9cc9b4', inner: 'rgba(242,251,246,.12)' },
    [WalletDesign.INDIGO]: { fg: '#f4f5ff', dim: '#a8afdd', inner: 'rgba(244,245,255,.12)' },
    [WalletDesign.CLAY]: { fg: '#fff5f2', dim: '#e0b0a4', inner: 'rgba(255,245,242,.13)' },
    [WalletDesign.PLUM]: { fg: '#fdf3fc', dim: '#cfa8c9', inner: 'rgba(253,243,252,.13)' },
  },
  dark: {
    [WalletDesign.SLATE]: { fg: '#f2f4f8', dim: '#8794a8', inner: 'rgba(255,176,32,.12)' },
    [WalletDesign.AMBER]: { fg: '#ffe6b8', dim: '#c69a52', inner: 'rgba(255,200,107,.14)' },
    [WalletDesign.EVERGREEN]: { fg: '#d6f0e2', dim: '#6f9d87', inner: 'rgba(77,192,123,.14)' },
    [WalletDesign.INDIGO]: { fg: '#dfe2ff', dim: '#7d85c4', inner: 'rgba(143,155,255,.16)' },
    [WalletDesign.CLAY]: { fg: '#fbd9d0', dim: '#b5786a', inner: 'rgba(242,105,90,.15)' },
    [WalletDesign.PLUM]: { fg: '#f2d6ee', dim: '#a97ba2', inner: 'rgba(217,143,208,.15)' },
  },
};

export const walletTextColors: Record<WalletDesign, { fg: string; dim: string; inner: string }> =
  walletTextColorsByScheme[colorScheme];

export const DEFAULT_WALLET_DESIGN = WalletDesign.SLATE;

// Wallets saved before stage 6 may carry an old `design` value (see legacy icon aliases in shared/icons.ts); unrecognized values fall back rather than crash.
export const resolveWalletDesign = (design?: WalletDesign): WalletDesign =>
  design && design in gradients ? design : DEFAULT_WALLET_DESIGN;

export const ALL_OTHERS_CATEGORIES_ID = 9999999;
