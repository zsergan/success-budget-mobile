import { Provider } from 'react-redux';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { transactionDto } from '@redux/state/transaction/fixtures';
import type { MainTabNavigationProp } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import RecentActivity from './RecentActivity';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn(() => new Promise(() => {})) }),
}));
jest.mock('expo-secure-store');
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

const today = (hour: number) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const renderActivity = (props: Partial<ComponentProps<typeof RecentActivity>>) =>
  render(
    <Provider store={createAppStore()}>
      <RecentActivity
        navigation={{ navigate: jest.fn() } as unknown as MainTabNavigationProp<ScreenNames.HOME_TAB>}
        transactions={[]}
        currencyCode="USD"
        hasWallets
        isLoading={false}
        hasError={false}
        onRetry={jest.fn()}
        emptyState="trueEmpty"
        latest={null}
        onRetryLatest={jest.fn()}
        onJumpToLatest={jest.fn()}
        onPressTransaction={jest.fn()}
        onDeleteTransaction={jest.fn()}
        {...props}
      />
    </Provider>,
  );

describe('RecentActivity', () => {
  it('shows a few rows but totals their whole day', () => {
    const transactions = [1, 2, 3, 4, 5, 6, 7].map((hour) =>
      mapTransaction(transactionDto({ id: `tx-${hour}`, amount: '10.00', timestamp: today(23 - hour) })),
    );

    renderActivity({ transactions });

    expect(screen.getAllByText('-10.00 USD')).toHaveLength(5);
    expect(screen.getByText('-70.00 USD')).toBeTruthy();
  });

  it('tells an empty month from an empty history and leads to the latest record', () => {
    const latest = mapTransaction(transactionDto({ timestamp: new Date(2026, 7, 29, 12).toISOString() }));
    const onJumpToLatest = jest.fn();

    renderActivity({ emptyState: 'filteredEmpty', latest, onJumpToLatest });

    expect(screen.queryByText('Nothing here yet')).toBeNull();
    fireEvent.press(screen.getByText('Jump to 29.08.2026'));
    expect(onJumpToLatest).toHaveBeenCalledWith(latest);
  });

  it('keeps the first-run state for an empty history', () => {
    renderActivity({ emptyState: 'trueEmpty' });

    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });

  it('shows a failed month as a failure, never as loading', () => {
    renderActivity({ hasError: true, emptyState: 'loading' });

    expect(screen.getByText("Couldn't load recent activity")).toBeTruthy();
  });
});
