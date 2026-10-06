import type { ReactNode, Ref } from 'react';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { Category, GetCategoriesResponse, WalletsOverviewResponse } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import { createTransactionResponseDto, transactionDto } from '@redux/state/transaction/fixtures';
import { selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { mapTransaction } from '@api/models';
import { awayEnded, createOpened, detailsOpened, walletCreated } from '@redux/state/transactionFlow/slice';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import TransactionFlowSheet from './TransactionFlowSheet';

interface SheetProps {
  children: ReactNode;
  enablePanDownToClose?: boolean;
  onDismiss?: () => void;
  backdropComponent?: (props: object) => ReactNode;
}

const mockSheet: { props?: SheetProps; presents: number } = { presents: 0 };

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const { ScrollView, TextInput, View } = jest.requireActual('react-native');
  const SheetContext = React.createContext({ close: () => {} });

  // Shows its content only between present() and dismiss(), as the real modal does. The first sheet is the flow's.
  const BottomSheetModal = React.forwardRef(function BottomSheetModal(props: SheetProps, ref: Ref<unknown>) {
    const [isOpen, setOpen] = React.useState(false);
    const isFlowSheet = React.useRef(mockSheet.props === undefined || mockSheet.props === props).current;
    if (isFlowSheet) mockSheet.props = props;

    const dismiss = () => {
      setOpen((wasOpen: boolean) => {
        if (wasOpen) props.onDismiss?.();
        return false;
      });
    };

    React.useImperativeHandle(ref, () => ({
      present: () => {
        if (isFlowSheet) mockSheet.presents += 1;
        setOpen(true);
      },
      dismiss,
    }));

    return isOpen ? <SheetContext.Provider value={{ close: dismiss }}>{props.children}</SheetContext.Provider> : null;
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

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

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

let answerWrite: (value: unknown) => void = () => {};

let stored = transactionDto({ amount: '50.00', version: 2 });

const respond = ({ url, method }: { url: string; method: string }) => {
  if (method === 'POST' && url.endsWith('/categories')) {
    return Promise.resolve({ data: category(30, 'Bonus', TransactionType.INCOME) });
  }
  if (method === 'POST' || method === 'PATCH') return new Promise((resolve) => (answerWrite = resolve));
  if (url.endsWith('/transactions/tx-1')) return Promise.resolve({ data: stored });
  if (url.endsWith('/wallets')) return Promise.resolve({ data: wallets });
  if (url.endsWith('/categories')) return Promise.resolve({ data: categories });
  if (url.endsWith('/limits')) return Promise.resolve({ data: { total: null, categories: [], over_allocation: null } });

  return Promise.resolve({ data: [] });
};

const renderFlow = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));

  render(
    <Provider store={store}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 400, height: 800 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}
      >
        <TransactionFlowSheet />
      </SafeAreaProvider>
    </Provider>,
  );

  const open = (transactionType = TransactionType.EXPENSE) =>
    act(() => {
      store.dispatch(createOpened({ spaceId: 1, transactionType, walletId: 7, now: new Date().toISOString() }));
    });

  const openDetails = () =>
    act(() => {
      store.dispatch(detailsOpened({ spaceId: 1, transaction: mapTransaction(stored) }));
    });

  return { store, open, openDetails, flow: () => selectTransactionFlow(store.getState()) };
};

const settle = () => act(async () => jest.runOnlyPendingTimersAsync());

const fillExpense = () => {
  fireEvent.changeText(screen.getByLabelText('Amount'), '12');
  fireEvent.press(screen.getByText('Food'));
};

const pressBackdrop = () =>
  act(() => (mockSheet.props?.backdropComponent?.({}) as { props: { onPress: () => void } }).props.onPress());

beforeEach(() => {
  jest.clearAllMocks();
  mockSheet.props = undefined;
  stored = transactionDto({ amount: '50.00', version: 2 });
  mockSheet.presents = 0;
  mockedRequest.mockImplementation(respond);
  jest.spyOn(Alert, 'alert');
});

describe('TransactionFlowSheet', () => {
  it('opens one sheet and keeps it when asked to open again', async () => {
    const { open } = renderFlow();

    open();
    open(TransactionType.INCOME);
    await settle();

    expect(mockSheet.presents).toBe(1);
    expect(screen.getAllByText('New transaction')).toHaveLength(1);
    expect(screen.getByText('Save expense')).toBeTruthy();
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

    const [[patch]] = mockedRequest.mock.calls.filter(([config]) => config.method === 'PATCH');
    expect(patch.data).not.toHaveProperty('wallet_id');
  });

  it('offers no edit for an initial balance', async () => {
    stored = transactionDto({ kind: TransactionKind.INITIAL_BALANCE, transaction_type: TransactionType.INCOME });
    const { openDetails } = renderFlow();

    openDetails();
    await settle();

    expect(screen.getByText('Starting balance')).toBeTruthy();
    expect(screen.getByText('Set when the wallet was created')).toBeTruthy();
    expect(screen.queryByText('Edit')).toBeNull();
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
});
