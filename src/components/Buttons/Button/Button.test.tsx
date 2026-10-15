import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

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
