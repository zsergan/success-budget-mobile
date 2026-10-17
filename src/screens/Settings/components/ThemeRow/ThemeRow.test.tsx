import { Appearance } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import { useThemePreference } from '@hooks';

import ThemeRow from './ThemeRow';

const ConnectedThemeRow = () => {
  const { preference, setThemePreference } = useThemePreference();

  return <ThemeRow preference={preference} onChange={setThemePreference} />;
};

const selected = () =>
  ['Light', 'Dark', 'System'].filter((name) => screen.getByRole('button', { name }).props.accessibilityState?.selected);

it('marks the chosen preference, not the appearance it resolves to', async () => {
  jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
  await renderWithTheme(<ConnectedThemeRow />);

  expect(selected()).toEqual(['System']);

  fireEvent.press(screen.getByRole('button', { name: 'Light' }));
  expect(selected()).toEqual(['Light']);

  fireEvent.press(screen.getByRole('button', { name: 'System' }));
  expect(selected()).toEqual(['System']);
});
