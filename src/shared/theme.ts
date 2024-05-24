const palette = {
  green: '#58DA8C',
  red: '#FF5C5C',
};

const theme = {
  colors: {
    background: {
      primary: '#FCFCFC',
      secondary: '#EFEFF1',
      dark: '#1E1E1E',
      highlight: palette.green,
    },
    text: {
      primary: '#67677A',
      secondary: '#303048',
      success: palette.green,
      error: palette.red,
    },
  },
  fonts: {
    regular: 'DMSans-Regular',
    medium: 'DMSans-Medium',
    bold: 'DMSans-Bold',
  },
  border: {
    radius: 24,
    color: '#E1E1E1',
  },
};

export const shadow: Record<string, unknown> = {
  shadowColor: theme.colors.background.dark,
  shadowOpacity: 0.25,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowRadius: 4,
  elevation: 5,
};

export default theme;
