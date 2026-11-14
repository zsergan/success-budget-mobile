import type { ReactNode, Ref } from 'react';
import { useState } from 'react';
import type { AppStateStatus } from 'react-native';
import { AccessibilityInfo, AppState, BackHandler, Keyboard, PixelRatio, Text } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import type { Category, GetCategoriesResponse, GetLimitsResponse, WalletsOverviewResponse } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import { transactionApi } from '@redux/state/transaction/api';
import { createTransactionResponseDto, transactionDto } from '@redux/state/transaction/fixtures';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { mapTransaction } from '@api/models';
import {
  awayEnded,
  awayStarted,
  CREATED_AUTO_CLOSE_MS,
  createOpened,
  walletCreated,
} from '@redux/state/transactionFlow/slice';
import type { ViewSelection } from '@redux/state/transactionFlow/selection';
import { checkFlowRecord, openTransactionDetails } from '@redux/state/transactionFlow/thunks';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import { ScreenNames, AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { renderWithTheme } from '@components/ThemeProvider/themeTestUtils';
import { createToastRecorder } from '@components/Toast/testing';
import { colorThemes } from '@shared/theme';
import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import { useBackPress, useSheetPresence } from '@hooks';
import { TransactionCategoriesScreen, TransactionEditorScreen } from '@screens/TransactionEditor';
import type { RootStackParamList } from '@shared/types';
import TransactionFlowSheet from './TransactionFlowSheet';

interface SheetProps {
  children: ReactNode;
  stackBehavior?: string;
  onAnimate?: (fromIndex: number, toIndex: number) => void;
  onDismiss?: () => void;
  backdropComponent?: (props: object) => ReactNode;
  handleComponent?: (() => ReactNode) | null;
  enablePanDownToClose?: boolean;
}

const mockCategorySheet: { holdDismiss: boolean; finishDismiss?: () => void } = { holdDismiss: false };

// While held, the flow sheet's close stays on screen, as during its animation, until finishDismiss().
const mockSheet: {
  props?: SheetProps;
  presents: number;
  swipeDown?: () => void;
  holdDismiss: boolean;
  finishDismiss?: () => void;
} = {
  presents: 0,
  holdDismiss: false,
};

// The confirmation sheet the flow pushes above itself.
const mockConfirmation: { props?: SheetProps; swipeDown?: () => void } = {};

jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

// As the system: the handler added last answers first, and the next one only if that left the press alone.
const backHandlers: ((event: never) => boolean | null | undefined)[] = [];
const pressBack = () => act(() => void [...backHandlers].reverse().some((handler) => handler({} as never)));

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
      if (isFlowSheet && mockSheet.holdDismiss) mockSheet.finishDismiss = finish;
      else if (!isFlowSheet && mockCategorySheet.holdDismiss) mockCategorySheet.finishDismiss = finish;
      else finish();
    };

    if (isFlowSheet) mockSheet.swipeDown = dismiss;
    const isConfirmation = props.stackBehavior === 'push';
    if (isConfirmation) Object.assign(mockConfirmation, { props, swipeDown: dismiss });

    React.useImperativeHandle(ref, () => ({
      present: () => {
        if (isFlowSheet) mockSheet.presents += 1;
        if (isStuckRef.current) return;
        isOpenRef.current = true;
        setOpen(true);
      },
      dismiss,
      snapToIndex: () => {},
    }));

    return isOpen ? (
      <SheetContext.Provider value={{ close: dismiss }}>
        {props.handleComponent?.()}
        {isConfirmation ? <View testID="confirmation">{props.children}</View> : props.children}
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

jest.mock('@react-native-community/datetimepicker', () => () => null);

const mockToasts = createToastRecorder();
jest.mock('@hooks/useToast', () => () => mockToasts.toast);
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

let answerOperation: () => Promise<unknown> = () =>
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

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const renderHome = () => (
  <>
    <TransactionFlowSheet />
    <Text>Home</Text>
  </>
);
const renderWallet = () => <Text>Add Wallet</Text>;

// The sheet over the app's first route, with the routes its form opens.
const flowTree = (store: ReturnType<typeof createAppStore>) => (
  <Provider store={store}>
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 400, height: 800 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={ScreenNames.HOME_SCREEN}>{renderHome}</Stack.Screen>
          <Stack.Screen name={ScreenNames.TRANSACTION_EDITOR_SCREEN} component={TransactionEditorScreen} />
          <Stack.Screen name={ScreenNames.TRANSACTION_CATEGORIES_SCREEN} component={TransactionCategoriesScreen} />
          <Stack.Screen name={ScreenNames.ADD_WALLET_SCREEN}>{renderWallet}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  </Provider>
);

const routes = () => navigationRef.getRootState()?.routes ?? [];
const routeNames = () => routes().map(({ name }) => name);
const HOME_ONLY = [ScreenNames.HOME_SCREEN];
const WITH_EDITOR = [ScreenNames.HOME_SCREEN, ScreenNames.TRANSACTION_EDITOR_SCREEN];
// The back swipe, like any other removal of the top route.
const swipeBack = () => act(() => navigationRef.goBack());

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

const backdropOf = (props?: SheetProps) => () =>
  act(() => (props?.backdropComponent?.({}) as { props: { onPress?: () => void } }).props.onPress?.());

const pressBackdrop = () => backdropOf(mockSheet.props)();

const CONFIRMATION_TITLES =
  /^(Discard (transaction|changes)|Close without (confirmation|sending)|Delete transaction)\?$/;

// The confirmations open above the flow; there is never more than one.
const asked = () => screen.queryAllByRole('header', { name: CONFIRMATION_TITLES }).map(({ props }) => props.children);
const confirmation = () => within(screen.getByTestId('confirmation'));
const answer = (label: string) => fireEvent.press(confirmation().getByRole('button', { name: label }));
// The flow's own Delete, under the confirmation's button of the same name.
const pressFlowDelete = () => fireEvent.press(screen.getAllByText('Delete transaction')[0]);

beforeEach(() => {
  jest.clearAllMocks();
  mockToasts.clear();
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
  mockSheet.holdDismiss = false;
  mockSheet.finishDismiss = undefined;
  backHandlers.splice(0);
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    backHandlers.push(handler);
    return { remove: () => void backHandlers.splice(backHandlers.indexOf(handler), 1) };
  });
  mockedRequest.mockImplementation(respond);
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

    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(screen.getByLabelText('Amount').props.value).toBe('12');
    expect(selectTransactionFlow(store.getState())?.draft).toMatchObject({ amount: '12' });
    expect(screen.getByText('Save expense')).toHaveStyle({ color: colorThemes.dark.colors.onAccent });
  });

  it('opens one editor screen, never the sheet, and keeps it when asked to open again', async () => {
    const { open } = renderFlow();

    open();
    open(TransactionType.INCOME);
    await settle();
    open(TransactionType.INCOME);
    await settle();

    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(routes()[1].params).toEqual({ spaceId: 1 });
    expect(mockSheet.presents).toBe(0);
    expect(screen.getAllByText('New transaction')).toHaveLength(1);
    expect(screen.getByText('Save expense')).toBeTruthy();
  });

  it('opens again after it was closed by its button or by a swipe', async () => {
    const { open, openDetails, flow } = renderFlow();

    open();
    await settle();
    fireEvent.press(screen.getByLabelText('Back'));
    await settle();
    expect(flow()).toBeNull();
    expect(routeNames()).toEqual(HOME_ONLY);

    openDetails();
    await settle();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();

    act(() => mockSheet.swipeDown?.());
    await settle();
    expect(flow()).toBeNull();

    open();
    await settle();
    expect(screen.getByText('Save expense')).toBeTruthy();
    expect(routeNames()).toEqual(WITH_EDITOR);
  });

  it.each([
    ['Android Back', pressBack],
    ['the back swipe', swipeBack],
  ])('lets an untouched form go on %s, and asks before it discards entered values', async (_name, leave) => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    leave();
    await settle();
    expect(flow()).toBeNull();
    expect(routeNames()).toEqual(HOME_ONLY);

    open();
    await settle();
    fillExpense();
    leave();

    expect(asked()).toEqual(['Discard transaction?']);
    expect(flow()?.draft).toMatchObject({ amount: '12' });
    expect(routeNames()).toEqual(WITH_EDITOR);
  });

  it('opens one confirmation at a time, whichever way it is asked for', async () => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();

    fireEvent.press(screen.getByLabelText('Back'));
    swipeBack();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(asked()).toEqual(['Discard transaction?']);

    // Back answers the confirmation first, then asks again from the form.
    pressBack();
    expect(asked()).toEqual([]);
    pressBack();

    expect(asked()).toEqual(['Discard transaction?']);
    expect(flow()?.draft).toMatchObject({ amount: '12' });
  });

  it('keeps every draft field when a close is cancelled, however it was asked and answered', async () => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();
    fireEvent.changeText(screen.getByLabelText('Description'), 'Lunch with Sam');
    fireEvent.press(screen.getByText(/, \d{2}:\d{2}$/));
    fireEvent.press(screen.getByText('Yesterday'));
    fireEvent.press(screen.getByText('Apply'));
    const before = flow();

    const requests = [() => fireEvent.press(screen.getByLabelText('Back')), swipeBack, pressBack];
    const cancels = [
      () => answer('Keep editing'),
      () => backdropOf(mockConfirmation.props)(),
      () => act(() => mockConfirmation.swipeDown?.()),
      pressBack,
    ];

    requests.forEach((request) =>
      cancels.forEach((cancel) => {
        request();
        expect(asked()).toEqual(['Discard transaction?']);

        cancel();
        expect(asked()).toEqual([]);
        expect(flow()).toEqual(before);
      }),
    );
    expect(screen.getByLabelText('Amount').props.value).toBe('12');
    expect(screen.getByLabelText('Description').props.value).toBe('Lunch with Sam');
  });

  it.each([
    ['Android Back', pressBack],
    ['the back swipe', swipeBack],
  ])('leaves the full category list and the date picker on %s with the draft as it was', async (_name, leave) => {
    const { open, flow } = renderFlow();
    open();
    await settle();
    fillExpense();
    const before = flow()!.draft;

    fireEvent.press(screen.getByText('More'));
    expect(routeNames()).toEqual([...WITH_EDITOR, ScreenNames.TRANSACTION_CATEGORIES_SCREEN]);
    leave();
    await settle();
    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(asked()).toEqual([]);
    expect(flow()?.draft).toEqual(before);

    fireEvent.press(screen.getByText(/, \d{2}:\d{2}$/));
    fireEvent.press(screen.getByText('Yesterday'));
    expect(flow()?.view).toMatchObject({ name: 'dateTime' });
    leave();
    await settle();
    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(asked()).toEqual([]);
    expect(flow()).toMatchObject({ view: { name: 'create', focusAmount: false }, draft: before });
    expect(screen.queryByText('Apply')).toBeNull();

    // Only now is it the form itself that is being left.
    leave();
    expect(asked()).toEqual(['Discard transaction?']);
  });

  it('picks from the full list once for a double tap, and creates a category from it for the same draft', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const { open, flow } = renderFlow();
    open();
    await settle();
    fireEvent.changeText(screen.getByLabelText('Amount'), '12');

    fireEvent.press(screen.getByText('More'));
    fireEvent.press(screen.getByText('More', { includeHiddenElements: true }));
    expect(routeNames()).toEqual([...WITH_EDITOR, ScreenNames.TRANSACTION_CATEGORIES_SCREEN]);
    expect(dismiss).toHaveBeenCalled();
    expect(screen.getByText('Only expense categories are shown. Archived ones stay hidden here.')).toBeTruthy();

    const tile = screen.getByText('Spend 9');
    fireEvent.press(tile);
    fireEvent.press(tile);
    await settle();
    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(asked()).toEqual([]);
    expect(flow()).toMatchObject({ promotedCategoryId: 9, draft: { amount: '12', categoryId: 9 } });

    fireEvent.press(screen.getByText('More'));
    fireEvent.press(screen.getByText('New'));
    expect(flow()?.away).toBe('category');
    // The editor below the list owns the category sheet; on a device it is drawn above both.
    const hidden = { includeHiddenElements: true };
    fireEvent.changeText(screen.getByPlaceholderText('My category', hidden), 'Bonus');
    fireEvent.press(screen.getByText('Create category', hidden));
    await settle();

    // The new category is an income one, so the expense draft keeps its pick; the form is back either way.
    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(flow()).toMatchObject({ away: null, draft: { amount: '12', categoryId: 9 } });
  });

  it('closes the amount keyboard when a category is picked, and drops a category the new type does not have', async () => {
    categoriesResponse = { ...categories, incomes: [category(20, 'Salary', TransactionType.INCOME)] };
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const { open, flow } = renderFlow();
    open();
    await settle();
    fireEvent.changeText(screen.getByLabelText('Amount'), '12');
    expect(dismiss).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Food'));
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(flow()?.draft?.categoryId).toBe(1);

    fireEvent.press(screen.getByText('Income'));
    expect(flow()?.draft).toMatchObject({ amount: '12', categoryId: null, transactionType: TransactionType.INCOME });
    expect(screen.getByText('Required')).toBeTruthy();
    expect(screen.getByText('Save income')).toBeDisabled();
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
    expect(asked()).toEqual([]);
    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(screen.getAllByText('New transaction')).toHaveLength(1);
    expect(screen.getByLabelText('Amount').props.value).toBe('12');

    pressBack();

    expect(asked()).toEqual(['Discard transaction?']);
  });

  it('confirms only after the API answers, keeping the form in place meanwhile', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));

    expect(screen.getByText('Saving…')).toBeTruthy();
    expect(screen.queryByText('Transaction saved')).toBeNull();
    expect(screen.getByLabelText('Back')).toBeDisabled();

    pressBack();
    swipeBack();
    expect(asked()).toEqual([]);
    expect(flow()?.isSaving).toBe(true);
    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(mockSheet.presents).toBe(0);

    await act(async () => answerWrite({ data: createTransactionResponseDto() }));

    expect(routeNames()).toEqual(HOME_ONLY);
    expect(mockSheet.presents).toBe(1);
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
    expect(mockToasts.shown).toEqual([]);
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

    const editorKey = routes()[1].key;
    fireEvent.changeText(screen.getByLabelText('Amount'), '25');
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => answerWrite({ data: createTransactionResponseDto({ amount: '12.00', version: 1 }) }));
    await settle();

    expect(routes().map(({ key }) => key)).toEqual([routes()[0].key, editorKey]);
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

    pressBack();
    expect(asked()).toEqual(['Close without confirmation?']);

    answer('Close');

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
    // The sheet shows the record and says why; no toast repeats it.
    expect(screen.getByText('Already saved')).toBeTruthy();
    expect(mockToasts.shown).toEqual([]);
    expect(mockedRequest.mock.calls.filter(([config]) => config.method === 'POST')).toHaveLength(1);
  });

  it('closes the form with a toast when the record an earlier attempt saved has been deleted since', async () => {
    const { open, flow } = renderFlow();
    answerOperation = () =>
      Promise.resolve({
        data: {
          operation_id: 'key-1',
          status: 'applied',
          transaction_id: 'tx-1',
          created_at: stored.timestamp,
          deleted_at: stored.timestamp,
          transaction: null,
        },
      });
    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByText('Save expense'));
    await act(async () => failWrite(refusal(409, 'TRANSACTION_OPERATION_EXISTS')));
    await settle();

    expect(flow()).toBeNull();
    expect(routeNames()).toEqual(HOME_ONLY);
    expect(mockToasts.shown).toEqual([
      {
        when: 'afterNavigation',
        message: { tone: 'info', text: 'This transaction was saved earlier and has since been deleted' },
      },
    ]);
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
    expect(mockToasts.shown).toEqual([]);
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
    // Its time counts from when it showed, with the form gone.
    expect(routeNames()).toEqual(HOME_ONLY);
    expect(flow()?.autoCloseAt).toBe(Date.now() + CREATED_AUTO_CLOSE_MS);

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
    expect(mockToasts.shown).toEqual([
      {
        when: 'afterSheetsClose',
        message: { tone: 'success', text: 'Transaction removed', subject: 'transaction-delete:tx-9' },
      },
    ]);
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
      screen.getByText(
        'Couldn’t confirm the undo. It may already have gone through; checking its status never applies it twice.',
      ),
    ).toBeTruthy();
    expect(flow()?.view.name).toBe('created');
    expect(mockToasts.shown).toEqual([]);

    fireEvent.press(screen.getByText('Check status'));
    await act(async () => failWrite(refusal(404, 'TRANSACTION_NOT_FOUND')));
    await settle();

    const deleteKeys = mockedRequest.mock.calls
      .filter(([{ method }]) => method === 'DELETE')
      .map(([{ headers }]) => headers['Idempotency-Key']);
    expect(deleteKeys).toHaveLength(2);
    expect(new Set(deleteKeys).size).toBe(1);
    expect(flow()).toBeNull();
    expect(mockToasts.shown).toEqual([
      {
        when: 'afterSheetsClose',
        message: { tone: 'info', text: 'This transaction is no longer available', subject: 'transaction-delete:tx-1' },
      },
    ]);
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

  it('says a record was saved outside the viewed period, and shows it on request', async () => {
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
    expect(routes()).toMatchObject([
      {
        name: ScreenNames.HOME_SCREEN,
        params: {
          screen: ScreenNames.TRANSACTIONS_TAB,
          params: { reveal: { spaceId: 1, transactionId: 'tx-9', timestamp: '2026-01-05T10:00:00.000Z' } },
        },
      },
    ]);
  });

  it('asks before discarding entered values, and closes at once without them', async () => {
    const { open, flow } = renderFlow();

    open();
    await settle();
    fireEvent.press(screen.getByLabelText('Back'));
    await settle();
    expect(asked()).toEqual([]);
    expect(flow()).toBeNull();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByLabelText('Back'));

    expect(asked()).toEqual(['Discard transaction?']);
    expect(confirmation().getByText('The amount and details you entered will be lost.')).toBeTruthy();
    expect(flow()).not.toBeNull();

    answer('Discard transaction');
    await settle();
    expect(flow()).toBeNull();
    expect(routeNames()).toEqual(HOME_ONLY);
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
    expect(routeNames()).toEqual(HOME_ONLY);
    expect(screen.queryByText('Transaction saved')).toBeNull();
    expect(mockToasts.shown).toEqual([]);
  });

  it('takes the editor and a wallet screen opened from it off the stack when the space changes', async () => {
    const { store, open, flow } = renderFlow();

    open();
    await settle();
    fillExpense();
    fireEvent.press(screen.getByLabelText('New wallet'));
    const { draftId } = flow()!;
    expect(routeNames()).toEqual([...WITH_EDITOR, ScreenNames.ADD_WALLET_SCREEN]);

    act(() => {
      store.dispatch(activateSpace(2));
    });
    await settle();

    expect(flow()).toBeNull();
    expect(routeNames()).toEqual(HOME_ONLY);

    // The wallet saved for the draft that is gone picks nothing in a form opened since.
    act(() => {
      store.dispatch(createOpened({ spaceId: 2, transactionType: TransactionType.EXPENSE, walletId: null, now: '' }));
      store.dispatch(walletCreated({ draftId, walletId: 8 }));
    });
    await settle();

    expect(flow()?.draft?.walletId).not.toBe(8);
    expect(routes()).toMatchObject([{}, { name: ScreenNames.TRANSACTION_EDITOR_SCREEN, params: { spaceId: 2 } }]);
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
    fireEvent.press(screen.getByLabelText('New wallet'));
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
      navigationRef.goBack();
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
    expect(screen.getByText('Expense categories')).toBeTruthy();
    fireEvent.press(screen.getByText('Spend 10'));

    expect(screen.getByText('New transaction')).toBeTruthy();
    // The seventh tile and the section's pill.
    expect(screen.getAllByText('Spend 10')).toHaveLength(2);
    expect(flow()?.draft).toMatchObject({ amount: '12', categoryId: 10 });

    fireEvent.press(screen.getByText(/^Today, /));
    fireEvent.press(screen.getByText('Yesterday'));
    fireEvent.press(screen.getByText('Cancel'));
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

    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.getByText('Edit transaction')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    expect(screen.getByText('Save changes')).toBeEnabled();
    fireEvent.changeText(screen.getByLabelText('Amount'), '50');
    expect(screen.getByText('Save changes')).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    fireEvent.press(screen.getByLabelText('Back to details'));
    expect(asked()).toEqual(['Discard changes?']);

    answer('Discard changes');
    await settle();
    expect(flow()).toMatchObject({ view: { name: 'details' }, draft: null });
    expect(routeNames()).toEqual(HOME_ONLY);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
  });

  it('opens the editor once for repeated taps on Edit, and only after the details sheet has gone', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    mockSheet.holdDismiss = true;
    const edit = screen.getByText('Edit');
    fireEvent.press(edit);
    fireEvent.press(edit);

    expect(flow()?.view.name).toBe('edit');
    expect(routeNames()).toEqual(HOME_ONLY);
    // The closing sheet still shows the details, never the form.
    expect(screen.queryByText('Edit transaction')).toBeNull();

    act(() => mockSheet.finishDismiss?.());
    await settle();

    expect(routeNames()).toEqual(WITH_EDITOR);
    expect(screen.getByText('Edit transaction')).toBeTruthy();

    // An untouched edit goes back to the details without asking.
    mockSheet.holdDismiss = false;
    pressBack();
    await settle();

    expect(asked()).toEqual([]);
    expect(flow()).toMatchObject({ view: { name: 'details' }, saved: { id: 'tx-1' } });
    expect(routeNames()).toEqual(HOME_ONLY);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
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
    expect(routeNames()).toEqual(HOME_ONLY);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    // The details show the new values, so no toast says they were saved.
    expect(mockToasts.shown).toEqual([]);
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
    expect(
      screen.getByText(
        'Couldn’t load the latest version. Check your connection and try again; your edits are still here.',
      ),
    ).toBeTruthy();
    expect(mockToasts.shown).toEqual([]);
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

    const editorKey = routes()[1].key;
    const { draftId } = flow()!;
    stored = transactionDto({ amount: '80.00', version: 3 });
    fireEvent.press(screen.getByText('Load latest'));
    await settle();

    expect(screen.queryByText('This transaction was changed')).toBeNull();
    expect(screen.getByLabelText('Amount').props.value).toBe('80.00');
    expect(flow()).toMatchObject({ view: { name: 'edit' }, saved: { version: 3 } });
    // The new draft stays on the route the old one was on.
    expect(flow()!.draftId).not.toBe(draftId);
    expect(routes().map(({ key }) => key)).toEqual([routes()[0].key, editorKey]);
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
    expect(mockToasts.shown).toEqual([]);
  });

  it('keeps the details open under a delete confirmation, and asks again once it closed', async () => {
    const { openDetails, flow } = renderFlow();
    openDetails();
    await settle();

    pressFlowDelete();
    fireEvent.press(screen.getByLabelText('Close'));
    pressBackdrop();
    pressFlowDelete();

    expect(asked()).toEqual(['Delete transaction?']);
    expect(flow()).toMatchObject({ view: { name: 'details' } });

    pressBack();
    expect(asked()).toEqual([]);
    expect(flow()).toMatchObject({ view: { name: 'details' } });
    pressFlowDelete();

    expect(asked()).toEqual(['Delete transaction?']);
  });

  it('deletes the saved record, not the draft, and closes only after the server answers', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    fireEvent.changeText(screen.getByLabelText('Amount'), '70');
    pressFlowDelete();

    expect(asked()).toEqual(['Delete transaction?']);
    expect(confirmation().getByText('-50.00 · Food · Cash. The wallet balance will be adjusted.')).toBeTruthy();

    answer('Cancel');
    expect(flow()).toMatchObject({ view: { name: 'edit' }, draft: { amount: '70' } });

    pressFlowDelete();
    const confirm = confirmation().getByRole('button', { name: 'Delete transaction' });
    fireEvent.press(confirm);
    fireEvent.press(confirm);

    expect(asked()).toEqual([]);
    expect(screen.getByText('Deleting…')).toBeTruthy();
    expect(screen.getByLabelText('Back to details')).toBeDisabled();
    expect(flow()?.isSaving).toBe(true);

    await act(async () => answerWrite({ data: true }));
    await settle();

    expect(mockedRequest.mock.calls.filter(([{ method }]) => method === 'DELETE')).toEqual([
      [
        expect.objectContaining({
          url: '/spaces/1/transactions/tx-1',
          headers: expect.objectContaining({ 'If-Match': '"2"' }),
        }),
      ],
    ]);
    expect(flow()).toBeNull();
    expect(routeNames()).toEqual(HOME_ONLY);
    // The editor closes with its record, so the result is handed to the screen it leaves for.
    expect(mockToasts.shown).toEqual([
      {
        when: 'afterNavigation',
        message: { tone: 'success', text: 'Transaction deleted', subject: 'transaction-delete:tx-1' },
      },
    ]);
  });

  it('keeps the record and offers to try again when a delete fails', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    pressFlowDelete();
    answer('Delete transaction');
    await act(async () => failWrite(new Error('Network Error')));
    await settle();

    expect(flow()).toMatchObject({ view: { name: 'details' }, isSaving: false, notice: 'deleteUncertain' });
    expect(
      screen.getByText(
        'Couldn’t confirm the delete. It may already have gone through; checking its status never applies it twice.',
      ),
    ).toBeTruthy();
    // The sheet explains it in place, so no toast does.
    expect(mockToasts.shown).toEqual([]);

    fireEvent.press(screen.getByText('Check status'));
    await act(async () => answerWrite({ data: true }));
    await settle();

    const deleteKeys = mockedRequest.mock.calls
      .filter(([{ method }]) => method === 'DELETE')
      .map(([{ headers }]) => headers['Idempotency-Key']);
    expect(deleteKeys).toHaveLength(2);
    expect(new Set(deleteKeys).size).toBe(1);
    expect(flow()).toBeNull();
    expect(mockToasts.shown).toHaveLength(1);
  });

  it('asks to load the latest version when a delete finds the record changed', async () => {
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    pressFlowDelete();
    answer('Delete transaction');
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
    pressFlowDelete();

    expect(
      confirmation().getByText(
        '-2.75 · Food · Deleted wallet. It will be removed from history and period totals. No wallet balance will change.',
      ),
    ).toBeTruthy();
  });

  it('drops a delete confirmation whose record was found deleted meanwhile, and closes at once', async () => {
    const { store, openDetails, flow } = renderFlow();
    openDetails();
    await settle();
    pressFlowDelete();
    const confirm = confirmation().getByRole('button', { name: 'Delete transaction' });

    answerRead = () => Promise.reject(refusal(404, 'TRANSACTION_NOT_FOUND'));
    await act(async () => void (await store.dispatch(checkFlowRecord())));

    expect(asked()).toEqual([]);
    expect(screen.getByText('This transaction no longer exists')).toBeTruthy();
    fireEvent.press(confirm);
    expect(mockedRequest.mock.calls.filter(([{ method }]) => method === 'DELETE')).toEqual([]);

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(flow()).toBeNull();
  });

  it('drops a delete confirmation of a space the user left', async () => {
    const { store, openDetails } = renderFlow();
    openDetails();
    await settle();
    pressFlowDelete();
    const confirm = confirmation().getByRole('button', { name: 'Delete transaction' });

    act(() => {
      store.dispatch(activateSpace(2));
    });
    await settle();
    fireEvent.press(confirm);

    expect(asked()).toEqual([]);
    expect(mockedRequest.mock.calls.filter(([{ method }]) => method === 'DELETE')).toEqual([]);
  });

  it('keeps a deleted wallet unless another one is picked', async () => {
    stored = transactionDto({ wallet: null });
    const { openDetails } = renderFlow();

    openDetails();
    await settle();
    expect(screen.getByText('Deleted wallet')).toBeTruthy();

    fireEvent.press(screen.getByText('Edit'));
    fireEvent.changeText(screen.getByLabelText('Description'), 'Lunch');
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
    fireEvent.changeText(screen.getByLabelText('Description'), 'Lunch');
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
    expect(mockToasts.shown).toEqual([]);
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
    fireEvent.press(screen.getByLabelText('New wallet'));

    const { draftId } = flow()!;
    expect(flow()?.away).toBe('wallet');
    expect(screen.queryByText('New transaction')).toBeNull();
    fireEvent.press(screen.getByLabelText('New wallet', { includeHiddenElements: true }));
    expect(routes()).toMatchObject([
      { name: ScreenNames.HOME_SCREEN },
      { name: ScreenNames.TRANSACTION_EDITOR_SCREEN },
      { name: ScreenNames.ADD_WALLET_SCREEN, params: { id: 'new', forDraft: draftId } },
    ]);

    act(() => {
      store.dispatch(walletCreated({ draftId, walletId: 8 }));
      navigationRef.goBack();
      store.dispatch(awayEnded({ draftId }));
    });

    expect(screen.getByText('New transaction')).toBeTruthy();
    expect(routeNames()).toEqual(WITH_EDITOR);
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
    // The sheet's own button, over the form's.
    fireEvent.press(screen.getAllByText('Create category').at(-1)!);
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

    expect(screen.getByText('Categories didn’t load')).toBeTruthy();
    expect(screen.getByText('Wallets didn’t load')).toBeTruthy();
    expect(screen.queryByText('No expense categories yet')).toBeNull();
    expect(screen.queryByLabelText('New wallet')).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Amount'), '12');
    expect(screen.getByText('Save expense')).toBeDisabled();

    failing = ['/wallets'];
    fireEvent.press(screen.getByLabelText('Retry loading categories'));
    await settle();
    fireEvent.press(screen.getByText('Food'));

    expect(screen.getByText('Wallets didn’t load')).toBeTruthy();
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

    expect(screen.getByText('Categories didn’t load')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeEnabled();
  });

  it('saves an edit of the description alone while the lists fail to load, and returns to the details', async () => {
    mockedRequest.mockImplementation((config: { url: string; method: string }) =>
      config.method === 'GET' && (config.url.endsWith('/categories') || config.url.endsWith('/wallets'))
        ? Promise.reject(new Error('Network Error'))
        : respond(config),
    );
    const { openDetails, flow } = renderFlow();

    openDetails();
    await settle();
    fireEvent.press(screen.getByText('Edit'));
    await settle();
    expect(screen.getByText('No changes yet')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText('Description'), 'Lunch with Sam');
    expect(screen.getByText('Wallets didn’t load')).toBeTruthy();
    fireEvent.press(screen.getByText('Save changes'));

    stored = transactionDto({ amount: '50.00', version: 3, description: 'Lunch with Sam' });
    await act(async () =>
      answerWrite({ data: { transaction: stored, wallets: [{ id: 1, balance: 50, is_deleted: false }] } }),
    );
    await settle();

    const [patch] = mockedRequest.mock.calls.filter(([config]) => config.method === 'PATCH');
    expect(patch[0]).toMatchObject({ data: { description: 'Lunch with Sam' }, headers: { 'If-Match': '"2"' } });
    expect(flow()).toMatchObject({ view: { name: 'details' }, saved: { description: 'Lunch with Sam', version: 3 } });
    expect(routeNames()).toEqual(HOME_ONLY);
  });

  it('starts on an active wallet when none or a gone one was asked for, with nothing to discard', async () => {
    const { open, flow } = renderFlow();

    open(TransactionType.EXPENSE, 99);
    await settle();

    expect(flow()?.draft?.walletId).toBe(7);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(asked()).toEqual([]);
    expect(flow()).toBeNull();
  });

  it('offers a wallet first when the space has none, and saves nothing until there is one', async () => {
    walletsResponse = { ...wallets, wallets: [] };
    const { open, flow } = renderFlow();

    open(TransactionType.EXPENSE, null);
    await settle();
    fillExpense();

    expect(flow()?.draft?.walletId).toBeNull();
    expect(screen.getByText('No wallets yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create wallet' })).toBeTruthy();
    expect(screen.queryByLabelText('New wallet')).toBeNull();
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

    expect(screen.getByText('Old gym · archived')).toBeTruthy();
    expect(screen.getByText(/^Archived category\. You can keep it/)).toBeTruthy();
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
    fireEvent.changeText(screen.getByLabelText('Description'), 'Yearly pass');

    fireEvent.press(screen.getByText('More'));
    fireEvent.press(screen.getByLabelText('Back to the form'));
    fireEvent.press(screen.getByText(/, \d{2}:\d{2}$/));
    fireEvent.press(screen.getByText('Yesterday'));
    fireEvent.press(screen.getByText('Apply'));
    const { timestamp } = flow()!.draft!;

    fireEvent.press(screen.getByLabelText('New wallet'));
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
      navigationRef.goBack();
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
