import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScreenNames, AppColor } from '@shared/enums';

type AddWalletParams = { id: 'new' } | { id: number; walletName: string; balance: string; design: AppColor };

export type RootStackParamList = {
  [ScreenNames.HOME_TAB]: undefined;
  [ScreenNames.LIMITS_TAB]: undefined;
  [ScreenNames.HOME_SCREEN]: undefined;
  [ScreenNames.ADD_WALLET_SCREEN]: AddWalletParams;
  [ScreenNames.TRANSACTIONS_TAB]: undefined;
  [ScreenNames.SETTINGS_TAB]: undefined;
  [ScreenNames.CATEGORIES_SCREEN]: undefined;
  [ScreenNames.CREATE_SPACE_SCREEN]: undefined;
  [ScreenNames.MEMBERS_SCREEN]: undefined;
  [ScreenNames.ACCEPT_INVITE_SCREEN]: undefined;
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
  | 'users'
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
  | 'note'
  | 'trend-up'
  | 'trend-down';

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
