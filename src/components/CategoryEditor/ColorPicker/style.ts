import { Platform, StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const MONOSPACE = Platform.select({ ios: 'Menlo', default: 'monospace' });

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    colorRow: {
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    colorSwatch: {
      flex: 1,
      height: 44,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorSwatchSelected: {
      borderWidth: 2,
      borderColor: colors.text,
    },
    customSwatch: {
      overflow: 'hidden',
    },
    // Opened but not applied: the draft keeps its colour, so the ring is a quiet one.
    customSwatchOpen: {
      borderWidth: 2,
      borderColor: colors.muted,
    },
    rainbow: {
      ...StyleSheet.absoluteFill,
    },
    // Readable on any colour under it.
    customMark: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.elevated,
    },
    panel: {
      marginTop: scaleSpace(theme.spacing.xs, layout),
      borderRadius: 18,
      padding: scaleSpace(14, layout),
      rowGap: scaleSpace(theme.spacing.md, layout),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    panelTitle: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
    },
    panelStatus: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    svArea: {
      height: 120,
      borderRadius: 12,
      overflow: 'hidden',
    },
    fill: {
      ...StyleSheet.absoluteFill,
    },
    svThumb: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.pickerThumbRing,
    },
    hueThumbOuter: {
      position: 'absolute',
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.pickerThumbRing,
    },
    thumbInner: {
      flex: 1,
      borderRadius: 11,
      borderWidth: 3,
      borderColor: colors.pickerThumb,
    },
    hueBar: {
      height: 24,
      justifyContent: 'center',
    },
    hueTrack: {
      height: 14,
      borderRadius: 7,
    },
    hexRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(10, layout),
    },
    hexColumn: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(5, layout),
    },
    previewColumn: {
      alignItems: 'center',
      rowGap: scaleSpace(5, layout),
    },
    fieldLabel: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      letterSpacing: 0.6,
      color: colors.muted,
    },
    hexField: {
      minHeight: 44,
      borderRadius: 12,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      justifyContent: 'center',
      backgroundColor: colors.elevated,
      borderWidth: 1.5,
    },
    hexFieldValid: {
      borderColor: colors.accent,
    },
    hexFieldInvalid: {
      borderColor: colors.danger,
    },
    hexInput: {
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
      fontFamily: MONOSPACE,
      fontSize: scaleFont(15, layout),
      fontWeight: '600',
      color: colors.text,
    },
    previewTile: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hexError: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.danger,
    },
    panelNote: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.muted,
    },
    panelActions: {
      flexDirection: 'row',
      columnGap: scaleSpace(10, layout),
    },
    cancelButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    cancelText: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
    },
    applyButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondary,
    },
    applyButtonDisabled: {
      backgroundColor: colors.track,
    },
    applyText: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.onSecondary,
    },
    applyTextDisabled: {
      color: colors.muted,
    },
  });

export default createStyles;
