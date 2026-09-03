import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  scrollWrap: {
    position: 'relative',
    marginHorizontal: -theme.spacing.xl,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 5,
    marginTop: 14,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
});

export default styles;
