import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react-native';

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

describe('RecentActivity', () => {
  it('shows a few rows but totals their whole day', () => {
    const transactions = [1, 2, 3, 4, 5, 6, 7].map((hour) =>
      mapTransaction(transactionDto({ id: `tx-${hour}`, amount: '10.00', timestamp: today(23 - hour) })),
    );

    render(
      <Provider store={createAppStore()}>
        <RecentActivity
          navigation={{ navigate: jest.fn() } as unknown as MainTabNavigationProp<ScreenNames.HOME_TAB>}
          transactions={transactions}
          currencyCode="USD"
          hasWallets
          isLoading={false}
          hasError={false}
          onRetry={jest.fn()}
          onPressTransaction={jest.fn()}
          onDeleteTransaction={jest.fn()}
        />
      </Provider>,
    );

    expect(screen.getAllByText('-10.00 USD')).toHaveLength(5);
    expect(screen.getByText('-70.00 USD')).toBeTruthy();
  });
});
