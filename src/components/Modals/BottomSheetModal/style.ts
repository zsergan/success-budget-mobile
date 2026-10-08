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
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleIndicator: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
});

export default styles;
