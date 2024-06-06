import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScreenNames, TransactionType, WalletDesign } from '@shared/enums';

type AddWalletParams =
  | { id: 'new' }
  | { id: number; walletName: string; balance: string; currencyId: number; design: WalletDesign };

type AddCategoryParams =
  | { id: 'new' }
  | { id: number; name: string; icon: string; color: string; transaction_type: TransactionType };

type AddLimitParams = { id: 'new' } | { id: number; amount: string; category_id?: number };

export type RootStackParamList = {
  [ScreenNames.HOME_TAB]: undefined;
  [ScreenNames.LIMITS_TAB]: undefined;
  [ScreenNames.HOME_SCREEN]: undefined;
  [ScreenNames.ADD_WALLET_SCREEN]: AddWalletParams;
  [ScreenNames.ADD_LIMIT_SCREEN]: AddLimitParams;
  [ScreenNames.ADD_CATEGORY_SCREEN]: AddCategoryParams;
  [ScreenNames.TRANSACTIONS_TAB]: undefined;
  [ScreenNames.SETTINGS_TAB]: undefined;
  [ScreenNames.CATEGORIES_SCREEN]: undefined;
  [ScreenNames.LOADING_SCREEN]: undefined;
  [ScreenNames.SIGN_IN_SCREEN]: undefined;
  [ScreenNames.SIGN_UP_SCREEN]: undefined;
  [ScreenNames.VERIFY_EMAIL_SCREEN]: undefined;
};

export interface ScreenProps<T extends ScreenNames> extends NativeStackScreenProps<RootStackParamList, T> {}
export type NavigationType<T extends ScreenNames> = NativeStackNavigationProp<RootStackParamList, T>;

export type IconType =
  | CategoryIconType
  | TransactionTypeIconType
  | 'add'
  | 'edit'
  | 'lock'
  | 'email'
  | 'close'
  | 'error'
  | 'person'
  | 'delete'
  | 'logout'
  | 'interests'
  | 'data-usage'
  | 'visibility'
  | 'arrow-back'
  | 'attach-money'
  | 'visibility-off'
  | 'sentiment-neutral'
  | 'keyboard-arrow-right';

export type TransactionTypeIconType = 'arrow-outward' | 'arrow-downward';

export type CategoryIconType =
  | 'paid'
  | 'home'
  | 'pets'
  | 'store'
  | 'money'
  | 'flight'
  | 'cable'
  | 'school'
  | 'healing'
  | 'category'
  | 'fastfood'
  | 'checkroom'
  | 'water-drop'
  | 'directions-bus'
  | 'directions-car'
  | 'sports-esports'
  | 'shopping-basket'
  | 'card-giftcard';
