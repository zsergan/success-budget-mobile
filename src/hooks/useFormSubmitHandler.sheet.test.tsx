import { Text, TouchableOpacity } from 'react-native';
import { useForm } from 'react-hook-form';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  cancelDismissals,
  finishDismissals,
  holdDismissals,
  resetSheets,
  withSheetHost,
} from '@components/ConfirmationSheet/testing';
import type { Ref } from '@components/Modals/BottomSheetModal/BottomSheetModal';
import BottomSheetModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import { toastCount, withToasts } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import useFormSubmitHandler from './useFormSubmitHandler';

jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);
jest.mock('expo-secure-store');

jest.useFakeTimers();

const NAME_TAKEN = 'Name taken';

// One request per press, answered by the test.
const requests: { fail: () => void }[] = [];
const send = () =>
  new Promise((_, reject) => requests.push({ fail: () => reject({ statusCode: 409, message: NAME_TAKEN }) }));

const Editor = () => {
  const { handleSubmit, formState } = useForm();
  const { onSubmit, submitError } = useFormSubmitHandler({
    handleSubmit,
    formState,
    onSubmit: send,
    onSuccess: () => {},
  });

  return (
    <>
      <TouchableOpacity onPress={onSubmit}>
        <Text>Save</Text>
      </TouchableOpacity>
      {submitError && <Text testID="inline-error">{submitError}</Text>}
    </>
  );
};

const renderEditor = () => {
  const store = createAppStore();
  store.dispatch(activateSpace(1));
  let sheet: Ref | null = null;

  const Screen = () => (
    <BottomSheetModal ref={(instance) => void (sheet = instance)}>
      <Editor />
    </BottomSheetModal>
  );

  render(<Provider store={store}>{withSheetHost(withToasts(<Screen />))}</Provider>);
  act(() => sheet?.present());

  return { store, open: () => act(() => sheet?.present()), close: () => act(() => sheet?.dismiss()) };
};

// A block body, so act does not wait for the request the press starts.
const save = () =>
  act(async () => {
    fireEvent.press(screen.getByText('Save'));
  });
const failRequest = (index = requests.length - 1) => act(async () => requests[index].fail());
// Stepped, so the toast's own animations run as they would.
const settleToasts = () => {
  for (let step = 0; step < 10; step += 1) act(() => jest.advanceTimersByTime(100));
};

const errorToasts = () => screen.queryAllByText(NAME_TAKEN).filter((node) => node.props.testID !== 'inline-error');

beforeEach(() => {
  requests.splice(0);
  resetSheets();
});

it('keeps a failure in the form while the form stays open', async () => {
  renderEditor();

  await save();
  await failRequest();

  expect(screen.getByTestId('inline-error')).toBeTruthy();
  expect(toastCount()).toBe(0);
});

it('shows one error toast for a failure that arrives while the sheet is closing, once it has closed', async () => {
  const { close } = renderEditor();
  await save();
  holdDismissals();
  close();

  await failRequest();
  settleToasts();

  expect(screen.getByText('Save')).toBeTruthy();
  expect(toastCount()).toBe(0);

  finishDismissals();
  settleToasts();

  expect(screen.queryByText('Save')).toBeNull();
  expect(errorToasts()).toHaveLength(1);
  expect(toastCount()).toBe(1);
});

it('shows the error toast for a failure that arrives after the sheet has closed', async () => {
  const { close } = renderEditor();
  await save();
  close();

  await failRequest();
  settleToasts();

  expect(errorToasts()).toHaveLength(1);
});

it('does not replay an error already shown in the form when the sheet then closes', async () => {
  const { close } = renderEditor();
  await save();
  await failRequest();

  close();
  settleToasts();

  expect(toastCount()).toBe(0);
});

it('keeps an old submission’s error out of the editor opened again before its answer', async () => {
  const { open, close } = renderEditor();
  await save();
  close();
  open();

  await failRequest();
  settleToasts();

  expect(screen.queryByTestId('inline-error')).toBeNull();
  expect(toastCount()).toBe(0);

  close();
  settleToasts();

  expect(errorToasts()).toHaveLength(1);
});

it('puts the error back in the form when the close is reversed', async () => {
  const { close } = renderEditor();
  await save();
  holdDismissals();
  close();
  await failRequest();

  cancelDismissals();
  settleToasts();

  expect(screen.getByTestId('inline-error')).toBeTruthy();
  expect(toastCount()).toBe(0);

  close();
  settleToasts();

  expect(toastCount()).toBe(0);
});

it('says nothing about a failure that arrives after the space changed', async () => {
  const { store, close } = renderEditor();
  await save();
  holdDismissals();
  close();

  act(() => {
    store.dispatch(activateSpace(2));
  });
  await failRequest();
  finishDismissals();
  settleToasts();

  expect(toastCount()).toBe(0);
});
