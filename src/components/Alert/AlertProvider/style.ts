import { StyleSheet } from 'react-native';

import theme, { horizontalScreenPadding } from '@shared/theme';

const styles = StyleSheet.create({
  provider: {
    position: 'absolute',
    top: '10%',
    left: horizontalScreenPadding,
    right: horizontalScreenPadding,
    zIndex: 10000,
    rowGap: theme.spacing.xs,
  },
});

export default styles;
