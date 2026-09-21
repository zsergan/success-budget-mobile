import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  topBlock: {
    paddingTop: theme.spacing.lg,
    rowGap: theme.spacing.md + 2,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: colors.track,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    marginRight: theme.spacing.sm,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    letterSpacing: theme.letterSpacing.titleSm,
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  body: {
    flex: 1,
    marginTop: theme.spacing.md,
  },
  container: {
    marginHorizontal: theme.spacing.xl,
    rowGap: theme.spacing.xl,
  },
});

export default styles;
