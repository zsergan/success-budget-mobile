import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  sectionsContainer: {
    rowGap: theme.spacing.xl,
  },
  section: {
    rowGap: theme.spacing.md,
  },
  presetName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
  formContainer: {
    rowGap: theme.spacing.lg,
  },
  fieldGroup: {
    rowGap: theme.spacing.sm,
  },
  hint: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  designsContainer: {
    flexDirection: 'row',
    columnGap: 14,
  },
  swatch: {
    width: 44,
    height: 44,
  },
  selectionRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRing: {
    borderColor: colors.accent,
  },
  designCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 15,
  },
});

export default styles;
