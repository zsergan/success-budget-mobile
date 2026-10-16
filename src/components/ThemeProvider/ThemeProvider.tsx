import type { ReactNode } from 'react';
import { createContext, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { showGlobalAlert } from '@components/Alert/AlertProvider/globalAlert';
import { THEME_PREFERENCE_KEY } from '@shared/constants';
import type { ColorSchemeName, ColorTheme } from '@shared/theme';
import { colorThemes } from '@shared/theme';

import type { ThemePreference } from './themePreference';
import { isThemePreference, resolveColorScheme, toColorScheme } from './themePreference';

// How long the first frame waits for the stored preference before drawing with System.
export const THEME_RESTORE_TIMEOUT_MS = 1000;

export const THEME_SAVE_FAILED_MESSAGE = 'Couldn’t save your theme. It applies until the app is restarted.';

export interface ThemeContextValue {
  preference: ThemePreference;
  scheme: ColorSchemeName;
  colorTheme: ColorTheme;
  // The stored preference has been applied, or there was none to wait for.
  isReady: boolean;
  setPreference: (next: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const subscribeToAppearance = (onChange: () => void) => {
  const subscription = Appearance.addChangeListener(onChange);

  return () => subscription.remove();
};

const getSystemScheme = () => toColorScheme(Appearance.getColorScheme());

// One write at a time, always of the newest choice, so rapid taps leave the last one stored.
const createPreferenceWriter = () => {
  let pending: ThemePreference | null = null;
  let isWriting = false;

  const drain = () => {
    const value = pending;
    if (!value) {
      isWriting = false;
      return;
    }

    pending = null;
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, value)
      .catch(() => {
        if (!pending) showGlobalAlert(THEME_SAVE_FAILED_MESSAGE);
      })
      .finally(drain);
  };

  return (value: ThemePreference) => {
    pending = value;
    if (isWriting) return;

    isWriting = true;
    drain();
  };
};

interface Props {
  children: ReactNode;
}

const ThemeProvider = ({ children }: Props) => {
  const systemScheme = useSyncExternalStore(subscribeToAppearance, getSystemScheme);
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);
  // Once the restore has finished, timed out or been overtaken by a choice, a late read changes nothing.
  const isSettledRef = useRef(false);
  const [writePreference] = useState(createPreferenceWriter);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const settle = (stored?: ThemePreference) => {
      clearTimeout(timer);
      if (isSettledRef.current) return;

      isSettledRef.current = true;
      if (stored) setPreferenceState(stored);
      setIsReady(true);
    };

    timer = setTimeout(() => settle(), THEME_RESTORE_TIMEOUT_MS);
    AsyncStorage.getItem(THEME_PREFERENCE_KEY).then(
      (value) => settle(isThemePreference(value) ? value : undefined),
      () => settle(),
    );

    return () => clearTimeout(timer);
  }, []);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      isSettledRef.current = true;
      setPreferenceState(next);
      setIsReady(true);
      writePreference(next);
    },
    [writePreference],
  );

  const scheme = resolveColorScheme(preference, systemScheme);

  const value = useMemo(
    () => ({ preference, scheme, colorTheme: colorThemes[scheme], isReady, setPreference }),
    [preference, scheme, isReady, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
