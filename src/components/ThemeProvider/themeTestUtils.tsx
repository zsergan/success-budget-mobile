import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { act, render } from '@testing-library/react-native';

import useTheme from '@hooks/useTheme';

import type { ThemePreference } from './themePreference';
import ThemeProvider from './ThemeProvider';

// Test-only: renders under a real ThemeProvider and switches the theme the way Settings does.
export const renderWithTheme = async (ui: ReactElement) => {
  let setPreference: (next: ThemePreference) => void = () => {};

  const Controller = () => {
    const { setPreference: set } = useTheme();

    useEffect(() => {
      setPreference = set;
    });

    return null;
  };

  const result = render(
    <ThemeProvider>
      <Controller />
      {ui}
    </ThemeProvider>,
  );
  // Lets the stored-preference read settle.
  await act(async () => {});

  return { ...result, setTheme: (next: ThemePreference) => act(async () => setPreference(next)) };
};
