import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ActionRow from './ActionRow';

const METRICS = { frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 59, left: 0, right: 0, bottom: 34 } };

const renderRow = (props: Partial<Parameters<typeof ActionRow>[0]> = {}) =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ActionRow
        label="Save expense"
        helperText="Enter an amount"
        ready={false}
        isSaving={false}
        onPress={jest.fn()}
        {...props}
      />
    </SafeAreaProvider>,
  );

describe('ActionRow', () => {
  it('is pinned under the fields, clear of the home indicator, while the keyboard is down', () => {
    renderRow();

    expect(screen.getByText('Save expense')).toBeTruthy();
    expect(screen.getByText('Enter an amount')).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByText('Enter an amount').parent?.parent?.props.style).paddingBottom,
    ).toBeGreaterThan(34);
  });

  it('stays in the form while the keyboard is up, without the home indicator inset', () => {
    renderRow({ isInline: true });

    expect(screen.getByText('Save expense')).toBeTruthy();
    expect(screen.getByText('Enter an amount')).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByText('Enter an amount').parent?.parent?.props.style).backgroundColor,
    ).toBeUndefined();
  });

  it('shows the save under way', () => {
    renderRow({ isInline: true, isSaving: true, ready: true });

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeTruthy();
  });
});
