import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import type { DateRange } from '@shared/utils';
import RangeCount from './RangeCount';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

jest.useFakeTimers();

const august: DateRange = { from: new Date(2026, 7, 1), to: new Date(2026, 7, 31, 23, 59, 59, 999), preset: 'month' };
const september: DateRange = {
  from: new Date(2026, 8, 1),
  to: new Date(2026, 8, 30, 23, 59, 59, 999),
  preset: 'month',
};

const renderCount = (range: DateRange) => {
  const store = createAppStore();
  store.dispatch(activateSpace(1));

  const view = render(
    <Provider store={store}>
      <RangeCount range={range} />
    </Provider>,
  );

  return { store, ...view };
};

const settle = () => act(async () => jest.advanceTimersByTimeAsync(10));

beforeEach(() => mockedRequest.mockReset());

describe('RangeCount', () => {
  it("counts the drafted range and never shows the previous range's number while the next one loads", async () => {
    let resolveSeptember: (value: unknown) => void = () => {};
    mockedRequest.mockImplementation(({ params }: { params: { from: string } }) =>
      params.from === august.from.toISOString()
        ? Promise.resolve({ data: { count: 42 } })
        : new Promise((resolve) => {
            resolveSeptember = resolve;
          }),
    );

    const { store, rerender } = renderCount(august);
    expect(screen.getByLabelText('Counting transactions')).toBeTruthy();
    await settle();
    expect(screen.getByText('42 transactions')).toBeTruthy();
    expect(mockedRequest.mock.calls[0][0]).toMatchObject({
      url: '/spaces/1/transactions/count',
      params: { from: august.from.toISOString(), to: august.to.toISOString() },
    });

    rerender(
      <Provider store={store}>
        <RangeCount range={september} />
      </Provider>,
    );
    expect(screen.queryByText('42 transactions')).toBeNull();
    expect(screen.getByLabelText('Counting transactions')).toBeTruthy();

    await act(async () => resolveSeptember({ data: { count: 3 } }));
    await settle();
    expect(screen.getByText('3 transactions')).toBeTruthy();
  });

  it('shows zero as no transactions', async () => {
    mockedRequest.mockResolvedValue({ data: { count: 0 } });

    renderCount(august);
    await settle();

    expect(screen.getByText('No transactions')).toBeTruthy();
  });

  it('shows a failed count with Retry', async () => {
    mockedRequest.mockRejectedValueOnce({ response: { data: { statusCode: 500, message: 'boom' } } });
    mockedRequest.mockResolvedValue({ data: { count: 1 } });

    renderCount(august);
    await settle();
    expect(screen.getByText('Couldn’t count transactions')).toBeTruthy();

    fireEvent.press(screen.getByText('Retry'));
    await settle();

    expect(screen.getByText('1 transaction')).toBeTruthy();
  });
});
