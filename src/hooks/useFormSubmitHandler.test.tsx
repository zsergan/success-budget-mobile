import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { spaceApi } from '@redux/state/space/api';
import { acceptInviteAndSelect, activateSpace, createSpaceAndSelect } from '@redux/state/space/thunks';
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
  mockedRequest.mockRejectedValue({ response: { status: 409, data: { message: 'Name taken', statusCode: 409 } } });

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

describe('a space form submitted before a logout and a new login', () => {
  const submits = {
    create: (store: AppStore) =>
      store.dispatch(createSpaceAndSelect({ name: 'New', currency_id: 1, type: SpaceType.GROUP })),
    accept: (store: AppStore) => store.dispatch(acceptInviteAndSelect('123456')),
  };
  const oldResponses = {
    success: (resolve: (value: unknown) => void) => resolve({ data: { id: 7 } }),
    failure: (_: unknown, reject: (reason: unknown) => void) =>
      reject({ response: { status: 500, data: { message: 'Server error', statusCode: 500 } } }),
  };
  const cases = Object.entries(submits).flatMap(([form, submit]) =>
    Object.entries(oldResponses).map(([outcome, respond]) => [form, outcome, submit, respond] as const),
  );

  it.each(cases)('%s (%s): no space switch, navigation or alert', async (_form, _outcome, submit, respond) => {
    let settle!: () => void;

    mockedRequest.mockReturnValue(new Promise((resolve, reject) => (settle = () => respond(resolve, reject))));

    const { store, result, onSuccess, reset } = renderSubmitHandler(submit);

    await act(async () => {
      const submitting = result.current.onSubmit();

      await store.dispatch(logoutMe());
      store.dispatch(loginMe.fulfilled('token-2', 'req-login-2', { email: 'a@b.com', password: 'password1' }));
      store.dispatch(activateSpace(99));
      settle();
      await submitting;
    });

    expect(store.getState().space.currentSpaceId).toBe(99);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
    expect(mockedAddAlert).not.toHaveBeenCalled();
  });
});
