import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AssignmentKey } from '@api/models';
import type { ScreenNames, AppColor, TransactionKind, TransactionType } from '@shared/enums';

// The transactions behind a Stats row, as a route's params: the period's own instants and zone, as the statistics
// API returned them.
export type HistoryFilter = {
  spaceId: number;
  from: string;
  to: string;
  // The zone the row was summed in, so the list's days and totals are cut the same way.
  timeZone: string;
  transactionType: TransactionType;
  // Starting balances are left out of the list itself, so it adds up to the row.
  kind: TransactionKind;
  // The row's name, shown with the list.
  name: string;
} & (
  | { categoryId: number; icon: IconType; color: AppColor; assignment?: never }
  // The feed's `assignment` value, as the breakdown named it; the list draws the group's look itself.
  | { assignment: AssignmentKey; categoryId?: never }
);

// A one-time request to bring a saved transaction into view: its month, no filter, the row scrolled to.
export type RevealTransaction = { spaceId: number; transactionId: string; timestamp: string };

// A one-time request from Home to open Stats on its month (`month`: any instant in it), type and grouping.
export type StatsFocus = {
  spaceId: number;
  month: string;
  transactionType: TransactionType;
  mode: 'category' | 'assignment';
};

// A one-time request from Home to open History on its month, narrowed to a type and an assignment.
export type HistoryFocus = {
  spaceId: number;
  month: string;
  transactionType?: TransactionType;
  assignment?: AssignmentKey;
  // How the row it came from named the assignment.
  assignmentName?: string;
};

// How a recovery ended, for Sign In: `unknown` when the answer to the new password was lost and it may have applied.
export type PasswordResetOutcome = { email: string; outcome: 'updated' | 'unknown' };

// The Stats tab's own stack: the overview stays mounted under the transactions of one of its rows.
export type StatsStackParamList = {
  [ScreenNames.STATS_OVERVIEW_SCREEN]: { focus?: StatsFocus } | undefined;
  [ScreenNames.STATS_TRANSACTIONS_SCREEN]: { filter: HistoryFilter };
};

export type MainTabParamList = {
  // `showMonth`: the month a record saved from Home went to, which Home opens on.
  [ScreenNames.HOME_TAB]: { showMonth?: { spaceId: number; month: string } } | undefined;
  [ScreenNames.TRANSACTIONS_TAB]: { reveal?: RevealTransaction; focus?: HistoryFocus } | undefined;
  [ScreenNames.STATS_TAB]: NavigatorScreenParams<StatsStackParamList> | undefined;
  [ScreenNames.LIMITS_TAB]: undefined;
  [ScreenNames.SETTINGS_TAB]: undefined;
};

export type RootStackParamList = {
  [ScreenNames.HOME_SCREEN]: NavigatorScreenParams<MainTabParamList>;
  // The draft lives in the transaction flow; the route only says which space's flow it shows.
  [ScreenNames.TRANSACTION_EDITOR_SCREEN]: { spaceId: number };
  // The full category list over the editor, for the same flow.
  [ScreenNames.TRANSACTION_CATEGORIES_SCREEN]: { spaceId: number };
  [ScreenNames.CATEGORIES_SCREEN]: undefined;
  [ScreenNames.CREATE_SPACE_SCREEN]: undefined;
  [ScreenNames.MEMBERS_SCREEN]: undefined;
  // No params: a link's token stays in the invitation state, never in navigation.
  [ScreenNames.ACCEPT_INVITE_SCREEN]: undefined;
  [ScreenNames.LAUNCH_SCREEN]: undefined;
  [ScreenNames.WELCOME_SCREEN]: undefined;
  [ScreenNames.SIGN_IN_SCREEN]: { passwordReset?: PasswordResetOutcome } | undefined;
  // Set by Verify Email on the way back to the filled form.
  [ScreenNames.SIGN_UP_SCREEN]: { focusEmail?: boolean; notice?: 'requestAnotherCode' } | undefined;
  [ScreenNames.VERIFY_EMAIL_SCREEN]: undefined;
  // Recovery state (code, cooldown, reset authorization) lives in the passwordReset slice, never in params.
  [ScreenNames.FORGOT_PASSWORD_SCREEN]: { email?: string } | undefined;
  [ScreenNames.RESET_CODE_SCREEN]: { notice?: 'authorizationExpired' } | undefined;
  [ScreenNames.NEW_PASSWORD_SCREEN]: undefined;
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

export type StatsStackScreenProps<T extends keyof StatsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<StatsStackParamList, T>,
  MainTabScreenProps<ScreenNames.STATS_TAB>
>;

export type StatsStackNavigationProp<T extends keyof StatsStackParamList> = CompositeNavigationProp<
  NativeStackNavigationProp<StatsStackParamList, T>,
  MainTabNavigationProp<ScreenNames.STATS_TAB>
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
  | 'arrow-right'
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
  | 'user-x'
  | 'archive'
  | 'users'
  | 'logout'
  | 'transfer'
  | 'home'
  | 'list'
  | 'limit'
  | 'chart'
  | 'alert'
  | 'info'
  | 'refresh'
  | 'offline'
  | 'currency'
  | 'download'
  | 'grid'
  | 'note'
  | 'key'
  | 'mail-check'
  | 'clock'
  | 'clipboard'
  | 'lock-open'
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
