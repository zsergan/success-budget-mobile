import type { ComponentProps } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { pressSheetBackdrop, resetSheets, withSheetHost } from '@components/ConfirmationSheet/testing';
import MemberRemovalDialog from './MemberRemovalDialog';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

type Target = ComponentProps<typeof MemberRemovalDialog>['target'];

const renderDialog = (target: Target, props: Partial<ComponentProps<typeof MemberRemovalDialog>> = {}) => {
  const onConfirm = jest.fn(() => Promise.resolve());
  const onCancel = jest.fn();

  render(
    withSheetHost(
      <MemberRemovalDialog
        target={target}
        spaceName="Flat"
        isPending={false}
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

it('removes a member, saying they lose access to the space', async () => {
  const { onConfirm, onCancel } = renderDialog({ kind: 'remove', userId: 4, label: 'Sam' });

  expect(screen.getByRole('header', { name: 'Remove Sam?' })).toBeTruthy();
  expect(screen.getByText('Sam loses access to “Flat”.')).toBeTruthy();
  pressSheetBackdrop();
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Remove member' })));

  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

it('revokes an invite, and keeps a failed one open with its error', () => {
  renderDialog({ kind: 'revoke', inviteId: 9, label: 'sam@example.com' }, { error: 'Invite already accepted' });

  expect(screen.getByRole('header', { name: 'Revoke this invite?' })).toBeTruthy();
  expect(screen.getByText('The invite sent to sam@example.com stops working.')).toBeTruthy();
  expect(screen.getByText('Invite already accepted')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Revoke invite' })).toBeEnabled();
});

it('shows nothing without a target', () => {
  renderDialog(null);

  expect(screen.queryByRole('header')).toBeNull();
});
