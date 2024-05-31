import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScreenNames, WalletDesign } from '@shared/enums';

type AddWalletParams =
  | {
      id: 'new';
    }
  | {
      id: number;
      walletName: string;
      balance: string;
      currencyId: number;
      design: WalletDesign;
    };

export type RootStackParamList = {
  [ScreenNames.HOME_TAB]: undefined;
  [ScreenNames.HOME_SCREEN]: undefined;
  [ScreenNames.ADD_WALLET_SCREEN]: AddWalletParams;
  [ScreenNames.TRANSACTIONS_TAB]: undefined;
  [ScreenNames.SETTINGS_TAB]: undefined;
  [ScreenNames.LOADING_SCREEN]: undefined;
  [ScreenNames.SIGN_IN_SCREEN]: undefined;
  [ScreenNames.SIGN_UP_SCREEN]: undefined;
  [ScreenNames.VERIFY_EMAIL_SCREEN]: undefined;
};

export interface ScreenProps<T extends ScreenNames> extends NativeStackScreenProps<RootStackParamList, T> {}
export type NavigationType<T extends ScreenNames> = NativeStackNavigationProp<RootStackParamList, T>;

export type IconType =
  | 'add'
  | 'edit'
  | 'lock'
  | 'email'
  | 'close'
  | 'error'
  | 'person'
  | 'delete'
  | 'store'
  | 'logout'
  | 'visibility'
  | 'arrow-back'
  | 'attach-money'
  | 'arrow-outward'
  | 'arrow-downward'
  | 'visibility-off';
