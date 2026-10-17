import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Appearance, AppState, StatusBar } from 'react-native';
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

// The appearance React Native reports: the device's under System, the override under a manual choice.
const appearanceListeners = new Set<() => void>();

const subscribeToAppearance = (onChange: () => void) => {
  appearanceListeners.add(onChange);
  const subscription = Appearance.addChangeListener(onChange);

  return () => {
    appearanceListeners.delete(onChange);
    subscription.remove();
  };
};

const getSystemScheme = () => toColorScheme(Appearance.getColorScheme());

// Native surfaces (alerts, keyboards, pickers) take a manual choice; System hands them back to the device.
// Clearing the override also re-reads the device's appearance; the native change event corrects it if that
// read was still the old override.
const applyNativeAppearance = (preference: ThemePreference) => {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  appearanceListeners.forEach((listener) => listener());
};

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

  // Applied from the preference only, never from a resolved System scheme, so System keeps following the device.
  useEffect(() => {
    if (isReady) applyNativeAppearance(preference);
  }, [isReady, preference]);

  // A change made while the app was in the background is read again on return.
  useEffect(() => {
    if (preference !== 'system') return;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') applyNativeAppearance('system');
    });

    return () => subscription.remove();
  }, [preference]);

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

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      {children}
    </ThemeContext.Provider>
  );
};

const FALLBACK_THEME: ThemeContextValue = {
  preference: 'system',
  scheme: 'light',
  colorTheme: colorThemes.light,
  isReady: true,
  setPreference: () => {},
};

// Light, for UI that must draw even without a ThemeProvider above it (the crash screen); a provider above wins.
export const ThemeFallback = ({ children }: Props) => {
  const context = useContext(ThemeContext);

  return context ? children : <ThemeContext.Provider value={FALLBACK_THEME}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
