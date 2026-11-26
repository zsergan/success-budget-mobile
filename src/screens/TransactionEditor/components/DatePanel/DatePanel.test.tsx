import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createAppStore } from '@redux/Store';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { createOpened, dateOpened } from '@redux/state/transactionFlow/slice';
import { TransactionType } from '@shared/enums';
import DatePanel from './DatePanel';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('expo-secure-store');

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderPanel = () => {
  const store = createAppStore();
  store.dispatch(
    createOpened({
      spaceId: 1,
      transactionType: TransactionType.EXPENSE,
      assignment: { kind: 'space' },
      today: '2026-10-07',
    }),
  );
  store.dispatch(dateOpened());
  const onCancel = jest.fn();
  const flow = () => selectTransactionFlow(store.getState());
  const pending = () => {
    const view = flow()?.view;

    return view?.name === 'date' ? view.pending : null;
  };
  const panel = () => (
    <SafeAreaProvider initialMetrics={METRICS}>
      <Provider store={store}>
        <DatePanel pending={pending()!} onCancel={onCancel} />
      </Provider>
    </SafeAreaProvider>
  );
  const view = render(panel());

  return { onCancel, pending, flow, rerender: () => view.rerender(panel()) };
};

beforeEach(() => {
  // 9:00 on Wednesday, Oct 7, 2026, in the device zone.
  jest.useFakeTimers({ now: new Date(2026, 9, 7, 9, 0) });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('DatePanel', () => {
  it('picks a day only, with no time anywhere', () => {
    renderPanel();

    expect(screen.getByText('Date')).toBeTruthy();
    expect(screen.getByText('October 2026')).toBeTruthy();
    expect(screen.getByText('Future days aren’t available.')).toBeTruthy();
    expect(screen.queryByText(/\d:\d\d/)).toBeNull();
    expect(screen.queryByText(/time/i)).toBeNull();
  });

  it('moves the pending date with Yesterday and a day of the calendar, and the draft only on Apply', () => {
    const { pending, rerender, flow } = renderPanel();

    fireEvent.press(screen.getByText('Yesterday'));
    expect(pending()).toBe('2026-10-06');
    rerender();
    expect(screen.getByRole('button', { name: 'Yesterday' }).props.accessibilityState).toMatchObject({
      selected: true,
    });

    fireEvent.press(screen.getByText('2'));
    expect(pending()).toBe('2026-10-02');
    expect(flow()?.draft?.date).toBe('2026-10-07');

    fireEvent.press(screen.getByText('Apply'));
    expect(flow()).toMatchObject({ view: { name: 'create' }, followsToday: false, draft: { date: '2026-10-02' } });
  });

  it('cannot pick a day after today', () => {
    const { pending } = renderPanel();

    fireEvent.press(screen.getByText('8'));

    expect(pending()).toBe('2026-10-07');
  });

  it('keeps the date following today when Today is applied', () => {
    const { flow } = renderPanel();

    fireEvent.press(screen.getByText('Yesterday'));
    fireEvent.press(screen.getByText('Today'));
    fireEvent.press(screen.getByText('Apply'));

    expect(flow()).toMatchObject({ followsToday: true, draft: { date: '2026-10-07' } });
  });

  it('leaves the draft as it was on Cancel', () => {
    const { onCancel, flow } = renderPanel();

    fireEvent.press(screen.getByText('Yesterday'));
    fireEvent.press(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(flow()?.draft?.date).toBe('2026-10-07');
  });
});
