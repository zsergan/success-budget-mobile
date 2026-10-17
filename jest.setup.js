/* global jest */
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

  const withTheme = (Wrapper) =>
    function ThemedWrapper({ children }) {
      return createElement(ThemeFallback, null, Wrapper ? createElement(Wrapper, null, children) : children);
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
