import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { CategoryModel } from '@api/models';
import type { ConfirmAction } from '@hooks';
import useConfirmAction from '@hooks/useConfirmAction';
import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { AppColor, TransactionType } from '@shared/enums';
import {
  finishDismissals,
  holdDismissals,
  pressSheetBackdrop,
  resetSheets,
  swipeDownSheet,
  withSheetHost,
} from '@components/ConfirmationSheet/testing';
import { toastCount, withToasts } from '@components/Toast/testing';
import DeleteCategoryDialog from './DeleteCategoryDialog';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const CATEGORY: CategoryModel = {
  id: 5,
  name: 'Food',
  transactionType: TransactionType.EXPENSE,
  icon: 'grocery',
  color: AppColor.EVERGREEN,
  isActive: true,
  transactionCount: 0,
  limit: null,
  archivedAt: null,
};

// Deleting and archiving are the same request; only the copy differs.
const MODES = {
  delete: {
    category: CATEGORY,
    title: 'Delete “Food”?',
    confirm: 'Delete category',
    pending: 'Deleting…',
    archived: false,
  },
  archive: {
    category: { ...CATEGORY, transactionCount: 3 },
    title: 'Archive “Food”?',
    confirm: 'Archive category',
    pending: 'Archiving…',
    archived: true,
  },
};

const deferredResponse = (archived = false) => {
  let resolve!: () => void;
  let reject!: (message: string) => void;

  mockedRequest.mockReturnValueOnce(
    new Promise((res, rej) => {
      resolve = () => res({ data: { archived } });
      reject = (message) => rej({ response: { status: 409, data: { message, statusCode: 409 } } });
    }),
  );

  return { resolve: () => act(async () => resolve()), reject: (message: string) => act(async () => reject(message)) };
};

const renderDialog = (category: CategoryModel) => {
  const store = createAppStore();
  const deletion = { current: undefined as unknown as ConfirmAction<CategoryModel> };

  store.dispatch(activateSpace(1));

  const Harness = () => {
    deletion.current = useConfirmAction<CategoryModel>();

    return <DeleteCategoryDialog deletion={deletion.current} />;
  };

  render(<Provider store={store}>{withSheetHost(withToasts(<Harness />))}</Provider>);

  const open = () => act(() => deletion.current.open(category));

  return { store, open };
};

const dismissAll = () => {
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  pressSheetBackdrop();
  swipeDownSheet();
};

beforeEach(() => {
  jest.clearAllMocks();
  resetSheets();
});

describe.each(Object.entries(MODES))('%s', (_mode, { category, title, confirm, pending, archived }) => {
  it('sends one request for a double tap and stays open and locked until the server answers', async () => {
    const response = deferredResponse(archived);
    const { open } = renderDialog(category);

    open();
    fireEvent.press(screen.getByText(confirm));
    fireEvent.press(screen.getByText(pending));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    dismissAll();

    expect(mockedRequest).toHaveBeenCalledTimes(1);
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/spaces/1/categories/5', method: 'DELETE' }),
    );
    expect(screen.getByText(title)).toBeTruthy();

    await response.resolve();

    expect(screen.queryByText(title)).toBeNull();
    expect(screen.getByText(`“Food” ${archived ? 'archived' : 'deleted'}`)).toBeTruthy();
  });

  it('shows a failure inside the dialog, allows a retry, and forgets it on reopening', async () => {
    const failure = deferredResponse();
    const { open } = renderDialog(category);

    open();
    fireEvent.press(screen.getByText(confirm));
    await failure.reject('Category is in use');

    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText('Category is in use')).toBeTruthy();
    expect(toastCount()).toBe(0);

    const retry = deferredResponse();

    fireEvent.press(screen.getByText(confirm));

    expect(mockedRequest).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Category is in use')).toBeNull();

    await retry.reject('Still in use');
    fireEvent.press(screen.getByText('Cancel'));

    expect(screen.queryByText(title)).toBeNull();

    open();

    expect(screen.queryByText('Still in use')).toBeNull();
  });
});

describe('completion', () => {
  it.each([
    ['archived although the cached count said none', MODES.delete, true, '“Food” archived'],
    ['deleted although the cached count said some', MODES.archive, false, '“Food” deleted'],
  ])('says what the server did: %s', async (_case, { category, confirm }, archived, text) => {
    const response = deferredResponse(archived);
    const { open } = renderDialog(category);

    open();
    fireEvent.press(screen.getByText(confirm));
    await response.resolve();

    expect(screen.getByText(text)).toBeTruthy();
    expect(toastCount()).toBe(1);
  });

  it('waits for the dialog to finish closing', async () => {
    const response = deferredResponse(true);
    const { open } = renderDialog(MODES.archive.category);

    open();
    fireEvent.press(screen.getByText(MODES.archive.confirm));
    holdDismissals();
    await response.resolve();
    expect(toastCount()).toBe(0);

    finishDismissals();
    expect(screen.getByText('“Food” archived')).toBeTruthy();
  });

  it('names the kind of thing instead of a long name', async () => {
    const response = deferredResponse(false);
    const { open } = renderDialog({ ...MODES.delete.category, name: 'Weekend groceries and snacks' });

    open();
    fireEvent.press(screen.getByText(MODES.delete.confirm));
    await response.resolve();

    expect(screen.getByText('Category deleted')).toBeTruthy();
  });

  it('says nothing about a deletion answered after a space switch', async () => {
    const response = deferredResponse();
    const { store, open } = renderDialog(MODES.delete.category);

    open();
    fireEvent.press(screen.getByText(MODES.delete.confirm));
    act(() => {
      store.dispatch(activateSpace(2));
    });
    await response.resolve();

    expect(toastCount()).toBe(0);
  });
});

it.each([
  ['a space switch', (store: ReturnType<typeof createAppStore>) => store.dispatch(activateSpace(2))],
  [
    'a logout and a new login',
    async (store: ReturnType<typeof createAppStore>) => {
      await store.dispatch(logoutMe());
      store.dispatch(loginMe.fulfilled('token-2', 'req-login-2', { email: 'a@b.com', password: 'password1' }));
      store.dispatch(activateSpace(1));
    },
  ],
])('closes a locked dialog on %s and ignores its late failure', async (_change, change) => {
  const response = deferredResponse();
  const { store, open } = renderDialog(MODES.delete.category);

  open();
  fireEvent.press(screen.getByText(MODES.delete.confirm));
  await act(async () => {
    await change(store);
  });

  expect(screen.queryByText(MODES.delete.title)).toBeNull();

  await response.reject('Category is in use');

  expect(screen.queryByText('Category is in use')).toBeNull();
});

it.each(['succeeds', 'fails'] as const)(
  'runs a dialog opened in the next space on its own while the old request is out, which then %s',
  async (outcome) => {
    const { title, confirm, pending } = MODES.delete;
    const first = deferredResponse();
    const { store, open } = renderDialog(MODES.delete.category);
    open();
    fireEvent.press(screen.getByText(confirm));

    holdDismissals();
    act(() => {
      store.dispatch(activateSpace(2));
    });
    const second = deferredResponse();
    open();
    finishDismissals();

    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    fireEvent.press(screen.getByText(confirm));
    expect(mockedRequest).toHaveBeenCalledTimes(2);
    expect(mockedRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: '/spaces/2/categories/5', method: 'DELETE' }),
    );

    if (outcome === 'succeeds') await first.resolve();
    else await first.reject('Category is in use');

    expect(screen.getByText(pending)).toBeTruthy();
    expect(screen.queryByText('Category is in use')).toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    dismissAll();
    expect(screen.getByText(title)).toBeTruthy();

    await second.resolve();
    expect(screen.queryByText(title)).toBeNull();
  },
);

describe('the limit notice', () => {
  it.each([
    ['delete', MODES.delete.category],
    ['archive', MODES.archive.category],
  ])('on %s, says a group limit keeps its other categories', (_mode, category) => {
    const { open } = renderDialog({ ...category, limit: { id: 9, name: 'Fun' } });

    open();

    expect(screen.getByText('Excluded from the “Fun” limit')).toBeTruthy();
    expect(screen.getByText(/removed from the categories this limit tracks; the limit keeps its others/)).toBeTruthy();
    expect(screen.getByText('If it was the limit’s last category, the limit is deleted.')).toBeTruthy();
  });

  it.each([
    ['delete', MODES.delete.category],
    ['archive', MODES.archive.category],
  ])("on %s, says the category's own limit is deleted with it", (_mode, category) => {
    const { open } = renderDialog({ ...category, limit: { id: 9, name: null } });

    open();

    expect(screen.getByText('Its limit is deleted too')).toBeTruthy();
  });
});

describe('the copy', () => {
  it('deletes a category without history without showing it as an object', () => {
    const { open } = renderDialog(MODES.delete.category);
    open();

    expect(screen.getByText('Nothing is filed under this category yet, so it is removed completely.')).toBeTruthy();
    expect(screen.queryByText('Expense category · no transactions')).toBeNull();
  });

  it('archives one with history, naming its count and where it stays, and that its spending still counts', () => {
    const { open } = renderDialog({ ...MODES.archive.category, limit: { id: 9, name: 'Fun' } });
    open();

    expect(screen.getByText('Expense category · 3 transactions')).toBeTruthy();
    expect(screen.getByText(/It stays in Categories under Archived\.$/)).toBeTruthy();
    expect(screen.getByText('Spending already logged here stays in this month’s total.')).toBeTruthy();
  });

  it('does not say deleted spending stays counted', () => {
    const { open } = renderDialog({ ...MODES.delete.category, limit: { id: 9, name: 'Fun' } });
    open();

    expect(screen.queryByText('Spending already logged here stays in this month’s total.')).toBeNull();
  });
});
