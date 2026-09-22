import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconCellWrap: {
    width: `${100 / 6}%`,
    aspectRatio: 1,
    marginBottom: 9,
    paddingHorizontal: 4.5,
  },
  iconCell: {
    flex: 1,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCellUnselected: {
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  iconCellSelected: {
    borderWidth: 2,
  },
});

export default styles;
