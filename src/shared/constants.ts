import { WalletDesign } from '@shared/enums';
import { palette } from '@shared/theme';

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

export const gradients: Record<WalletDesign, [string, string]> = {
  [WalletDesign.GREEN]: [palette.green, palette.greenDark],
  [WalletDesign.YELLOW]: [palette.yellowLight, palette.yellow],
  [WalletDesign.BLUE]: [palette.blueLight, palette.blue],
  [WalletDesign.RED]: [palette.redLight, palette.red],
  [WalletDesign.PINK]: [palette.pinkLight, palette.pink],
};

export const ALL_OTHERS_CATEGORIES_ID = 9999999;
