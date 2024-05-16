import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputsContainer: {
    paddingHorizontal: '25%',
    width: '100%',
    rowGap: 8,
  },
  input: {
    fontSize: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: 'black',
  },
});

export default styles;
