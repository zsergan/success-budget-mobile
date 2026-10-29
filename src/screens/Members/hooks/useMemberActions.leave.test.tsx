import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, screen } from '@testing-library/react-native';

import { withSheetHost } from '@components/ConfirmationSheet/testing';
import { useToastControl } from '@components/Toast/ToastProvider';
import { toastCount, withToasts } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { profileApi } from '@redux/state/profile/api';
import { activateSpace } from '@redux/state/space/thunks';
import useMemberActions from './useMemberActions';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

jest.useFakeTimers();

// Leaving goes through the real toast: its switch ends the Members screen's ticket, so only the expected handoff can
// carry the message to the screen the user is sent back to.
const renderLeave = () => {
  const store = createAppStore();
  store.dispatch(activateSpace(10));
  store.dispatch(
    profileApi.util.upsertQueryEntries([
      { endpointName: 'getProfile', arg: undefined, value: { id: 777, email: 'me@example.com', name: 'Me' } },
    ]),
  );

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
