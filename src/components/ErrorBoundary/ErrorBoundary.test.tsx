import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import { colorThemes } from '@shared/theme';

import ErrorBoundary from './ErrorBoundary';

// The real render, without the theme jest.setup.js wraps every test in.
const { render: renderWithoutTheme } = jest.requireActual('@testing-library/react-native');

const messageColor = () =>
  StyleSheet.flatten(screen.getByText('Something went wrong. Please try again.').props.style).color;

const ThrowsOnRender = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  // Suppress the expected console.error noise from the caught render error.
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Text>All good</Text>
      </ErrorBoundary>,
    );

    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('shows a fallback instead of crashing when a child throws during render', () => {
    render(
      <ErrorBoundary>
        <ThrowsOnRender />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy();
  });

  it('lets the user retry after an error, re-mounting the children', () => {
    render(
      <ErrorBoundary>
        <ThrowsOnRender />
      </ErrorBoundary>,
    );

    fireEvent.press(screen.getByText('Try again'));

    expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy();
  });

  it('draws its fallback in the light palette when no theme is provided', () => {
    renderWithoutTheme(
      <ErrorBoundary>
        <ThrowsOnRender />
      </ErrorBoundary>,
    );

    expect(messageColor()).toBe(colorThemes.light.colors.muted);
    expect(screen.getByText('Try again')).toBeTruthy();
  });

  it('draws its fallback in the active theme', async () => {
    const { setTheme } = await renderWithTheme(
      <ErrorBoundary>
        <ThrowsOnRender />
      </ErrorBoundary>,
    );

    await setTheme('dark');

    expect(messageColor()).toBe(colorThemes.dark.colors.muted);
  });
});
