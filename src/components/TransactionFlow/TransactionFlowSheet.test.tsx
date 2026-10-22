import type { ReactNode, Ref } from 'react';
import { useState } from 'react';
import type { AppStateStatus } from 'react-native';
import { AccessibilityInfo, Alert, AppState, BackHandler, PixelRatio, Text } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { Category, GetCategoriesResponse, GetLimitsResponse, WalletsOverviewResponse } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import { transactionApi } from '@redux/state/transaction/api';
import { createTransactionResponseDto, transactionDto } from '@redux/state/transaction/fixtures';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { mapTransaction } from '@api/models';
import { awayEnded, awayStarted, createOpened, walletCreated } from '@redux/state/transactionFlow/slice';
import type { ViewSelection } from '@redux/state/transactionFlow/selection';
import { checkFlowRecord, openTransactionDetails } from '@redux/state/transactionFlow/thunks';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import { ScreenNames, AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import { colorThemes } from '@shared/theme';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import { useBackPress, useSheetPresence } from '@hooks';
import TransactionFlowSheet from './TransactionFlowSheet';

interface SheetProps {
  children: ReactNode;
  onAnimate?: (fromIndex: number, toIndex: number) => void;
  onDismiss?: () => void;
  backdropComponent?: (props: object) => ReactNode;
  handleComponent?: (() => ReactNode) | null;
  enablePanDownToClose?: boolean;
}

const mockCategorySheet: { holdDismiss: boolean; finishDismiss?: () => void } = { holdDismiss: false };

const mockSheet: { props?: SheetProps; presents: number; keptOpen: number; swipeDown?: () => void } = {
  presents: 0,
  keptOpen: 0,
};

// The flow sheet's way back into place runs on the UI thread; here a test says when it got there.
const mockReturn: { finish?: () => void } = {};
jest.mock('@components/Modals/BottomSheetModal/useReturnToRest', () => (onRest: () => void) => ({
  animatedIndex: undefined,
  watch: () => {
    mockReturn.finish = onRest;
  },
  stop: () => {},
}));

const finishReturn = () => {
  const finish = mockReturn.finish;
  mockReturn.finish = undefined;
  act(() => finish?.());
};

// A swipe starting to close the flow sheet; true when the sheet snapped back into place instead.
const startSwipeClose = () => {
  const before = mockSheet.keptOpen;
  act(() => mockSheet.props?.onAnimate?.(0, -1));
  finishReturn();
  return mockSheet.keptOpen > before;
};

const mockBack: { press?: () => boolean | null | undefined } = {};
const pressBack = () => act(() => void mockBack.press?.());

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const { ScrollView, TextInput, View } = jest.requireActual('react-native');
  const SheetContext = React.createContext({ close: () => {} });

  // Shows its content only between present() and dismiss(), as the real modal does. The first sheet is the flow's.
  // Like the library, a dismiss() of a sheet that is not shown leaves it stuck: no later present() shows it.
  const BottomSheetModal = React.forwardRef(function BottomSheetModal(props: SheetProps, ref: Ref<unknown>) {
    const [isOpen, setOpen] = React.useState(false);
    const isOpenRef = React.useRef(false);
    const isStuckRef = React.useRef(false);
    const isFlowSheet = React.useRef(mockSheet.props === undefined || mockSheet.props === props).current;
    if (isFlowSheet) mockSheet.props = props;

    const dismiss = () => {
      if (!isOpenRef.current) {
        isStuckRef.current = true;
        return;
      }
      const finish = () => {
        isOpenRef.current = false;
        setOpen(false);
        props.onDismiss?.();
      };
      if (!isFlowSheet && mockCategorySheet.holdDismiss) mockCategorySheet.finishDismiss = finish;
      else finish();
    };

    if (isFlowSheet) mockSheet.swipeDown = dismiss;

    React.useImperativeHandle(ref, () => ({
      present: () => {
        if (isFlowSheet) mockSheet.presents += 1;
        if (isStuckRef.current) return;
        isOpenRef.current = true;
        setOpen(true);
      },
      dismiss,
      snapToIndex: () => {
        if (isFlowSheet) mockSheet.keptOpen += 1;
      },
    }));

    return isOpen ? (
      <SheetContext.Provider value={{ close: dismiss }}>
        {props.handleComponent?.()}
        {props.children}
      </SheetContext.Provider>
    ) : null;
  });

  return {
    BottomSheetModal,
    BottomSheetBackdrop: () => null,
    BottomSheetView: View,
    BottomSheetScrollView: ScrollView,
    BottomSheetTextInput: TextInput,
    useBottomSheet: () => React.useContext(SheetContext),
  };
});

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@react-native-community/datetimepicker', () => () => null);

const mockAddAlert = jest.fn();
jest.mock('@hooks/useAlert', () => () => ({ addAlert: mockAddAlert }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'key-1' }));

const mockedRequest = jest.fn();
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

jest.useFakeTimers();

const category = (id: number, name: string, transactionType = TransactionType.EXPENSE): Category => ({
  id,
  name,
  transaction_type: transactionType,
  icon: 'Grocery',
  color: AppColor.SLATE,
  is_active: 1,
  transaction_count: 0,
  limit: null,
  archived_at: null,
});

const categories: GetCategoriesResponse = {
  expenses: [
    category(1, 'Food'),
    category(2, 'Taxi'),
    ...Array.from({ length: 8 }, (_, index) => category(index + 3, `Spend ${index + 3}`)),
  ],
  incomes: [],
  archived: [],
};

const wallets: WalletsOverviewResponse = {
  total_balance: 0,
  total_balance_currency: 'USD',
  delta_percent: 0,
  wallets: [
    { wallet: { id: 7, wallet_name: 'Cash', design: AppColor.SLATE, balance: 100 }, total_income: 0, total_spend: 0 },
  ],
};

const noLimits: GetLimitsResponse = { total: null, categories: [], over_allocation: null };

let walletsResponse = wallets;
let categoriesResponse = categories;
let limitsResponse = noLimits;

interface Answer {
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

// Writes are answered in the order they are sent, also when the answer is given before the write goes out.
let writeAnswers: Answer[] = [];
let sentWrites = 0;
let answeredWrites = 0;

const writeAnswer = (index: number) => {
  while (writeAnswers.length <= index) {
    const answer = {} as Answer;
    answer.promise = new Promise((resolve, reject) => Object.assign(answer, { resolve, reject }));
    answer.promise.catch(() => {});
    writeAnswers.push(answer);
  }
  return writeAnswers[index];
};

const answerWrite = (value: unknown) => writeAnswer(answeredWrites++).resolve(value);
const failWrite = (reason: unknown) => writeAnswer(answeredWrites++).reject(reason);
let answerRead: (() => Promise<unknown>) | null = null;

const refusal = (statusCode: number, code: string) => ({
  response: { status: statusCode, data: { statusCode, code, message: code } },
});

let stored = transactionDto({ amount: '50.00', version: 2 });

let answerOperation = () =>
  Promise.resolve({
    data: {
      operation_id: 'key-1',
      status: 'applied',
      transaction_id: 'tx-1',
      created_at: stored.timestamp,
      deleted_at: null,
      transaction: stored,
    },
  });
const defaultAnswerOperation = answerOperation;

const respond = ({ url, method }: { url: string; method: string }) => {
  if (method === 'POST' && url.endsWith('/categories')) {
    return Promise.resolve({ data: category(30, 'Bonus', TransactionType.INCOME) });
  }
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
    return writeAnswer(sentWrites++).promise;
  }
  if (url.includes('/transactions/operations/')) return answerOperation();
  if (url.endsWith('/transactions/tx-1')) return answerRead ? answerRead() : Promise.resolve({ data: stored });
  if (url.endsWith('/wallets')) return Promise.resolve({ data: walletsResponse });
  if (url.endsWith('/categories')) return Promise.resolve({ data: categoriesResponse });
  if (url.endsWith('/limits')) return Promise.resolve({ data: limitsResponse });

  return Promise.resolve({ data: [] });
};

const flowTree = (store: ReturnType<typeof createAppStore>) => (
  <Provider store={store}>
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 400, height: 800 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <TransactionFlowSheet />
    </SafeAreaProvider>
  </Provider>
);

const renderFlow = () => {
  const store = createAppStore();
  withProfile(store);

  store.dispatch(activateSpace(1));

  render(flowTree(store));

  const open = (
    transactionType = TransactionType.EXPENSE,
    walletId: number | null = 7,
    selection: ViewSelection | null = null,
  ) =>
    act(() => {
      store.dispatch(createOpened({ spaceId: 1, transactionType, walletId, now: new Date().toISOString(), selection }));
    });

  const openDetails = () =>
    act(() => {
      store.dispatch(openTransactionDetails({ spaceId: 1, transaction: mapTransaction(stored) }));
    });

  return { store, open, openDetails, flow: () => selectTransactionFlow(store.getState()) };
};

// Keeps the record's cache entry, as an open screen would, so a failed read could fall back on it.
const holdRecordInCache = (store: ReturnType<typeof createAppStore>) =>
  store.dispatch(transactionApi.endpoints.getTransaction.initiate({ spaceId: 1, transactionId: 'tx-1' }));

const settle = () => act(async () => jest.runOnlyPendingTimersAsync());

const fillExpense = () => {
  fireEvent.changeText(screen.getByLabelText('Amount'), '12');
  fireEvent.press(screen.getByText('Food'));
};

const pressBackdrop = () =>
  act(() => (mockSheet.props?.backdropComponent?.({}) as { props: { onPress?: () => void } }).props.onPress?.());

beforeEach(() => {
  jest.clearAllMocks();
  mockCategorySheet.holdDismiss = false;
  mockCategorySheet.finishDismiss = undefined;
  writeAnswers = [];
  sentWrites = 0;
  answeredWrites = 0;
  mockSheet.props = undefined;
  stored = transactionDto({ amount: '50.00', version: 2 });
  answerRead = null;
  answerOperation = defaultAnswerOperation;
  walletsResponse = wallets;
  categoriesResponse = categories;
  limitsResponse = noLimits;
  mockSheet.presents = 0;
  mockReturn.finish = undefined;
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    mockBack.press = () => handler({} as never);
    return { remove: () => {} };
  });
  mockedRequest.mockImplementation(respond);
  jest.spyOn(Alert, 'alert');
  jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1);
});

describe('TransactionFlowSheet', () => {
  it('keeps an unfinished transaction open and filled in through a theme change', async () => {
    const store = createAppStore();
    withProfile(store);
    store.dispatch(activateSpace(1));
    const { setTheme } = await renderWithTheme(flowTree(store));

    act(() => {
      store.dispatch(
        createOpened({
          spaceId: 1,
          transactionType: TransactionType.EXPENSE,
          walletId: 7,
          now: new Date().toISOString(),
          selection: null,
        }),
      );
    });
    await settle();
    fillExpense();

    await setTheme('dark');
    await settle();

    expect(mockSheet.presents).toBe(1);
    expect(screen.getByLabelText('Amount').props.value).toBe('12');
    expect(selectTransactionFlow(store.getState())?.draft).toMatchObject({ amount: '12' });
    expect(screen.getByText('Save expense')).toHaveStyle({ color: colorThemes.dark.colors.onDanger });
  });

  it('opens one sheet and keeps it when asked to open again', async () => {
    const { open } = renderFlow();

    open();
    open(TransactionType.INCOME);
    await settle();

    expect(mockSheet.presents).toBe(1);
    expect(screen.getAllByText('New transaction')).toHaveLength(1);
    expect(screen.getByText('Save expense')).toBeTruthy();
  });

  it('opens again after it was closed by its button or by a swipe', async () => {
    const { open, openDetails, flow } = renderFlow();

    open();
    await settle();
    fireEvent.press(screen.getByLabelText('Close'));
    await settle();
    expect(flow()).toBeNull();

    openDetails();
    await settle();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();

    act(() => mockSheet.swipeDown?.());
    await settle();
    expect(flow()).toBeNull();

    open();
    await settle();
    expect(screen.getByText('Save expense')).toBeTruthy();
  });

  it('asks before a swipe discards entered values, and lets an untouched form go', async () => {
    const { open } = renderFlow();
    open();
    await settle();
    expect(startSwipeClose()).toBe(false);

    fillExpense();

    expect(startSwipeClose()).toBe(true);
    expect(Alert.alert).toHaveBeenCalledWith('Discard transaction?', expect.any(String), expect.any(Array));
  });

  it('asks before a swipe discards only once the sheet is back in place', async () => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();

    act(() => mockSheet.props?.onAnimate?.(0, -1));
    expect(Alert.alert).not.toHaveBeenCalled();

    finishReturn();

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(flow()?.draft).toMatchObject({ amount: '12' });
  });

  it('opens one confirmation at a time, whichever way it is asked for', async () => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();

    fireEvent.press(screen.getByLabelText('Close'));
    pressBack();
    pressBackdrop();
    expect(startSwipeClose()).toBe(true);
    expect(Alert.alert).toHaveBeenCalledTimes(1);

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    act(() => buttons[1].onPress());
    pressBack();

    expect(Alert.alert).toHaveBeenCalledTimes(2);
    expect(flow()?.draft).toMatchObject({ amount: '12' });
  });

  it('opens and closes a sheet pushed above the form, leaving the form as it was', async () => {
    const store = createAppStore();
    withProfile(store);
    store.dispatch(activateSpace(1));
    const stacked: { show?: (isShown: boolean) => void } = {};

    const StackedSheet = () => {
      const [isShown, setShown] = useState(false);
      stacked.show = setShown;
      const { ref, settleDismiss } = useSheetPresence(isShown);
      useBackPress(isShown, () => setShown(false));

      return (
        <BottomModal ref={ref} fitContent stackBehavior="push" onDismiss={() => settleDismiss() && setShown(false)}>
          <Text>Stacked above</Text>
        </BottomModal>
      );
    };

    render(
      <>
        {flowTree(store)}
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 400, height: 800 },
            insets: { top: 0, right: 0, bottom: 0, left: 0 },
          }}
        >
          <StackedSheet />
        </SafeAreaProvider>
      </>,
    );
    act(() => {
      store.dispatch(
        createOpened({
          spaceId: 1,
          transactionType: TransactionType.EXPENSE,
          walletId: 7,
          now: new Date().toISOString(),
        }),
      );
    });
    await settle();
    fillExpense();

    act(() => stacked.show?.(true));
    await settle();
    expect(screen.getByText('Stacked above')).toBeTruthy();

    pressBack();
    await settle();

    expect(screen.queryByText('Stacked above')).toBeNull();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockSheet.presents).toBe(1);
    expect(screen.getAllByText('New transaction')).toHaveLength(1);
    expect(screen.getByLabelText('Amount').props.value).toBe('12');

    pressBack();

    expect(Alert.alert).toHaveBeenCalledWith('Discard transaction?', expect.any(String), expect.any(Array));
  });

  it('confirms only after the API answers, locking the sheet meanwhile', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));

    expect(screen.getByText('Saving…')).toBeTruthy();
    expect(screen.queryByText('Transaction saved')).toBeNull();
    expect(mockSheet.props?.enablePanDownToClose).toBe(false);
    expect(startSwipeClose()).toBe(true);

    fireEvent.press(screen.getByLabelText('Close'));
    pressBackdrop();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(flow()?.isSaving).toBe(true);

    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    expect(screen.getByText('Transaction saved')).toBeTruthy();
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', data: expect.objectContaining({ amount: '12.00', category_id: 1 }) }),
    );
  });

  it('keeps saying a save is not confirmed, and tries it again with the same key', async () => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();

    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => failWrite(new Error('timeout of 20000ms exceeded')));
    await settle();

    expect(screen.getByText('Not confirmed yet')).toBeTruthy();
    expect(mockAddAlert).not.toHaveBeenCalled();
    expect(flow()).toMatchObject({ view: { name: 'create' }, notice: 'saveUnknown' });

    fireEvent.press(screen.getByText('Try again'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    const posts = mockedRequest.mock.calls.filter(([config]) => config.method === 'POST');
    expect(posts).toHaveLength(2);
    expect(posts[1][0]).toEqual(posts[0][0]);
    expect(posts[0][0].data.client_operation_id).toBe(posts[0][0].headers['Idempotency-Key']);
    expect(screen.getByText('Transaction saved')).toBeTruthy();
  });

  it('turns into an edit of the record an unconfirmed create made, and saves later changes only on request', async () => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => failWrite(new Error('Network Error')));
    await settle();

    fireEvent.changeText(screen.getByLabelText('Amount'), '25');
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto({ amount: '12.00', version: 1 }) }));
    await settle();

    expect(screen.getByText('Edit transaction')).toBeTruthy();
    expect(screen.getByText('Your earlier save went through')).toBeTruthy();
    expect(flow()).toMatchObject({
      view: { name: 'edit' },
      saved: { id: 'tx-1', version: 1 },
      baseline: { amount: '12.00' },
      draft: { amount: '25' },
    });
    expect(mockedRequest.mock.calls.filter(([config]) => config.method !== 'GET')).toHaveLength(2);

    fireEvent.press(screen.getByText('Save changes'));
    await act(async () => failWrite(refusal(409, 'TRANSACTION_VERSION_CONFLICT')));
    await settle();

    const [patch] = mockedRequest.mock.calls.filter(([config]) => config.method === 'PATCH');
    expect(patch[0]).toMatchObject({ data: { amount: '25.00' }, headers: { 'If-Match': '"1"' } });
    expect(screen.getByText('This transaction was changed')).toBeTruthy();
    expect(flow()).toMatchObject({ notice: 'conflict', draft: { amount: '25' } });
  });

  it('closes on request with a save not confirmed, and keeps that save to settle later', async () => {
    const { store, open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => failWrite(new Error('Network Error')));
    await settle();

    expect(startSwipeClose()).toBe(true);
    const [title, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(title).toBe('Close without confirmation?');

    act(() => buttons[0].onPress());

    expect(flow()).toBeNull();
    expect(store.getState().pendingWrite.writes).toMatchObject([
      { status: 'unknown', operation: { type: 'create', data: { amount: '12.00', category_id: 1 } } },
    ]);
  });

  it('says why the server refused a save until the form changes', async () => {
    const { open } = renderFlow();
    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () =>
      failWrite({
        response: {
          status: 400,
          data: { statusCode: 400, code: 'CATEGORY_ARCHIVED', message: 'This category is archived' },
        },
      }),
    );
    await settle();

    expect(screen.getByText('The server refused this save')).toBeTruthy();
    expect(screen.getByText('This category is archived')).toBeTruthy();

    fireEvent.press(screen.getByText('Taxi'));

    expect(screen.queryByText('The server refused this save')).toBeNull();
  });

  it('shows the record when an earlier attempt of the create had saved it', async () => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => failWrite(refusal(409, 'TRANSACTION_OPERATION_EXISTS')));
    await settle();

    expect(flow()).toMatchObject({ view: { name: 'details' }, saved: { id: 'tx-1' }, draft: null });
    expect(mockAddAlert).toHaveBeenCalledWith('This transaction was already saved');
    expect(mockedRequest.mock.calls.filter(([config]) => config.method === 'POST')).toHaveLength(1);
  });

  it('sends one create for a double tap on Save', async () => {
    const { open } = renderFlow();
    open();
    await settle();
    fillExpense();

    fireEvent.press(screen.getByText('Save expense'));
    fireEvent.press(screen.getByText('Saving…'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    const posts = mockedRequest.mock.calls.filter(([config]) => config.method === 'POST');
    expect(posts).toHaveLength(1);
    expect(screen.getByText('Transaction saved')).toBeTruthy();
  });

  it('keeps a confirmed create confirmed when the refresh after it fails', async () => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));

    mockedRequest.mockImplementation((config: { url: string; method: string }) =>
      config.method === 'GET' ? Promise.reject(refusal(500, 'INTERNAL_SERVER_ERROR')) : respond(config),
    );
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));
    await act(async () => jest.advanceTimersByTimeAsync(100));

    expect(mockedRequest).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET', url: '/spaces/1/wallets' }));
    expect(screen.getByText('Transaction saved')).toBeTruthy();
    expect(flow()?.view.name).toBe('created');
    expect(mockAddAlert).not.toHaveBeenCalled();
  });

  it('shows what was saved and closes by itself, unless touched', async () => {
    const { store, open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    expect(screen.getByText(/^Food · Cash · Jan 5, \d\d:00$/)).toBeTruthy();
    expect(screen.getByText('Cash balance 90 · was 100')).toBeTruthy();

    await act(async () => jest.advanceTimersByTime(3000));
    act(() => {
      store.dispatch(baseApi.util.invalidateTags(spaceTags(1, 'Transactions', 'Wallets')));
    });
    await act(async () => jest.advanceTimersByTime(2100));
    expect(flow()).toBeNull();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));
    fireEvent(screen.getByText('Transaction saved'), 'touchStart');
    await act(async () => jest.advanceTimersByTime(10000));

    expect(flow()?.view.name).toBe('created');
    fireEvent.press(screen.getByText('Done'));
    expect(flow()).toBeNull();
  });

  it('leaves the confirmation open in large type, where it could go before it is read', async () => {
    jest.spyOn(PixelRatio, 'getFontScale').mockReturnValue(1.5);
    const { open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));
    await act(async () => jest.advanceTimersByTime(10000));

    expect(flow()?.view.name).toBe('created');
  });

  it('stops the countdown when the sheet handle is touched', async () => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));
    fireEvent(screen.getByTestId('bottom-sheet-handle'), 'touchStart');
    await act(async () => jest.advanceTimersByTime(10000));
    expect(flow()?.view.name).toBe('created');
  });

  it('stops the countdown if a screen reader is enabled while the confirmation is open', async () => {
    const subscribe = jest.spyOn(AccessibilityInfo, 'addEventListener');
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));
    const subscriptions = subscribe.mock.calls as unknown as [string, (enabled: boolean) => void][];
    const readerChanged = subscriptions.find(([event]) => event === 'screenReaderChanged')?.[1];
    expect(readerChanged).toBeDefined();
    act(() => readerChanged?.(true));
    await act(async () => jest.advanceTimersByTime(10000));
    expect(flow()?.view.name).toBe('created');
  });

  it('undoes the create by deleting that record at its version, locking the rest meanwhile', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto({ id: 'tx-9', version: 1 }) }));

    fireEvent.press(screen.getByText('Undo'));
    expect(screen.getByText('Undoing…')).toBeTruthy();
    fireEvent.press(screen.getByText('Done'));
    fireEvent.press(screen.getByText('Add another'));
    pressBackdrop();
    await act(async () => jest.advanceTimersByTime(6000));
    expect(flow()?.view.name).toBe('created');

    await act(async () => answerWrite({ data: true }));
    await settle();

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: '/spaces/1/transactions/tx-9',
        headers: expect.objectContaining({ 'If-Match': '"1"' }),
      }),
    );
    expect(flow()).toBeNull();
    expect(mockAddAlert).toHaveBeenCalledWith('Transaction removed');
  });

  it('claims nothing about an undo that got no answer, and repeats it safely', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    fireEvent.press(screen.getByText('Undo'));
    await act(async () => failWrite(new Error('Network Error')));
    await settle();

    expect(
      screen.getByText('Couldn’t confirm the undo. Check your connection and try again; repeating it is safe.'),
    ).toBeTruthy();
    expect(flow()?.view.name).toBe('created');

    fireEvent.press(screen.getByText('Try again'));
    await act(async () => failWrite(refusal(404, 'TRANSACTION_NOT_FOUND')));
    await settle();

    expect(flow()).toBeNull();
    expect(mockAddAlert).toHaveBeenCalledWith('Transaction removed');
  });

  it('offers the latest version when the created record changed before Undo', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    fireEvent.press(screen.getByText('Undo'));
    await act(async () => failWrite(refusal(409, 'TRANSACTION_VERSION_CONFLICT')));
    await settle();

    expect(screen.getByText('This transaction was changed')).toBeTruthy();
    stored = transactionDto({ amount: '30.00', version: 3 });
    fireEvent.press(screen.getByText('Open'));
    await settle();

    expect(flow()).toMatchObject({ view: { name: 'details' }, check: 'done', saved: { amount: '30.00' } });
  });

  it('tells a record outside the viewed period from one hidden by a filter, and shows it on request', async () => {
    const { open, flow } = renderFlow();
    const september = { from: '2026-09-01T00:00:00.000Z', to: '2026-09-30T23:59:59.999Z' };

    open(TransactionType.EXPENSE, 7, september);
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto({ id: 'tx-9' }) }));

    expect(screen.getByText(/^Saved to Jan 5 — outside the period you’re viewing$/)).toBeTruthy();
    fireEvent.press(screen.getByText('Show'));

    expect(flow()).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith(ScreenNames.HOME_SCREEN, {
      screen: ScreenNames.TRANSACTIONS_TAB,
      params: { reveal: { spaceId: 1, transactionId: 'tx-9', timestamp: '2026-01-05T10:00:00.000Z' } },
    });

    open(TransactionType.EXPENSE, 7, {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
      filter: { name: 'Taxi', transactionType: TransactionType.EXPENSE, categoryId: 2 },
    });
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    expect(screen.getByText('Saved, but hidden by the “Taxi” filter')).toBeTruthy();
  });

  it('asks before discarding entered values, and closes at once without them', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fireEvent.press(screen.getByLabelText('Close'));
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(flow()).toBeNull();

    open();
    await settle();
    fillExpense();
    pressBackdrop();

    expect(Alert.alert).toHaveBeenCalledWith('Discard transaction?', expect.any(String), expect.any(Array));
    expect(flow()).not.toBeNull();

    const [discard] = (Alert.alert as jest.Mock).mock.calls[0][2];
    act(() => discard.onPress());
    expect(flow()).toBeNull();
  });

  it('drops the flow of a space the user left mid-save, and shows nothing for its answer', async () => {
    const { store, open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));

    act(() => {
      store.dispatch(activateSpace(2));
    });
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    expect(flow()).toBeNull();
    expect(screen.queryByText('Transaction saved')).toBeNull();
    expect(mockAddAlert).not.toHaveBeenCalled();
  });

  it('starts another transaction on the same type and wallet', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    fireEvent.press(screen.getByText('Add another'));

    expect(flow()).toMatchObject({
      view: { name: 'create' },
      draft: { transactionType: TransactionType.EXPENSE, walletId: 7, amount: '', categoryId: null },
    });
    expect(screen.getByText('New transaction')).toBeTruthy();
  });

  it('starts another on a wallet created for the last one and its picked date, after an unanswered Undo', async () => {
    const { store, open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText(/^Today, /));
    fireEvent.press(screen.getByText('Yesterday'));
    fireEvent.press(screen.getByText('Apply'));
    fireEvent.press(screen.getByText('New wallet'));
    const { draftId } = flow()!;
    walletsResponse = {
      ...wallets,
      wallets: [
        ...wallets.wallets,
        { wallet: { id: 8, wallet_name: 'Card', design: AppColor.SLATE, balance: 0 }, total_income: 0, total_spend: 0 },
      ],
    };
    await act(async () => {
      store.dispatch(walletCreated({ draftId, walletId: 8 }));
      store.dispatch(baseApi.util.invalidateTags(spaceTags(1, 'Wallets')));
      store.dispatch(awayEnded({ draftId }));
    });
    await settle();
    const { timestamp } = flow()!.draft!;

    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto() }));
    fireEvent.press(screen.getByText('Undo'));
    await act(async () => failWrite(new Error('Network Error')));
    await settle();
    fireEvent.press(screen.getByText('Add another'));

    expect(flow()).toMatchObject({
      view: { name: 'create', focusAmount: true },
      notice: null,
      draft: { transactionType: TransactionType.EXPENSE, walletId: 8, timestamp, amount: '', categoryId: null },
    });
    expect(flow()!.draftId).not.toBe(draftId);
    expect(screen.getByText('Save expense')).toBeDisabled();
  });

  it('keeps the draft through More and the date panel, and takes a date only on Apply', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fireEvent.changeText(screen.getByLabelText('Amount'), '12');
    const { timestamp } = flow()!.draft!;

    fireEvent.press(screen.getByText('More'));
    expect(screen.getByText('Categories')).toBeTruthy();
    fireEvent.press(screen.getByText('Spend 10'));

    expect(screen.getByText('New transaction')).toBeTruthy();
    // The seventh tile and the section's hint.
    expect(screen.getAllByText('Spend 10')).toHaveLength(2);
    expect(flow()?.draft).toMatchObject({ amount: '12', categoryId: 10 });

    fireEvent.press(screen.getByText(/^Today, /));
    fireEvent.press(screen.getByText('Yesterday'));
    fireEvent.press(screen.getByLabelText('Back to the form'));
    expect(flow()?.draft?.timestamp).toBe(timestamp);

    fireEvent.press(screen.getByText(/^Today, /));
    fireEvent.press(screen.getByText('Yesterday'));
    fireEvent.press(screen.getByText('Apply'));

    expect(screen.getByText(/^Yesterday, /)).toBeTruthy();
    expect(flow()?.draft).toMatchObject({ amount: '12', categoryId: 10 });
    expect(flow()?.draft?.timestamp).not.toBe(timestamp);
  });

  it('edits from the details: Save changes only for a real change, Back asks before dropping it', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));

    expect(screen.getByText('Edit transaction')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    expect(screen.getByText('Save changes')).toBeEnabled();
    fireEvent.changeText(screen.getByLabelText('Amount'), '50');
    expect(screen.getByText('Save changes')).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    fireEvent.press(screen.getByLabelText('Back to details'));
    expect(Alert.alert).toHaveBeenCalledWith('Discard changes?', expect.any(String), expect.any(Array));

    const [discard] = (Alert.alert as jest.Mock).mock.calls[0][2];
    act(() => discard.onPress());
    expect(flow()).toMatchObject({ view: { name: 'details' }, draft: null });
  });

  it('saves an edit at the version it read and returns to the details', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    fireEvent.press(screen.getByText('Save changes'));

    stored = transactionDto({ amount: '70.00', version: 3 });
    await act(async () =>
      answerWrite({ data: { transaction: stored, wallets: [{ id: 1, balance: 30, is_deleted: false }] } }),
    );
    await settle();

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        url: '/spaces/1/transactions/tx-1',
        data: expect.objectContaining({ amount: '70.00' }),
        headers: expect.objectContaining({ 'If-Match': '"2"' }),
      }),
    );
    expect(flow()).toMatchObject({ view: { name: 'details' }, saved: { amount: '70.00', version: 3 } });
    expect(mockAddAlert).toHaveBeenCalledWith('Changes saved');
  });

  it('shows the record the list had, and offers Edit only once it is read again', async () => {
    let finishRead: (value: unknown) => void = () => {};
    answerRead = () => new Promise((resolve) => (finishRead = resolve));
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    expect(flow()).toMatchObject({ check: 'pending', saved: { amount: '50.00' } });
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();

    await act(async () => finishRead({ data: transactionDto({ amount: '65.00', version: 3 }) }));
    await settle();

    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
    expect(flow()).toMatchObject({ check: 'done', saved: { amount: '65.00', version: 3 } });
  });

  it('reads open details again on a return to the app, but never touches a draft being edited', async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener as (state: AppStateStatus) => void);
      return { remove: () => {} } as ReturnType<typeof AppState.addEventListener>;
    });
    const returnToApp = () =>
      act(() => {
        listeners.forEach((listener) => {
          listener('background');
          listener('active');
        });
      });
    const { openDetails, flow } = renderFlow();
    openDetails();
    await settle();

    stored = transactionDto({ amount: '70.00', version: 3 });
    returnToApp();
    await settle();
    expect(flow()).toMatchObject({ check: 'done', saved: { amount: '70.00', version: 3 } });

    fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    const draft = flow()?.draft;
    stored = transactionDto({ amount: '80.00', version: 4 });
    returnToApp();
    await settle();

    expect(flow()).toMatchObject({ view: { name: 'edit' }, saved: { version: 3 } });
    expect(flow()?.draft).toBe(draft);
    jest.restoreAllMocks();
  });

  it('lets the details be read again when the first read fails', async () => {
    answerRead = () => Promise.reject(new Error('Network Error'));
    const { openDetails } = renderFlow();

    openDetails();
    await settle();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();

    answerRead = null;
    fireEvent.press(screen.getByText('Try again'));
    await settle();

    expect(screen.queryByText('Try again')).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
  });

  it('never takes the record it read before as an answer to a read that failed', async () => {
    const { store, openDetails, flow } = renderFlow();
    holdRecordInCache(store);
    openDetails();
    await settle();

    answerRead = () => Promise.reject(new Error('Network Error'));
    await act(async () => void (await store.dispatch(checkFlowRecord())));

    expect(flow()).toMatchObject({ view: { name: 'details' }, check: 'failed' });
    expect(screen.getByText('This may not be the latest version')).toBeTruthy();
    expect(screen.getByText(/-50\.00/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();

    answerRead = () => Promise.reject(refusal(404, 'TRANSACTION_NOT_FOUND'));
    await act(async () => void (await store.dispatch(checkFlowRecord())));

    expect(screen.getByText('This transaction no longer exists')).toBeTruthy();
  });

  it('keeps the edits when the latest version cannot be loaded', async () => {
    const { store, openDetails, flow } = renderFlow();
    holdRecordInCache(store);
    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    fireEvent.press(screen.getByText('Save changes'));
    await act(async () => failWrite(refusal(409, 'TRANSACTION_VERSION_CONFLICT')));
    await settle();

    answerRead = () => Promise.reject(new Error('Network Error'));
    fireEvent.press(screen.getByText('Load latest'));
    await settle();

    expect(flow()).toMatchObject({ view: { name: 'edit' }, notice: 'conflict', draft: { amount: '70' } });
    expect(screen.getByText('This transaction was changed')).toBeTruthy();
    expect(mockAddAlert).toHaveBeenCalledWith('Couldn’t load the latest version. Check your connection and try again.');
  });

  it('keeps the edits after a conflict and replaces them only when the latest version is loaded', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    fireEvent.press(screen.getByText('Save changes'));

    await act(async () => failWrite(refusal(409, 'TRANSACTION_VERSION_CONFLICT')));
    await settle();

    expect(screen.getByText('This transaction was changed')).toBeTruthy();
    expect(screen.getByLabelText('Amount').props.value).toBe('70');
    expect(screen.getByText('Save changes')).toBeDisabled();
    expect(mockedRequest.mock.calls.filter(([config]) => config.method === 'PATCH')).toHaveLength(1);

    stored = transactionDto({ amount: '80.00', version: 3 });
    fireEvent.press(screen.getByText('Load latest'));
    await settle();

    expect(screen.queryByText('This transaction was changed')).toBeNull();
    expect(screen.getByLabelText('Amount').props.value).toBe('80.00');
    expect(flow()).toMatchObject({ view: { name: 'edit' }, saved: { version: 3 } });
  });

  it('says the record no longer exists when the details find it deleted elsewhere', async () => {
    answerRead = () => Promise.reject(refusal(404, 'TRANSACTION_NOT_FOUND'));
    const { openDetails } = renderFlow();

    openDetails();
    await settle();

    expect(screen.getByText('This transaction no longer exists')).toBeTruthy();
    fireEvent.press(screen.getByText('Close'));
    expect(screen.queryByText('This transaction no longer exists')).toBeNull();
  });

  it('says the record no longer exists when an edit finds it deleted', async () => {
    const { openDetails } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    fireEvent.press(screen.getByText('Save changes'));
    await act(async () => failWrite(refusal(404, 'TRANSACTION_NOT_FOUND')));
    await settle();

    expect(screen.getByText('This transaction no longer exists')).toBeTruthy();
    expect(mockAddAlert).not.toHaveBeenCalled();
  });

  it('keeps the details open under a delete confirmation, and asks again once it closed', async () => {
    const { openDetails, flow } = renderFlow();
    openDetails();
    await settle();

    fireEvent.press(screen.getByText('Delete transaction'));
    pressBack();
    fireEvent.press(screen.getByLabelText('Close'));
    fireEvent.press(screen.getByText('Delete transaction'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(flow()).toMatchObject({ view: { name: 'details' } });

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    act(() => buttons[1].onPress());
    fireEvent.press(screen.getByText('Delete transaction'));

    expect(Alert.alert).toHaveBeenCalledTimes(2);
  });

  it('deletes the saved record, not the draft, and closes only after the server answers', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    fireEvent.press(screen.getByText('Delete transaction'));

    const [title, message, buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(title).toBe('Delete transaction?');
    expect(message).toBe('-50.00 · Food · Cash. The wallet balance will be adjusted.');

    act(() => buttons[1].onPress?.());
    expect(flow()).toMatchObject({ view: { name: 'edit' }, draft: { amount: '70' } });

    fireEvent.press(screen.getByText('Delete transaction'));
    act(() => (Alert.alert as jest.Mock).mock.calls[1][2][0].onPress());

    expect(screen.getByText('Deleting…')).toBeTruthy();
    expect(screen.getByLabelText('Close')).toBeDisabled();
    expect(flow()?.isSaving).toBe(true);

    await act(async () => answerWrite({ data: true }));
    await settle();

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: '/spaces/1/transactions/tx-1',
        headers: expect.objectContaining({ 'If-Match': '"2"' }),
      }),
    );
    expect(flow()).toBeNull();
    expect(mockAddAlert).toHaveBeenCalledWith('Transaction deleted');
  });

  it('keeps the record and offers to try again when a delete fails', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Delete transaction'));
    act(() => (Alert.alert as jest.Mock).mock.calls[0][2][0].onPress());
    await act(async () => failWrite(new Error('Network Error')));
    await settle();

    expect(flow()).toMatchObject({ view: { name: 'details' }, isSaving: false, notice: 'deleteUncertain' });
    expect(
      screen.getByText('Couldn’t confirm the delete. Check your connection and try again; repeating it is safe.'),
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Try again'));
    await act(async () => answerWrite({ data: true }));
    await settle();

    expect(flow()).toBeNull();
  });

  it('asks to load the latest version when a delete finds the record changed', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Delete transaction'));
    act(() => (Alert.alert as jest.Mock).mock.calls[0][2][0].onPress());
    await act(async () => failWrite(refusal(409, 'TRANSACTION_VERSION_CONFLICT')));
    await settle();

    expect(screen.getByText('This transaction was changed')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();

    stored = transactionDto({ amount: '65.00', version: 3 });
    fireEvent.press(screen.getByText('Load latest'));
    await settle();

    expect(flow()).toMatchObject({ notice: null, saved: { amount: '65.00', version: 3 } });
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
  });

  it('explains that deleting a record of a deleted wallet changes no balance', async () => {
    stored = transactionDto({ amount: '2.75', wallet: null });
    const { openDetails } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Delete transaction'));

    expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(
      '-2.75 · Food · Deleted wallet. It will be removed from history and period totals. No wallet balance will change.',
    );
  });

  it('keeps a deleted wallet unless another one is picked', async () => {
    stored = transactionDto({ wallet: null });
    const { openDetails } = renderFlow();

    openDetails();
    await settle();
    expect(screen.getByText('Deleted wallet')).toBeTruthy();

    fireEvent.press(screen.getByText('Edit'));
    fireEvent.changeText(screen.getByLabelText('Note'), 'Lunch');
    fireEvent.press(screen.getByText('Save changes'));
    await settle();

    const [[patch]] = mockedRequest.mock.calls.filter(([config]) => config.method === 'PATCH');
    expect(patch.data).not.toHaveProperty('wallet_id');
  });

  it('never reports the deleted wallet as kept once an unconfirmed move to another one went through', async () => {
    stored = transactionDto({ wallet: null });
    const { openDetails, flow } = renderFlow();
    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    await settle();

    fireEvent.press(screen.getByText('Cash'));
    fireEvent.press(screen.getByText('Save changes'));
    await act(async () => failWrite(new Error('Network Error')));
    await settle();

    fireEvent.press(screen.getByText('Deleted wallet'));
    fireEvent.changeText(screen.getByLabelText('Note'), 'Lunch');
    fireEvent.press(screen.getByText('Save changes'));
    await act(async () =>
      answerWrite({
        data: {
          transaction: transactionDto({
            wallet: { id: 7, wallet_name: 'Cash', design: AppColor.SLATE, created_at: '', updated_at: '' },
            version: 2,
          }),
          wallets: [{ id: 7, balance: 90, is_deleted: false }],
        },
      }),
    );
    await settle();

    expect(flow()).toMatchObject({ view: { name: 'edit' }, saved: { wallet: { id: 7 } }, draft: { walletId: null } });
    expect(screen.getByText('The deleted wallet can’t be picked again. Choose a wallet')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeDisabled();
    expect(mockAddAlert).not.toHaveBeenCalledWith('Changes saved');
    expect(mockedRequest.mock.calls.filter(([config]) => config.method === 'PATCH')).toHaveLength(2);
  });

  it('offers no edit for an initial balance', async () => {
    stored = transactionDto({ kind: TransactionKind.INITIAL_BALANCE, transaction_type: TransactionType.INCOME });
    const { openDetails } = renderFlow();

    openDetails();
    await settle();

    expect(screen.getByText('Starting balance')).toBeTruthy();
    expect(screen.getByText('Set when the wallet was created')).toBeTruthy();
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Delete transaction')).toBeNull();
  });

  it('comes back from a new wallet with it picked and the rest of the draft kept', async () => {
    const { store, open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('New wallet'));

    const { draftId } = flow()!;
    expect(flow()?.away).toBe('wallet');
    expect(screen.queryByText('New transaction')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('AddWalletScreen', { id: 'new', forDraft: draftId });

    act(() => {
      store.dispatch(walletCreated({ draftId, walletId: 8 }));
      store.dispatch(awayEnded({ draftId }));
    });

    expect(screen.getByText('New transaction')).toBeTruthy();
    expect(mockSheet.presents).toBe(2);
    expect(flow()?.draft).toMatchObject({ amount: '12', categoryId: 1, walletId: 8 });
  });

  it('creates a category from an empty grid and comes back with it picked, or unchanged on cancel', async () => {
    const { open, flow } = renderFlow();

    open(TransactionType.INCOME);
    await settle();
    fireEvent.changeText(screen.getByLabelText('Amount'), '500');
    fireEvent.press(screen.getByText('Create category'));

    expect(flow()?.away).toBe('category');
    expect(screen.getByPlaceholderText('My category')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('My category'), 'Bonus');
    fireEvent.press(screen.getByText('Create category'));
    await settle();

    expect(flow()).toMatchObject({ away: null, draft: { amount: '500', categoryId: 30 } });
    expect(screen.queryByPlaceholderText('My category')).toBeNull();
    expect(screen.getByText('Save income')).toBeTruthy();
  });

  it('returns to the form unchanged when the new category is not saved', async () => {
    const { store, open, flow } = renderFlow();

    open(TransactionType.INCOME);
    await settle();
    fireEvent.press(screen.getByText('Create category'));
    act(() => {
      store.dispatch(awayEnded({ draftId: flow()!.draftId }));
    });

    expect(flow()).toMatchObject({ away: null, draft: { categoryId: null } });
    expect(screen.getByText('New transaction')).toBeTruthy();
  });

  it('keeps a reopened category editor when its previous dismissal finishes late', async () => {
    const { store, open, flow } = renderFlow();
    open(TransactionType.INCOME);
    await settle();
    fireEvent.press(screen.getByText('Create category'));
    mockCategorySheet.holdDismiss = true;
    act(() => store.dispatch(awayEnded({ draftId: flow()!.draftId })));
    act(() => store.dispatch(awayStarted({ draftId: flow()!.draftId, target: 'category' })));
    expect(flow()?.away).toBe('category');
    act(() => mockCategorySheet.finishDismiss?.());
    expect(flow()?.away).toBe('category');
    expect(screen.getByPlaceholderText('My category')).toBeTruthy();
  });

  it('tells lists that are loading or failed from empty ones, retries each, and saves only once they are there', async () => {
    let failing = ['/categories', '/wallets'];
    mockedRequest.mockImplementation((config: { url: string; method: string }) =>
      config.method === 'GET' && failing.some((path) => config.url.endsWith(path))
        ? Promise.reject(new Error('Network Error'))
        : respond(config),
    );
    const { open } = renderFlow();

    open();
    expect(screen.getByLabelText('Loading categories')).toBeTruthy();
    expect(screen.getByLabelText('Loading wallets')).toBeTruthy();
    await settle();

    expect(screen.getByText('Couldn’t load categories')).toBeTruthy();
    expect(screen.getByText('Couldn’t load wallets')).toBeTruthy();
    expect(screen.queryByText('No expense categories yet')).toBeNull();
    expect(screen.queryByText('New wallet')).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Amount'), '12');
    expect(screen.getByText('Save expense')).toBeDisabled();

    failing = ['/wallets'];
    fireEvent.press(screen.getByLabelText('Retry loading categories'));
    await settle();
    fireEvent.press(screen.getByText('Food'));

    expect(screen.getByText('Couldn’t load wallets')).toBeTruthy();
    expect(screen.getByText('Retry loading wallets to save')).toBeTruthy();
    expect(screen.getByText('Save expense')).toBeDisabled();

    failing = [];
    fireEvent.press(screen.getByLabelText('Retry loading wallets'));
    await settle();

    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.getByText('Save expense')).toBeEnabled();
  });

  it('saves a changed amount of an edit without lists it does not need', async () => {
    mockedRequest.mockImplementation((config: { url: string; method: string }) =>
      config.method === 'GET' && (config.url.endsWith('/categories') || config.url.endsWith('/wallets'))
        ? Promise.reject(new Error('Network Error'))
        : respond(config),
    );
    const { openDetails } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    await settle();
    fireEvent.changeText(screen.getByLabelText('Amount'), '70');

    expect(screen.getByText('Couldn’t load categories')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeEnabled();
  });

  it('starts on an active wallet when none or a gone one was asked for, with nothing to discard', async () => {
    const { open, flow } = renderFlow();

    open(TransactionType.EXPENSE, 99);
    await settle();

    expect(flow()?.draft?.walletId).toBe(7);
    fireEvent.press(screen.getByLabelText('Close'));
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(flow()).toBeNull();
  });

  it('offers a wallet first when the space has none, and saves nothing until there is one', async () => {
    walletsResponse = { ...wallets, wallets: [] };
    const { open, flow } = renderFlow();

    open(TransactionType.EXPENSE, null);
    await settle();
    fillExpense();

    expect(flow()?.draft?.walletId).toBeNull();
    expect(screen.getByText('Create a wallet to save this transaction.')).toBeTruthy();
    expect(screen.getByText('Save expense')).toBeDisabled();
  });

  it('explains a typed or pasted amount that is not one and keeps it as entered', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fireEvent.press(screen.getByText('Food'));
    fireEvent.changeText(screen.getByLabelText('Amount'), '12.345');

    expect(screen.getByText('Use at most two decimal places')).toBeTruthy();
    expect(screen.getByText('Save expense')).toBeDisabled();
    expect(flow()?.draft?.amount).toBe('12.345');

    fireEvent.changeText(screen.getByLabelText('Amount'), '1 234,50');

    expect(screen.queryByText('Use at most two decimal places')).toBeNull();
    expect(screen.getByText('Save expense')).toBeEnabled();
    expect(screen.getByText('−', { includeHiddenElements: true })).toBeTruthy();
  });

  it('searches a long list of categories and says when nothing matches', async () => {
    categoriesResponse = {
      ...categories,
      expenses: Array.from({ length: 20 }, (_, index) => category(index + 1, `Spend ${index + 1}`)),
    };
    const { open } = renderFlow();

    open();
    await settle();
    fireEvent.press(screen.getByText('More'));
    fireEvent.changeText(screen.getByLabelText('Search categories'), 'gym');

    expect(screen.getByText('No expense categories match “gym”')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Search categories'), 'spend 20');
    fireEvent.press(screen.getByText('Spend 20'));

    expect(screen.getByText('New transaction')).toBeTruthy();
    expect(screen.getAllByText('Spend 20').length).toBeGreaterThan(0);
  });

  it('keeps the archived category and deleted wallet of an edit as options of that record only', async () => {
    stored = transactionDto({
      wallet: null,
      category: { ...transactionDto().category, id: 40, name: 'Old gym', is_active: 0, is_archived: true },
    });
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    await settle();

    expect(screen.getByText('Archived — you can keep it')).toBeTruthy();
    expect(
      screen.getByText('This wallet was deleted. You can keep it or move the transaction to another wallet.'),
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Food'));
    fireEvent.press(screen.getByText('Cash'));
    expect(screen.getByText('Save changes')).toBeEnabled();

    fireEvent.press(screen.getAllByText('Old gym')[0]);
    fireEvent.press(screen.getByText('Deleted wallet'));
    expect(screen.getByText('Save changes')).toBeDisabled();

    fireEvent.press(screen.getByText('Income'));
    expect(flow()?.draft?.categoryId).toBeNull();
    expect(screen.queryByText('Old gym')).toBeNull();

    fireEvent.press(screen.getByText('Expense'));
    expect(flow()?.draft?.categoryId).toBeNull();
    expect(screen.getByText('Old gym')).toBeTruthy();
  });

  it('keeps an edit of an archived category and a deleted wallet through the panels and a new wallet', async () => {
    stored = transactionDto({
      wallet: null,
      version: 2,
      category: { ...transactionDto().category, id: 40, name: 'Old gym', is_active: 0, is_archived: true },
    });
    const { store, openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    await settle();
    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    fireEvent.changeText(screen.getByLabelText('Note'), 'Yearly pass');

    fireEvent.press(screen.getByText('More'));
    fireEvent.press(screen.getByLabelText('Back to the form'));
    fireEvent.press(screen.getByText(/, \d{2}:\d{2}$/));
    fireEvent.press(screen.getByText('Yesterday'));
    fireEvent.press(screen.getByText('Apply'));
    const { timestamp } = flow()!.draft!;

    fireEvent.press(screen.getByText('New wallet'));
    const { draftId } = flow()!;
    walletsResponse = {
      ...wallets,
      wallets: [
        ...wallets.wallets,
        { wallet: { id: 8, wallet_name: 'Card', design: AppColor.SLATE, balance: 0 }, total_income: 0, total_spend: 0 },
      ],
    };
    await act(async () => {
      store.dispatch(walletCreated({ draftId, walletId: 8 }));
      store.dispatch(baseApi.util.invalidateTags(spaceTags(1, 'Wallets')));
      store.dispatch(awayEnded({ draftId }));
    });
    await settle();

    expect(screen.getByText('Edit transaction')).toBeTruthy();
    expect(flow()).toMatchObject({
      view: { name: 'edit' },
      draftId,
      draft: { amount: '70', description: 'Yearly pass', categoryId: 40, walletId: 8, timestamp },
    });

    fireEvent.press(screen.getByText('Save changes'));
    await settle();
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        data: expect.objectContaining({ amount: '70.00', category_id: 40, wallet_id: 8, description: 'Yearly pass' }),
        headers: expect.objectContaining({ 'If-Match': '"2"' }),
      }),
    );
  });

  it("forecasts an edit of a deleted wallet's expense by replacing its share, without blocking Save", async () => {
    const day = 86_400_000;
    stored = transactionDto({ wallet: null, amount: '50.00', timestamp: new Date(Date.now() - day).toISOString() });
    limitsResponse = {
      period: {
        time_zone: 'UTC',
        start_date: '',
        end_date: '',
        from: new Date(Date.now() - 10 * day).toISOString(),
        to: new Date(Date.now() + 10 * day).toISOString(),
      },
      total: null,
      categories: [
        {
          id: 1,
          name: null,
          amount: '200.00',
          spent: 150,
          in_percent: 75,
          categories: [{ id: 1, name: 'Food', icon: 'Grocery', color: AppColor.SLATE }],
        },
      ],
      over_allocation: null,
    };
    const { openDetails } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    await settle();

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/spaces/1/limits', params: { time_zone: expect.any(String) } }),
    );
    expect(screen.queryByText(/^Food:/)).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Amount'), '70');

    expect(screen.getByText(/^Food: 150.* → 170.* of 200/)).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeEnabled();
  });
});
