import { Provider } from 'react-redux';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { mapTransactionFeed } from '@api/models';
import { createAppStore } from '@redux/Store';
import { feedDto, transactionDto } from '@redux/state/transaction/fixtures';
import { TransactionKind, TransactionType } from '@shared/enums';
import { toLocalDateKey } from '@shared/utils';
import RecentTransactions from './RecentTransactions';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn(() => new Promise(() => {})) }),
}));
jest.mock('expo-secure-store');
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

const daysAgo = (days: number, hour = 9) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    transactionDto({
      id: `tx-${index}`,
      amount: `${index + 1}0.00`,
      description: `Row ${index}`,
      timestamp: daysAgo(index, 20 - index),
    }),
  );

const renderPreview = (props: Partial<ComponentProps<typeof RecentTransactions>>) => {
  const onViewAll = jest.fn();

  render(
    <Provider store={createAppStore()}>
      <RecentTransactions
        monthLabel="September"
        currencyCode="USD"
        isHidden={false}
        isLoading={false}
        hasError={false}
        onRetry={jest.fn()}
        onViewAll={onViewAll}
        onPressTransaction={jest.fn()}
        onDeleteTransaction={jest.fn()}
        {...props}
      />
    </Provider>,
  );

  return { onViewAll };
};

const shownRows = () => screen.queryAllByText(/^Row \d$/).map(({ props }) => props.children);

describe('RecentTransactions', () => {
  it('names itself a preview of the month, with the way to all of it', () => {
    const { onViewAll } = renderPreview({ recent: mapTransactionFeed(feedDto(rows(1))) });

    expect(screen.getByText('Recent transactions')).toBeTruthy();
    expect(screen.getByText('Latest transactions in September')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'All transactions for September' }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it.each([0, 1, 2, 3, 5])('shows at most three of %i records, newest first as the server sent them', (count) => {
    renderPreview({ recent: mapTransactionFeed(feedDto(rows(count))) });

    expect(shownRows()).toEqual(['Row 0', 'Row 1', 'Row 2'].slice(0, Math.min(count, 3)));
    expect(screen.getByRole('button', { name: 'All transactions for September' })).toBeTruthy();
  });

  it('dates every row on its own, with no day headers or day totals', () => {
    const today = toLocalDateKey(new Date());
    renderPreview({
      recent: mapTransactionFeed(feedDto(rows(3), { day_totals: [{ date: today, net: '-70.00' }] })),
    });

    expect(screen.getByText('· Today, 20:00')).toBeTruthy();
    expect(screen.getByText('· Yesterday, 19:00')).toBeTruthy();
    expect(screen.queryByText('Today')).toBeNull();
    expect(screen.queryByText('-70.00 USD')).toBeNull();
  });

  it('says the month has nothing in it', () => {
    renderPreview({ recent: mapTransactionFeed(feedDto([])), monthLabel: 'August 2025' });

    expect(screen.getByText('No transactions in August 2025.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'All transactions for August 2025' })).toBeTruthy();
  });

  it('hides the amounts when amounts are hidden', () => {
    renderPreview({ isHidden: true, recent: mapTransactionFeed(feedDto(rows(1))) });

    expect(screen.getByText('-••••')).toBeTruthy();
    expect(screen.queryByText('-10.00 USD')).toBeNull();
  });

  it('keeps a starting balance read-only, without Delete', () => {
    renderPreview({
      recent: mapTransactionFeed(
        feedDto([
          transactionDto({
            kind: TransactionKind.INITIAL_BALANCE,
            transaction_type: TransactionType.INCOME,
            timestamp: daysAgo(2),
          }),
        ]),
      ),
    });

    expect(screen.getByText('Archived')).toBeTruthy();
    expect(screen.queryByLabelText('Delete')).toBeNull();
  });

  it('shows a first load in progress, then a failed one as a failure with Retry', () => {
    const onRetry = jest.fn();
    renderPreview({ isLoading: true });
    expect(screen.getByLabelText('Loading recent transactions')).toBeTruthy();

    screen.rerender(
      <Provider store={createAppStore()}>
        <RecentTransactions
          monthLabel="September"
          isHidden={false}
          isLoading={false}
          hasError
          onRetry={onRetry}
          onViewAll={jest.fn()}
          onPressTransaction={jest.fn()}
          onDeleteTransaction={jest.fn()}
        />
      </Provider>,
    );
    expect(screen.getByText("Couldn't load recent transactions")).toBeTruthy();
    fireEvent.press(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('keeps the rows it has through a failed refresh', () => {
    renderPreview({ hasError: true, recent: mapTransactionFeed(feedDto(rows(2))) });

    expect(shownRows()).toEqual(['Row 0', 'Row 1']);
    expect(screen.queryByText("Couldn't load recent transactions")).toBeNull();
  });
});
