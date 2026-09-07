import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const styles = StyleSheet.create({
  root: {
    borderRadius: theme.radius.md + 2,
    padding: theme.spacing.md + 1,
    flexDirection: 'row',
    columnGap: theme.spacing.sm + 1,
    backgroundColor: hexToRgba(colors.warn, 0.12),
    borderWidth: 1,
    borderColor: hexToRgba(colors.warn, 0.3),
  },
  iconBox: {
    marginTop: 1,
  },
  content: {
    flex: 1,
    rowGap: theme.spacing.sm - 1,
  },
  text: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm - 2,
  },
  raiseButton: {
    height: 30,
    paddingHorizontal: theme.spacing.md - 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  raiseButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.text,
  },
  keepButton: {
    height: 30,
    paddingHorizontal: theme.spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
});

export default styles;
