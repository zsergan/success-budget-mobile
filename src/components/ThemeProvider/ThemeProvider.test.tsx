import { useEffect } from 'react';
import type { ColorSchemeName as ReportedScheme } from 'react-native';
import { Appearance, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';

import { showGlobalAlert } from '@components/Alert/AlertProvider/globalAlert';
import { useTheme } from '@hooks';
import type { ThemeContextValue } from './ThemeProvider';
import ThemeProvider, { THEME_RESTORE_TIMEOUT_MS, THEME_SAVE_FAILED_MESSAGE } from './ThemeProvider';

jest.mock('@components/Alert/AlertProvider/globalAlert', () => ({ showGlobalAlert: jest.fn() }));

const KEY = 'sbm-THEME_PREFERENCE';

// Typed wider than the platform's own type: a device may report no appearance at all.
let deviceScheme: ReportedScheme | null;
const appearanceListeners = new Set<Appearance.AppearanceListener>();

const setDeviceScheme = (next: ReportedScheme) =>
  act(() => {
    deviceScheme = next;
    appearanceListeners.forEach((listener) => listener({ colorScheme: next }));
  });

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

let latest: ThemeContextValue;

const Probe = ({ testID = 'theme' }: { testID?: string }) => {
  const value = useTheme();

  useEffect(() => {
    if (testID === 'theme') latest = value;
  });

  return <Text testID={testID}>{`${value.preference}:${value.scheme}:${value.isReady ? 'ready' : 'waiting'}`}</Text>;
};

const shown = (testID = 'theme') => screen.getByTestId(testID).props.children;

const renderTheme = async () => {
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  await act(() => jest.advanceTimersByTimeAsync(0));
};

const choose = (next: ThemeContextValue['preference']) => act(() => latest.setPreference(next));

beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  deviceScheme = 'light';
  appearanceListeners.clear();
  jest.spyOn(Appearance, 'getColorScheme').mockImplementation(() => deviceScheme as ReportedScheme);
  jest.spyOn(Appearance, 'addChangeListener').mockImplementation((listener) => {
    appearanceListeners.add(listener);

    return { remove: () => appearanceListeners.delete(listener) } as ReturnType<typeof Appearance.addChangeListener>;
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('restoring the preference', () => {
  it('follows the device when nothing is stored', async () => {
    deviceScheme = 'dark';

    await renderTheme();

    expect(shown()).toBe('system:dark:ready');
    expect(latest.colorTheme.colors.bg).toBe('#0E1218');
  });

  it('applies a stored preference over the device appearance', async () => {
    await AsyncStorage.setItem(KEY, 'dark');

    await renderTheme();

    expect(shown()).toBe('dark:dark:ready');
  });

  it('treats an unknown stored value as System', async () => {
    await AsyncStorage.setItem(KEY, 'sepia');
    deviceScheme = 'dark';

    await renderTheme();

    expect(shown()).toBe('system:dark:ready');
  });

  it('falls back to System when the read fails', async () => {
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('disk'));

    await renderTheme();

    expect(shown()).toBe('system:light:ready');
  });

  it('waits for a slow read, then applies it', async () => {
    const read = deferred<string | null>();
    jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(read.promise);

    await renderTheme();
    expect(shown()).toBe('system:light:waiting');

    await act(async () => read.resolve('dark'));

    expect(shown()).toBe('dark:dark:ready');
  });

  it('stops waiting at the deadline and ignores the read that arrives after it', async () => {
    const read = deferred<string | null>();
    jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(read.promise);

    await renderTheme();
    await act(() => jest.advanceTimersByTimeAsync(THEME_RESTORE_TIMEOUT_MS));
    expect(shown()).toBe('system:light:ready');

    await act(async () => read.resolve('dark'));

    expect(shown()).toBe('system:light:ready');
  });

  it('keeps a choice made before the read arrives', async () => {
    const read = deferred<string | null>();
    jest.mocked(AsyncStorage.getItem).mockReturnValueOnce(read.promise);

    await renderTheme();
    await choose('light');
    await act(async () => read.resolve('dark'));

    expect(shown()).toBe('light:light:ready');
    expect(await AsyncStorage.getItem(KEY)).toBe('light');
  });

  it('reads the stored preference once', async () => {
    await renderTheme();
    await choose('dark');
    await choose('system');

    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
  });
});

describe('following the device', () => {
  it('tracks light → dark → light while System is selected', async () => {
    await renderTheme();

    await setDeviceScheme('dark');
    expect(shown()).toBe('system:dark:ready');

    await setDeviceScheme('light');
    expect(shown()).toBe('system:light:ready');
  });

  it('reads an appearance the platform cannot report as light', async () => {
    deviceScheme = null;
    await renderTheme();
    expect(shown()).toBe('system:light:ready');

    await setDeviceScheme('unspecified');
    expect(shown()).toBe('system:light:ready');
  });

  it('ignores device changes under a manual choice', async () => {
    await renderTheme();
    await choose('light');

    await setDeviceScheme('dark');
    expect(shown()).toBe('light:light:ready');

    await choose('dark');
    await setDeviceScheme('light');
    expect(shown()).toBe('dark:dark:ready');
  });

  it('takes the device’s current appearance on returning to System, and follows it again', async () => {
    await renderTheme();
    await choose('light');
    await setDeviceScheme('dark');

    await choose('system');
    expect(shown()).toBe('system:dark:ready');

    await setDeviceScheme('light');
    expect(shown()).toBe('system:light:ready');
  });
});

describe('saving the preference', () => {
  it('applies a choice at once and stores the preference, not the resolved scheme', async () => {
    deviceScheme = 'dark';
    await renderTheme();

    await choose('light');
    expect(shown()).toBe('light:light:ready');

    await choose('system');
    await act(() => jest.advanceTimersByTimeAsync(0));

    expect(shown()).toBe('system:dark:ready');
    expect(await AsyncStorage.getItem(KEY)).toBe('system');
  });

  it('leaves the last of several rapid choices stored, writing one at a time', async () => {
    await renderTheme();
    const firstWrite = deferred<void>();
    jest.mocked(AsyncStorage.setItem).mockReturnValueOnce(firstWrite.promise);

    await choose('dark');
    await choose('light');
    await choose('system');
    await choose('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);

    await act(async () => firstWrite.resolve());

    expect(jest.mocked(AsyncStorage.setItem).mock.calls).toEqual([
      [KEY, 'dark'],
      [KEY, 'dark'],
    ]);
    expect(await AsyncStorage.getItem(KEY)).toBe('dark');
    expect(shown()).toBe('dark:dark:ready');
  });

  it('keeps the chosen appearance and reports it when the write fails', async () => {
    await renderTheme();
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));

    await choose('dark');
    await act(() => jest.advanceTimersByTimeAsync(0));

    expect(shown()).toBe('dark:dark:ready');
    expect(showGlobalAlert).toHaveBeenCalledWith(THEME_SAVE_FAILED_MESSAGE);
  });

  it('stays quiet about a failed write a newer choice has replaced', async () => {
    await renderTheme();
    const firstWrite = deferred<void>();
    jest.mocked(AsyncStorage.setItem).mockReturnValueOnce(firstWrite.promise);

    await choose('dark');
    await choose('light');
    await act(async () => firstWrite.reject(new Error('disk')));

    expect(showGlobalAlert).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem(KEY)).toBe('light');
  });
});

it('gives every consumer the same theme', async () => {
  render(
    <ThemeProvider>
      <Probe />
      <Probe testID="other" />
    </ThemeProvider>,
  );
  await act(() => jest.advanceTimersByTimeAsync(0));

  await choose('dark');

  expect(shown('other')).toBe('dark:dark:ready');
});
