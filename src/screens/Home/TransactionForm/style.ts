import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: 24,
    width: '100%',
  },
  container: {
    marginHorizontal: 24,
    rowGap: 32,
    paddingBottom: 114,
  },
  mb8: {
    marginBottom: 8,
  },
  amount: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  input: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    color: theme.colors.text.secondary,
  },
  date: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    lineHeight: 28,
    color: theme.colors.text.primary,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
  },
});

export default styles;
