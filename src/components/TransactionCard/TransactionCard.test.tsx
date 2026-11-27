import { Provider } from 'react-redux';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { mapTransaction } from '@api/models';
import { baseApi } from '@redux/api/baseApi';
import { createAppStore } from '@redux/Store';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { deleteStarted } from '@redux/state/transactionFlow/slice';
import { withProfile } from '@redux/state/profile/fixtures';
import { spaceApi } from '@redux/state/space/api';
import { activateSpace } from '@redux/state/space/thunks';
import Icon from '@components/Icon/Icon';
import { AppColor, SpaceType, TransactionKind, TransactionType } from '@shared/enums';
import { colorThemes } from '@shared/theme';
import { calendarYear, deviceToday, shiftDays } from '@shared/utils';
import TransactionCard from './TransactionCard';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn(() => new Promise(() => {})) }),
}));
jest.mock('expo-secure-store');
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
// Native swipe animations do not run in Jest; expose the opened row's actions.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return React.forwardRef(function OpenSwipeable(
    { children, renderRightActions }: { children: React.ReactNode; renderRightActions: () => React.ReactNode },
    ref: React.ForwardedRef<unknown>,
  ) {
    React.useImperativeHandle(ref, () => ({ close: jest.fn() }));
    return React.createElement(View, null, children, renderRightActions());
  });
});

// Unmounting leaves each store's cache-removal and subscription-sync timers running past the test; the reset
// clears the first, and fake timers keep the sync one, which the reset leaves, from outliving the test.
jest.useFakeTimers();

const stores: ReturnType<typeof createAppStore>[] = [];

afterEach(() => {
  cleanup();
  stores.splice(0).forEach((store) => store.dispatch(baseApi.util.resetApiState()));
  jest.clearAllTimers();
});

const renderCard = (overrides = {}, spaceType?: SpaceType, { showsDay = false } = {}) => {
  const store = createAppStore();
  stores.push(store);
  if (spaceType) {
    withProfile(store, 7);
    store.dispatch(
      spaceApi.util.upsertQueryEntries([
        {
          endpointName: 'getSpaces',
          arg: undefined,
          value: [
            {
              id: 1,
              name: 'Space',
              type: spaceType,
              currency: { id: 1, code: 'USD', name: 'US Dollar' },
              role: 'owner',
              member_count: 1,
              created_at: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      ]),
    );
    store.dispatch(activateSpace(1));
  }
  const transaction = mapTransaction(transactionDto({ amount: '12.00', ...overrides }));
  const onPress = jest.fn();
  const onDelete = jest.fn();

  render(
    <Provider store={store}>
      <TransactionCard
        transaction={transaction}
        currencyCode="USD"
        showsDay={showsDay}
        onPress={onPress}
        onDelete={onDelete}
      />
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
    expect(screen.queryByText('-$12.00')).toBeNull();
  });

  it('shows an initial balance neutrally, without a sign or Delete', () => {
    renderCard({ kind: TransactionKind.INITIAL_BALANCE, transaction_type: TransactionType.INCOME });

    expect(screen.getByText('$12.00')).toBeTruthy();
    expect(screen.queryByLabelText('Delete')).toBeNull();
  });

  it('shows the description and assignment as separate parts, with no time', () => {
    renderCard({ description: 'Dinner with Anna', date: '2026-01-05' });

    expect(screen.getByText('Dinner with Anna')).toBeTruthy();
    expect(screen.getByText('Zakhar')).toBeTruthy();
    expect(screen.queryByText(/\d:\d\d/)).toBeNull();
  });

  const today = deviceToday();
  const lastYear = `${calendarYear(today) - 1}-03-04`;
  it.each([
    ['today', today, ' · Today'],
    ['yesterday', shiftDays(today, -1), ' · Yesterday'],
    ['last year', lastYear, ` · Mar 4, ${calendarYear(today) - 1}`],
  ])('names the row’s stored date where asked to: %s', (_name, date, text) => {
    renderCard({ description: null, date }, undefined, { showsDay: true });

    expect(screen.getByText(text)).toBeTruthy();
  });

  it('leaves the date to the day header in a history', () => {
    renderCard({ description: null, date: deviceToday() });

    expect(screen.queryByText(/Today/)).toBeNull();
  });

  it('drops the second line when it has nothing to say', () => {
    renderCard({ description: null, date: deviceToday() }, SpaceType.PERSONAL);

    expect(screen.queryByText(' · ')).toBeNull();
    expect(screen.queryByText('You')).toBeNull();
  });

  it('starts the second line with the assignment when there is no description', () => {
    renderCard({ description: null });

    expect(screen.getAllByText('Food')).toHaveLength(1);
    expect(screen.queryByText(' · ')).toBeNull();
    expect(screen.getByText('Zakhar')).toBeTruthy();
  });

  it.each([
    ['Whole space', { kind: 'space', user_id: null, name: null, status: null }],
    ['No member assigned', { kind: 'unassigned', user_id: null, name: null, status: null }],
    ['Lena · Former member', { kind: 'member', user_id: 31, name: 'Lena', status: 'former_member' }],
    ['Deleted member', { kind: 'member', user_id: null, name: null, status: 'deleted' }],
  ])('names the assignment %s', (label, assignment) => {
    renderCard({ assignment });

    expect(screen.getByText(label)).toBeTruthy();
  });

  it('leaves the ordinary You unsaid in a personal space, and names everything else', () => {
    renderCard({ description: 'Market', date: '2026-01-05' }, SpaceType.PERSONAL);

    expect(screen.queryByText('You')).toBeNull();
    expect(screen.getByText('Market')).toBeTruthy();
    expect(screen.queryByText(' · ')).toBeNull();
  });

  it('names the whole space in a personal space, and the user as You in a shared one', () => {
    renderCard({ assignment: { kind: 'space', user_id: null, name: null, status: null } }, SpaceType.PERSONAL);
    expect(screen.getByText('Whole space')).toBeTruthy();

    screen.unmount();
    renderCard({}, SpaceType.GROUP);
    expect(screen.getByText('You')).toBeTruthy();
  });

  it('marks a record moved from wallets, and a starting balance as archived without an assignee', () => {
    renderCard({ author: { user_id: 7, name: 'Zakhar', status: 'member', source: 'imported' } });
    expect(screen.getByText('Imported')).toBeTruthy();

    screen.unmount();
    renderCard({ kind: TransactionKind.INITIAL_BALANCE, transaction_type: TransactionType.INCOME, description: null });
    expect(screen.getByText('Archived')).toBeTruthy();
    expect(screen.queryByText('Zakhar')).toBeNull();
  });
});

describe('TransactionCard category colour', () => {
  const glyphColor = () => screen.UNSAFE_getAllByType(Icon)[0].props.color;

  it('draws the glyph in its category’s preset colour', () => {
    renderCard({ category: { ...transactionDto().category, color: AppColor.CLAY } });

    expect(glyphColor()).toBe(colorThemes.light.categories[AppColor.CLAY].stroke);
  });

  it('draws the glyph in its category’s custom colour', () => {
    renderCard({ category: { ...transactionDto().category, color: '#0F8F8A' } });

    expect(glyphColor()).toBe('rgb(15,143,138)');
  });

  it('keeps a starting balance neutral', () => {
    renderCard({
      kind: TransactionKind.INITIAL_BALANCE,
      transaction_type: TransactionType.INCOME,
      category: { ...transactionDto().category, color: AppColor.CLAY },
    });

    expect(glyphColor()).toBe(colorThemes.light.colors.text);
  });
});
