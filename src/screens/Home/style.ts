import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  item: {
    marginVertical: 8,
    marginHorizontal: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    columnGap: 8,
  },
  button: {
    flex: 1,
  },
});

export default styles;
