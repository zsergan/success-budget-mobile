import type { ComponentProps } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { resetSheets, swipeDownSheet, withSheetHost } from '@components/ConfirmationSheet/testing';
import LeaveSpaceDialog from './LeaveSpaceDialog';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

const renderDialog = (props: Partial<ComponentProps<typeof LeaveSpaceDialog>> = {}) => {
  const onConfirm = jest.fn(() => Promise.resolve());
  const onCancel = jest.fn();

  render(
    withSheetHost(
      <LeaveSpaceDialog
        isVisible
        spaceName="Flat"
        isPending={false}
        isOwner={false}
        memberCount={3}
        error={null}
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />,
    ),
  );

  return { onConfirm, onCancel };
};

beforeEach(() => resetSheets());

it.each([
  ['a member', { isOwner: false, memberCount: 3 }, 'Leave this space?', 'You lose access to “Flat”.', 'Leave space'],
  [
    'an owner with other members',
    { isOwner: true, memberCount: 3 },
    'Leave this space?',
    'You’re the owner, so leaving hands “Flat” to the next member.',
    'Leave space',
  ],
  [
    'the last member',
    { isOwner: true, memberCount: 1 },
    'Leave and delete “Flat”?',
    'You’re its only member, so leaving permanently deletes this space.',
    'Leave and delete',
  ],
])('tells %s what leaving does', async (_who, props, title, description, action) => {
  const { onConfirm } = renderDialog(props);

  expect(screen.getByRole('header', { name: title })).toBeTruthy();
  expect(screen.getByText(description)).toBeTruthy();
  await act(async () => fireEvent.press(screen.getByRole('button', { name: action })));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

it('cannot be closed while leaving, and shows a failure over its actions', () => {
  const { onCancel } = renderDialog({ isPending: true, error: 'Couldn’t leave. Try again.' });

  expect(screen.getByRole('button', { name: 'Leaving…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  swipeDownSheet();

  expect(onCancel).not.toHaveBeenCalled();
  expect(screen.getByText('Couldn’t leave. Try again.')).toBeTruthy();
});
