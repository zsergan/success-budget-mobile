import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  inputsContainer: {
    paddingHorizontal: '25%',
    width: '100%',
    rowGap: 8,
  },
});

export default styles;
