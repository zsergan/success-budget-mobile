import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { THEME_PREFERENCE_KEY } from '@shared/constants';

export type ThemePreference = 'light' | 'dark' | 'system';

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

const useThemePreference = () => {
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_KEY).then((value) => {
      if (isThemePreference(value)) {
        setPreference(value);
      }
    });
  }, []);

  const setThemePreference = (next: ThemePreference) => {
    setPreference(next);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, next);
  };

  return { preference, setThemePreference };
};

export default useThemePreference;
