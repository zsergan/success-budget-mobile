import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';

import { finishDismissals, holdDismissals, resetSheets, withSheetHost } from '@components/ConfirmationSheet/testing';
import { useToastControl } from '@components/Toast/ToastProvider';
import { toastCount, withToasts } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { profileApi } from '@redux/state/profile/api';
import { activateSpace } from '@redux/state/space/thunks';
import LeaveSpaceDialog from '../components/LeaveSpaceDialog/LeaveSpaceDialog';
import useMemberActions from './useMemberActions';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

jest.useFakeTimers();

// Leaving goes through the real toast: its switch ends the Members screen's ticket, so only the expected handoff can
// carry the message to the screen the user is sent back to.
beforeEach(() => resetSheets());

const createStore = () => {
  const store = createAppStore();
  store.dispatch(activateSpace(10));
  store.dispatch(
    profileApi.util.upsertQueryEntries([
      { endpointName: 'getProfile', arg: undefined, value: { id: 777, email: 'me@example.com', name: 'Me' } },
    ]),
  );

  return store;
};

const renderLeave = () => {
  const store = createStore();

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{withSheetHost(withToasts(children))}</Provider>
  );
  const { result } = renderHook(
    () => {
      const control = useToastControl();
      const actions = useMemberActions({ onLeft: () => control.reportRoute(['root', 'settings'], false) });
      return { control, actions };
    },
    { wrapper: Wrapper },
  );
  act(() => result.current.control.reportRoute(['root', 'settings', 'members'], false));

  return { store, result };
};

it('confirms leaving on the screen it returns to, after its own switch', async () => {
  const { store, result } = renderLeave();
  mockedRequest.mockResolvedValue({ data: undefined });

  act(() => result.current.actions.requestAction({ kind: 'leave', spaceName: 'Trip' }));
  await act(() => result.current.actions.confirm());

  expect(store.getState().space.currentSpaceId).not.toBe(10);
  expect(screen.getByText('You left “Trip”')).toBeTruthy();
});

it('says nothing when the user had switched away before the leave settled', async () => {
  const { store, result } = renderLeave();
  let resolveLeave!: () => void;
  mockedRequest.mockReturnValue(new Promise((resolve) => (resolveLeave = () => resolve({ data: undefined }))));

  act(() => result.current.actions.requestAction({ kind: 'leave', spaceName: 'Trip' }));
  let confirming!: Promise<void>;
  act(() => {
    confirming = result.current.actions.confirm();
  });
  act(() => {
    store.dispatch(activateSpace(20));
  });
  resolveLeave();
  await act(() => confirming);
  act(() => result.current.control.reportRoute(['root', 'settings'], false));

  expect(toastCount()).toBe(0);
});

it('shows the result on the screen it returns to only once the confirmation has closed, at the bottom', async () => {
  const store = createStore();
  mockedRequest.mockResolvedValue({ data: undefined });
  let actions!: ReturnType<typeof useMemberActions>;
  let control!: ReturnType<typeof useToastControl>;

  const Members = () => {
    control = useToastControl();
    actions = useMemberActions({ onLeft: () => control.reportRoute(['root', 'settings'], false) });

    return (
      <LeaveSpaceDialog
        isVisible={actions.target?.kind === 'leave'}
        spaceName="Trip"
        isPending={actions.isPending}
        isOwner={false}
        memberCount={2}
        error={actions.error}
        onConfirm={actions.confirm}
        onCancel={actions.cancel}
      />
    );
  };

  render(<Provider store={store}>{withSheetHost(withToasts(<Members />))}</Provider>);
  act(() => control.reportRoute(['root', 'settings', 'members'], false));
  act(() => actions.requestAction({ kind: 'leave', spaceName: 'Trip' }));

  holdDismissals();
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Leave space' })));

  expect(store.getState().space.currentSpaceId).not.toBe(10);
  expect(screen.getByRole('header', { name: 'Leave this space?' })).toBeTruthy();
  expect(toastCount()).toBe(0);

  finishDismissals();

  expect(screen.queryByRole('header', { name: 'Leave this space?' })).toBeNull();
  expect(screen.getAllByText('You left “Trip”')).toHaveLength(1);
  expect(StyleSheet.flatten(screen.getByTestId('toast-position').props.style)).toMatchObject({ bottom: 34 + 12 });
});
