export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

// Only the server marks a wallet's starting balance; the category name is display text.
export enum TransactionKind {
  REGULAR = 'regular',
  INITIAL_BALANCE = 'initial_balance',
}

export enum AppColor {
  SLATE = 'slate',
  AMBER = 'amber',
  EVERGREEN = 'evergreen',
  INDIGO = 'indigo',
  CLAY = 'clay',
  PLUM = 'plum',
}

export enum LimitType {
  CATEGORY = 'category',
  OTHERS = 'others',
}

export enum SpaceType {
  PERSONAL = 'personal',
  GROUP = 'group',
}

export enum ScreenNames {
  HOME_TAB = 'Home',
  LIMITS_TAB = 'Limits',
  HOME_SCREEN = 'HomeScreen',
  ADD_WALLET_SCREEN = 'AddWalletScreen',
  TRANSACTIONS_TAB = 'Transactions',
  STATS_TAB = 'Stats',
  SETTINGS_TAB = 'Settings',
  CATEGORIES_SCREEN = 'CategoriesScreen',
  CREATE_SPACE_SCREEN = 'CreateSpaceScreen',
  MEMBERS_SCREEN = 'MembersScreen',
  ACCEPT_INVITE_SCREEN = 'AcceptInviteScreen',
  LAUNCH_SCREEN = 'LaunchScreen',
  WELCOME_SCREEN = 'WelcomeScreen',
  SIGN_IN_SCREEN = 'SignInScreen',
  SIGN_UP_SCREEN = 'SighUpScreen',
  VERIFY_EMAIL_SCREEN = 'VerifyEmailScreen',
  FORGOT_PASSWORD_SCREEN = 'ForgotPasswordScreen',
  RESET_CODE_SCREEN = 'ResetCodeScreen',
  NEW_PASSWORD_SCREEN = 'NewPasswordScreen',
}
