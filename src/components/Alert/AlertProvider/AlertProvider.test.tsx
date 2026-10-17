import { useContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Provider } from 'react-redux';
import { act, render, screen } from '@testing-library/react-native';

import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import { createAppStore } from '@redux/Store';
import { colorThemes } from '@shared/theme';
import { activateSpace } from '@redux/state/space/thunks';
import AlertProvider, { AlertContext } from './AlertProvider';

jest.useFakeTimers();

it('takes back a toast action once the space or session it was offered in is left', async () => {
  const store = createAppStore();
  store.dispatch(activateSpace(1));
  let context: React.ContextType<typeof AlertContext> | undefined;
  const Probe = () => {
    context = useContext(AlertContext);
    return <Text>Screen</Text>;
  };

  render(
    <Provider store={store}>
      <AlertProvider>
        <Probe />
      </AlertProvider>
    </Provider>,
  );

  act(() => context?.addAlert('Couldn’t delete transaction', { label: 'Retry', onPress: jest.fn() }));
  expect(screen.getByText('Retry')).toBeTruthy();

  act(() => {
    store.dispatch(activateSpace(2));
  });
  // Well before the toast would close by itself.
  await act(async () => jest.advanceTimersByTimeAsync(1000));

  expect(screen.queryByText('Retry')).toBeNull();
});

it('restyles a toast on screen when the theme changes', async () => {
  let context: React.ContextType<typeof AlertContext> | undefined;
  const Probe = () => {
    context = useContext(AlertContext);
    return null;
  };
  const { setTheme } = await renderWithTheme(
    <Provider store={createAppStore()}>
      <AlertProvider>
        <Probe />
      </AlertProvider>
    </Provider>,
  );

  act(() => context?.addAlert('Transaction deleted'));
  await setTheme('dark');

  expect(StyleSheet.flatten(screen.getByText('Transaction deleted').props.style).color).toBe(
    colorThemes.dark.colors.onToast,
  );
});
