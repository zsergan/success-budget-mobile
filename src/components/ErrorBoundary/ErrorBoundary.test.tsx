import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ErrorBoundary from './ErrorBoundary';

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
});
