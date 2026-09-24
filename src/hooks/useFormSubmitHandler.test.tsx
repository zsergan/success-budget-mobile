import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { spaceApi } from '@redux/state/space/api';
import { SpaceType } from '@shared/enums';
import useFormSubmitHandler from './useFormSubmitHandler';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const mockedAddAlert = jest.fn();

jest.mock('./useAlert', () => () => ({ addAlert: mockedAddAlert }));

type AppStore = ReturnType<typeof createAppStore>;

const createSpace = (store: AppStore) =>
  store
    .dispatch(spaceApi.endpoints.createSpace.initiate({ name: 'Home', currency_id: 1, type: SpaceType.PERSONAL }))
    .unwrap();

const renderSubmitHandler = (onSubmit: (store: AppStore) => Promise<unknown> = createSpace) => {
  const store = createAppStore();
  const onSuccess = jest.fn();
  const reset = jest.fn();
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  const { result } = renderHook(
    () => {
      const { handleSubmit, formState } = useForm();

      return {
        formState,
        ...useFormSubmitHandler({
          handleSubmit,
          formState,
          onSubmit: () => onSubmit(store),
          onSuccess,
          getInvalidMessage: () => 'invalid',
          reset,
        }),
      };
    },
    { wrapper: Wrapper },
  );

  return { store, result, onSuccess, reset };
};

beforeEach(() => jest.clearAllMocks());

it('alerts a failure of the current session and leaves the form unsubmitted', async () => {
  mockedRequest.mockRejectedValue({ response: { data: { message: 'Name taken', statusCode: 409 } } });

  const { result, onSuccess } = renderSubmitHandler();

  await act(() => result.current.onSubmit());

  expect(mockedAddAlert).toHaveBeenCalledWith('Name taken');
  expect(onSuccess).not.toHaveBeenCalled();
  expect(result.current.formState.isSubmitSuccessful).toBe(false);
});

it('stays silent when a logout aborts the submit', async () => {
  mockedRequest.mockReturnValue(new Promise(() => {}));

  const { store, result, onSuccess, reset } = renderSubmitHandler();

  await act(async () => {
    const submitting = result.current.onSubmit();

    await store.dispatch(logoutMe());
    await submitting;
  });

  expect(mockedAddAlert).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
  expect(reset).not.toHaveBeenCalled();
  expect(result.current.formState.isSubmitSuccessful).toBe(false);
});

it('does not count a submit that resolves after the session ended as a save', async () => {
  let resolveSubmit!: () => void;

  const { store, result, onSuccess, reset } = renderSubmitHandler(
    () => new Promise<void>((resolve) => (resolveSubmit = resolve)),
  );

  await act(async () => {
    const submitting = result.current.onSubmit();

    await store.dispatch(logoutMe());
    resolveSubmit();
    await submitting;
  });

  expect(mockedAddAlert).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
  expect(reset).not.toHaveBeenCalled();
  expect(result.current.formState.isSubmitSuccessful).toBe(false);
});
