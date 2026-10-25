import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { pressSheetBackdrop, resetSheets, withSheetHost } from '@components/ConfirmationSheet/testing';
import DeleteAccountDialog from './DeleteAccountDialog';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);
const mockedRequest = jest.fn();
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

const press = (label: string) => fireEvent.press(screen.getByRole('button', { name: label }));
const header = () => screen.getByRole('header').props.children;

const renderDialog = () => {
  const onClose = jest.fn();
  render(withSheetHost(<DeleteAccountDialog isVisible onClose={onClose} />));
  return { onClose };
};

beforeEach(() => {
  jest.clearAllMocks();
  resetSheets();
});

it('walks through its three steps and never offers to delete', () => {
  renderDialog();

  expect(screen.getByText('Step 1 of 3')).toBeTruthy();
  expect(header()).toBe('Delete this account for good?');
  expect(screen.getByText('Your full transaction history')).toBeTruthy();

  press('Continue');
  expect(screen.getByText('Step 2 of 3')).toBeTruthy();
  press('Continue');
  expect(screen.getByText('Enter your password')).toBeTruthy();

  fireEvent.changeText(screen.getByLabelText('Password'), 'secret-1');
  press('Back');
  expect(header()).toBe('Delete this account for good?');
  press('Continue');
  expect(screen.getByLabelText('Password').props.value).toBe('secret-1');
  press('Continue');

  expect(screen.getByText('Step 3 of 3')).toBeTruthy();
  expect(screen.queryByText(/accepted/)).toBeNull();
  expect(
    screen.getByText(
      'Account deletion isn’t available yet, so your password wasn’t checked. This is a preview of the flow.',
    ),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Delete account' })).toBeDisabled();
  press('Delete account');

  expect(mockedRequest).not.toHaveBeenCalled();
});

it('does not count one space as the whole account', () => {
  renderDialog();

  expect(screen.queryByText(/\d+ (wallet|limit|categor)/)).toBeNull();
});

it('starts over after it is closed', () => {
  const { onClose } = renderDialog();

  press('Continue');
  pressSheetBackdrop();
  expect(onClose).toHaveBeenCalledTimes(1);

  act(() => screen.rerender(withSheetHost(<DeleteAccountDialog isVisible onClose={onClose} />)));
  expect(screen.getByText('Step 1 of 3')).toBeTruthy();
});
