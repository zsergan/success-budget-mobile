import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScreenNames, TransactionType, WalletDesign } from '@shared/enums';

type AddWalletParams =
  { id: 'new' } | { id: number; walletName: string; balance: string; currencyId: number; design: WalletDesign };

type AddCategoryParams =
  { id: 'new' } | { id: number; name: string; icon: string; color: string; transactionType: TransactionType };

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

// UI + category icon names (see `src/shared/icons.ts` for each path); legacy names are excluded here but still resolved there.
export type IconType =
  | CategoryIconType
  | TransactionTypeIconType
  | 'plus'
  | 'minus'
  | 'close'
  | 'check'
  | 'back'
  | 'forward'
  | 'chevron-down'
  | 'chevron-up'
  | 'edit'
  | 'trash'
  | 'more'
  | 'calendar'
  | 'eye'
  | 'eye-off'
  | 'search'
  | 'filter'
  | 'settings'
  | 'bell'
  | 'lock'
  | 'mail'
  | 'user'
  | 'logout'
  | 'wallet'
  | 'transfer'
  | 'home'
  | 'list'
  | 'limit'
  | 'chart'
  | 'alert'
  | 'info'
  | 'refresh'
  | 'download'
  | 'grid'
  | 'note';

export type TransactionTypeIconType = 'income' | 'expense';

export type CategoryIconType =
  | 'salary'
  | 'bonus'
  | 'freelance'
  | 'investments'
  | 'dividends'
  | 'refund'
  | 'grocery'
  | 'restaurant'
  | 'cafe'
  | 'housing'
  | 'utilities'
  | 'internet'
  | 'transport'
  | 'fuel'
  | 'car'
  | 'taxi'
  | 'health'
  | 'pharmacy'
  | 'fitness'
  | 'beauty'
  | 'clothes'
  | 'electronics'
  | 'home-goods'
  | 'education'
  | 'kids'
  | 'pets'
  | 'travel'
  | 'entertainment'
  | 'subscriptions'
  | 'gifts'
  | 'charity'
  | 'fees'
  | 'taxes'
  | 'savings'
  | 'other';
