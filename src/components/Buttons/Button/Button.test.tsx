import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import Button from './Button';

const boxOf = (title: string) => {
  const text = screen.getByText(title);
  const { borderWidth = 0, ...box } = StyleSheet.flatten(text.parent?.parent?.props.style);

  return { ...box, borderWidth, lineHeight: StyleSheet.flatten(text.props.style).lineHeight };
};

describe('a large button', () => {
  it.each(['primary', 'outline'] as const)(
    'grows with a %s label that large system text wraps, and is 56 tall without it',
    (variant) => {
      render(<Button title="Create account" size="lg" variant={variant} onPress={() => {}} />);

      const { height, minHeight, paddingVertical, borderWidth, lineHeight } = boxOf('Create account');

      expect(height).toBe('auto');
      expect(minHeight).toBe(56);
      expect(2 * (paddingVertical as number) + 2 * borderWidth + (lineHeight as number)).toBeLessThanOrEqual(56);
      expect(screen.getByText('Create account').props.numberOfLines).toBeUndefined();
    },
  );
});

describe('a loading button', () => {
  it('shows a spinner instead of its label, keeps the label for screen readers and ignores presses', () => {
    const onPress = jest.fn();

    render(<Button title="Sign In" size="lg" isLoading onPress={onPress} />);

    expect(screen.queryByText('Sign In')).toBeNull();

    const button = screen.getByRole('button', { name: 'Sign In' });

    expect(button.props.accessibilityState).toMatchObject({ busy: true });

    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('a large primary button', () => {
  it('glows while it can be pressed and loses the glow when disabled', () => {
    const { rerender } = render(<Button title="Sign In" size="lg" withShadow onPress={() => {}} />);
    const boxShadow = () => StyleSheet.flatten(screen.getByRole('button', { name: 'Sign In' }).props.style).boxShadow;

    expect(boxShadow()).toBeDefined();

    rerender(<Button title="Sign In" size="lg" withShadow disabled onPress={() => {}} />);

    expect(boxShadow()).toBeUndefined();
  });
});
