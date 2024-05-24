import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    width: '80%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.border.radius,
    padding: 24,
    alignItems: 'center',
    ...shadow,
  },
  question: {
    marginBottom: 24,
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: theme.colors.text.secondary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  button: {
    flex: 1,
    alignSelf: 'stretch',
  },
});

export default styles;
