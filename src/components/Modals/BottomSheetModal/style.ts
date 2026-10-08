import { StyleSheet } from 'react-native';
import { colors } from '@shared/theme';

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  background: {
    borderRadius: 28,
  },
  handle: {
    height: 24,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  handleIndicator: {
    width: 44,
    height: 5,
    backgroundColor: colors.track,
  },
});

export default styles;
