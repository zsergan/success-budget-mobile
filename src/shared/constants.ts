import { WalletDesign } from '@shared/enums';
import { palette } from '@shared/theme';

export const BASE_API_URL_LOCAL = 'http://localhost:3000/api/v1';
export const BASE_API_URL_DEV = 'http://44.223.116.185:3000/api/v1';
export const AUTH_TOKEN_KEY = 'sbm-AUTH_TOKEN_KEY';

export const gradients: Record<WalletDesign, [string, string]> = {
  [WalletDesign.GREEN]: [palette.green, palette.greenDark],
  [WalletDesign.YELLOW]: [palette.yellowLight, palette.yellow],
  [WalletDesign.BLUE]: [palette.blueLight, palette.blue],
  [WalletDesign.RED]: [palette.redLight, palette.red],
  [WalletDesign.PINK]: [palette.pinkLight, palette.pink],
};

export const ALL_OTHERS_CATEGORIES_ID = 9999999;
