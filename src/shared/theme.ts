export const horizontalScreenPadding = 20;

export const palette = {
  black: '#222831',
  white: '#FEFEFE',
  greyDark: '#95A1AC',
  grey: '#DDE1E4',
  greyLight: '#F8F9FA',
  yellow: '#FFC55A',
  yellowLight: '#FFD78D',
  greenDark: '#57C84D',
  green: '#5BDA8C',
  blue: '#5078F2',
  blueLight: '#EFE9F4',
  red: '#FC4100',
  redLight: '#FF7878',
  pink: '#C86FC9',
  pinkLight: '#F79AD3',
};

const theme = {
  colors: {
    background: {
      primary: palette.greyLight,
      overlay: palette.white,
    },
    text: {
      primary: palette.black,
      secondary: palette.greyDark,
    },
  },
  fonts: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    bold: 'PlusJakartaSans-Bold',
  },
  /**
   * Font sizes.
   * @property xs - 12
   * @property sm - 16
   * @property md - 20
   * @property lg - 28
   * @property xl - 48
   */
  fontSizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 28,
    xl: 48,
  },
  /**
   * Radius sizes.
   * @property sm - 12
   * @property lg - 20
   */
  radius: {
    sm: 12,
    lg: 20,
  },
  /**
   * Spacing sizes for margins and paddings.
   * @property xs - 4
   * @property sm - 8
   * @property md - 12
   * @property lg - 16
   * @property xl - 20
   * @property xxl - 24
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
};

export const shadow: Record<string, unknown> = {
  shadowColor: palette.black,
  shadowOpacity: 0.15,
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowRadius: 10,
};

export default theme;
