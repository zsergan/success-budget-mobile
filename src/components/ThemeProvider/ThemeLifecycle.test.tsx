import { Text } from 'react-native';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, screen } from '@testing-library/react-native';

import { useTheme } from '@hooks';
import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { THEME_PREFERENCE_KEY } from '@shared/constants';

import { renderWithTheme } from './themeTestUtils';

const Probe = () => {
  const { preference, scheme } = useTheme();

  return <Text testID="theme">{`${preference}:${scheme}`}</Text>;
};

beforeEach(() => AsyncStorage.clear());

it('keeps the preference through sign-out, sign-in and a space switch', async () => {
  const store = createAppStore();
  const { setTheme } = await renderWithTheme(
    <Provider store={store}>
      <Probe />
    </Provider>,
  );
  await setTheme('dark');

  await act(async () => {
    store.dispatch(activateSpace(1));
    store.dispatch(activateSpace(2));
    store.dispatch(logoutMe.fulfilled(undefined, 'req-logout'));
    store.dispatch(loginMe.fulfilled('a-token', 'req-login', { email: 'me@example.com', password: 'password1' }));
  });

  expect(screen.getByTestId('theme').props.children).toBe('dark:dark');
  expect(await AsyncStorage.getItem(THEME_PREFERENCE_KEY)).toBe('dark');
});

it('restores the stored preference on the next start', async () => {
  const first = await renderWithTheme(<Probe />);
  await first.setTheme('dark');
  first.unmount();

  await renderWithTheme(<Probe />);

  expect(screen.getByTestId('theme').props.children).toBe('dark:dark');
});
