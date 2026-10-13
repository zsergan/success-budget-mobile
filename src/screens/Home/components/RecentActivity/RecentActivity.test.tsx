import { Provider } from 'react-redux';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react-native';

import { mapTransactionFeed } from '@api/models';
import { createAppStore } from '@redux/Store';
import { feedDto, transactionDto } from '@redux/state/transaction/fixtures';
import { toLocalDateKey } from '@shared/utils';
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
        currencyCode="USD"
        hasWallets
        isLoading={false}
        hasError={false}
        onRetry={jest.fn()}
        onPressTransaction={jest.fn()}
        onDeleteTransaction={jest.fn()}
        {...props}
      />
    </Provider>,
  );

describe('RecentActivity', () => {
  it('shows the latest records with the server total of each whole day', () => {
    const items = [1, 2, 3, 4, 5].map((hour) =>
      transactionDto({ id: `tx-${hour}`, amount: '10.00', timestamp: today(23 - hour) }),
    );

    renderActivity({
      recent: mapTransactionFeed(feedDto(items, { day_totals: [{ date: toLocalDateKey(new Date()), net: '-70.00' }] })),
    });

    expect(screen.getAllByText('-10.00 USD')).toHaveLength(5);
    expect(screen.getByText('-70.00 USD')).toBeTruthy();
  });

  it('keeps the first-run state for an empty history', () => {
    renderActivity({ recent: mapTransactionFeed(feedDto([])) });

    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });

  it('shows a failed load as a failure, never as loading', () => {
    renderActivity({ hasError: true });

    expect(screen.getByText("Couldn't load recent activity")).toBeTruthy();
  });
});
