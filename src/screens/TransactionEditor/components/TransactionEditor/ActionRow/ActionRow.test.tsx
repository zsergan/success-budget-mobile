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
  it('is pinned under the fields while the keyboard is down', () => {
    renderRow();

    expect(screen.getByText('Save expense')).toBeTruthy();
    expect(screen.getByText('Enter an amount')).toBeTruthy();
  });

  it('steps aside while the keyboard is up', () => {
    renderRow({ isAboveKeyboard: true });

    expect(screen.queryByText('Save expense')).toBeNull();
    expect(screen.queryByText('Enter an amount')).toBeNull();
  });

  it('stays while a save is in progress, even with the keyboard up', () => {
    renderRow({ isAboveKeyboard: true, isSaving: true, ready: true });

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeTruthy();
  });
});
