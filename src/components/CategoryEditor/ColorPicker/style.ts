import { Platform, StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const MONOSPACE = Platform.select({ ios: 'Menlo', default: 'monospace' });

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      rowGap: theme.spacing.xs,
    },
    colorRow: {
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
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
      marginTop: theme.spacing.xs,
      borderRadius: 18,
      padding: 14,
      rowGap: theme.spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: theme.spacing.sm,
    },
    panelTitle: {
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
    panelStatus: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
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
      columnGap: 10,
    },
    hexColumn: {
      flex: 1,
      minWidth: 0,
      rowGap: 5,
    },
    previewColumn: {
      alignItems: 'center',
      rowGap: 5,
    },
    fieldLabel: {
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.micro,
      letterSpacing: 0.6,
      color: colors.muted,
    },
    hexField: {
      minHeight: 44,
      borderRadius: 12,
      paddingHorizontal: theme.spacing.md,
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
      paddingVertical: theme.spacing.sm,
      fontFamily: MONOSPACE,
      fontSize: 15,
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
      fontSize: theme.fontSizes.caption,
      lineHeight: 17,
      color: colors.danger,
    },
    panelNote: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: 17,
      color: colors.muted,
    },
    panelActions: {
      flexDirection: 'row',
      columnGap: 10,
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
      fontSize: theme.fontSizes.label,
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
      fontSize: theme.fontSizes.label,
      color: colors.onSecondary,
    },
    applyTextDisabled: {
      color: colors.muted,
    },
  });

export default createStyles;
