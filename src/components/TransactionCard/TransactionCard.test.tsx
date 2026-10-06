import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { deleteStarted } from '@redux/state/transactionFlow/slice';
import { TransactionKind, TransactionType } from '@shared/enums';
import TransactionCard from './TransactionCard';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn(() => new Promise(() => {})) }),
}));
jest.mock('expo-secure-store');
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

const renderCard = (overrides = {}) => {
  const store = createAppStore();
  const transaction = mapTransaction(transactionDto({ amount: '12.00', ...overrides }));
  const onPress = jest.fn();
  const onDelete = jest.fn();

  render(
    <Provider store={store}>
      <TransactionCard transaction={transaction} currencyCode="USD" onPress={onPress} onDelete={onDelete} />
    </Provider>,
  );

  return { store, transaction, onPress, onDelete };
};

describe('TransactionCard', () => {
  it('offers Delete under the row and hands over the record', () => {
    const { transaction, onDelete } = renderCard();

    fireEvent.press(screen.getByLabelText('Delete'));

    expect(onDelete).toHaveBeenCalledWith(transaction, expect.any(Function));
  });

  it('cannot be opened while its delete waits for the server', () => {
    const { store, onPress } = renderCard();

    act(() => {
      store.dispatch(deleteStarted({ transactionId: 'tx-1' }));
    });
    fireEvent.press(screen.getByText('Food'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByText('-12 USD')).toBeNull();
  });

  it('shows an initial balance neutrally, without a sign or Delete', () => {
    renderCard({ kind: TransactionKind.INITIAL_BALANCE, transaction_type: TransactionType.INCOME });

    expect(screen.getByText('12 USD')).toBeTruthy();
    expect(screen.queryByLabelText('Delete')).toBeNull();
  });
});
