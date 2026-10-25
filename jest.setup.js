/* global jest */
// Reanimated's native CSS initializer requires a UI runtime that its Jest mock does not provide.
jest.mock('react-native-reanimated/src/initializers', () => ({ initializeReanimatedModule: jest.fn() }));

// Gesture Handler 3 subscribes to shared values; Reanimated's Jest mock omits these native listener methods.
jest.mock('react-native-reanimated/src/mock', () => {
  const actual = jest.requireActual('react-native-reanimated/src/mock');
  return {
    ...actual,
    useSharedValue: (initial) => {
      const value = actual.useSharedValue(initial);
      const addListener = jest.fn();
      const removeListener = jest.fn();
      return new Proxy(value, {
        get(target, property) {
          if (property === 'addListener') return addListener;
          if (property === 'removeListener') return removeListener;
          return Reflect.get(target, property);
        },
      });
    },
  };
});

// Native storage is not there under Jest; every test gets the library's in-memory stand-in.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// NetInfo is native too; its own mock reports a connected device.
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

// Shared UI reads the theme from context; every render gets the light fallback unless the test mounts a ThemeProvider.
jest.mock('@testing-library/react-native', () => {
  const actual = jest.requireActual('@testing-library/react-native');
  const { createElement } = jest.requireActual('react');
  const { ThemeFallback } = jest.requireActual('./src/components/ThemeProvider/ThemeProvider');

  const GestureHandlerRootViewContext = jest.requireActual(
    'react-native-gesture-handler/lib/module/GestureHandlerRootViewContext',
  ).default;

  const withTheme = (Wrapper) =>
    function ThemedWrapper({ children }) {
      return createElement(
        GestureHandlerRootViewContext,
        { value: true },
        createElement(ThemeFallback, null, Wrapper ? createElement(Wrapper, null, children) : children),
      );
    };

  // Copied as descriptors, not spread: `screen` is a live getter that each render rebinds.
  return Object.defineProperties(Object.create(null), {
    ...Object.getOwnPropertyDescriptors(actual),
    render: {
      enumerable: true,
      value: (ui, options = {}) => actual.render(ui, { ...options, wrapper: withTheme(options.wrapper) }),
    },
    renderHook: {
      enumerable: true,
      value: (callback, options = {}) =>
        actual.renderHook(callback, { ...options, wrapper: withTheme(options.wrapper) }),
    },
  });
});
