import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScreenNames, AppColor, TransactionKind, TransactionType } from '@shared/enums';

// Plain data, never a callback: where to go once the wallet is saved, and for which space.
export type AddTransactionIntent = { returnTo: ScreenNames.STATS_TAB; spaceId: number };

type AddWalletParams =
  // `forDraft`: the transaction draft waiting for this wallet; it gets it on save, and its form back on leaving.
  | { id: 'new'; addTransaction?: AddTransactionIntent; forDraft?: number }
  | { id: number; walletName: string; balance: string; design: AppColor };

// A one-time request to open the composer on a wallet that was just created.
export type ComposeWithWallet = { spaceId: number; walletId: number };

// A History view opened from a Stats row: the period's own instants, as the statistics API returned them.
export type HistoryFilter = {
  spaceId: number;
  from: string;
  to: string;
  transactionType: TransactionType;
  // Starting balances are left out of the list itself, so it adds up to the row.
  kind: TransactionKind;
  // The row's name, shown on the applied filter.
  name: string;
} & ({ categoryId: number; walletId?: never } | { walletId: number; categoryId?: never });

// A one-time request to bring a saved transaction into view: its month, no filter, the row scrolled to.
export type RevealTransaction = { spaceId: number; transactionId: string; timestamp: string };

export type MainTabParamList = {
  [ScreenNames.HOME_TAB]: undefined;
  [ScreenNames.TRANSACTIONS_TAB]: { filter?: HistoryFilter; reveal?: RevealTransaction } | undefined;
  [ScreenNames.STATS_TAB]: { composeWith?: ComposeWithWallet } | undefined;
  [ScreenNames.LIMITS_TAB]: undefined;
  [ScreenNames.SETTINGS_TAB]: undefined;
};

export type RootStackParamList = {
  [ScreenNames.HOME_SCREEN]: NavigatorScreenParams<MainTabParamList>;
  [ScreenNames.ADD_WALLET_SCREEN]: AddWalletParams;
  [ScreenNames.CATEGORIES_SCREEN]: undefined;
  [ScreenNames.CREATE_SPACE_SCREEN]: undefined;
  [ScreenNames.MEMBERS_SCREEN]: undefined;
  [ScreenNames.ACCEPT_INVITE_SCREEN]: undefined;
  [ScreenNames.LAUNCH_SCREEN]: undefined;
  [ScreenNames.WELCOME_SCREEN]: undefined;
  [ScreenNames.SIGN_IN_SCREEN]: undefined;
  [ScreenNames.SIGN_UP_SCREEN]: undefined;
  [ScreenNames.VERIFY_EMAIL_SCREEN]: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type MainTabNavigationProp<T extends keyof MainTabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
  | 'chevron-right'
  | 'pie'
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
  | 'offline'
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
