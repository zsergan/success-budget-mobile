import { fireEvent, render, screen } from '@testing-library/react-native';

import { resetSheets, withSheetHost } from '@components/ConfirmationSheet/testing';
import LogoutDialog from './LogoutDialog';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

beforeEach(() => resetSheets());

it('asks before logging out, with a neutral action', () => {
  const onConfirm = jest.fn();
  const onClose = jest.fn();
  render(withSheetHost(<LogoutDialog isVisible onClose={onClose} onConfirm={onConfirm} />));

  expect(screen.getByRole('header', { name: 'Log out of your account?' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.press(screen.getByRole('button', { name: 'Log out' }));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
