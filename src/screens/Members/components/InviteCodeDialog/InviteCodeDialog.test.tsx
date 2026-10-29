import { useState } from 'react';
import { Share } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { InviteResponse } from '@api/dto';
import { pressSheetBackdrop, resetSheets, swipeDownSheet, withSheetHost } from '@components/ConfirmationSheet/testing';
import InviteCodeDialog from './InviteCodeDialog';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

const INVITE: InviteResponse = {
  id: 4,
  email: 'anna@example.com',
  expires_at: '2026-11-01T00:00:00.000Z',
  code: 'K7QX2P',
};
const TITLE = 'Invite sent to anna@example.com';

const renderDialog = () => {
  const onClose = jest.fn();

  const Harness = () => {
    const [invite, setInvite] = useState<InviteResponse | null>(INVITE);

    return (
      <InviteCodeDialog
        invite={invite}
        spaceName="Flat"
        onClose={() => {
          onClose();
          setInvite(null);
        }}
      />
    );
  };

  render(withSheetHost(<Harness />));

  return { onClose };
};

beforeEach(() => {
  jest.clearAllMocks();
  resetSheets();
});
afterEach(() => jest.restoreAllMocks());

it('shows the code once, selectable, with how to pass it on', () => {
  renderDialog();

  expect(screen.getByRole('header', { name: TITLE })).toBeTruthy();
  expect(screen.getByText('K7QX2P').props.selectable).toBe(true);
  expect(screen.getByText(/this code is shown only once/)).toBeTruthy();
  expect(screen.getByText(/it works until it’s used or expires/)).toBeTruthy();
});

it('shares the code with the space name, once for a double tap, and stays open', async () => {
  let finishSharing!: () => void;
  const share = jest
    .spyOn(Share, 'share')
    .mockReturnValue(new Promise((resolve) => (finishSharing = () => resolve({ action: Share.sharedAction }))));
  renderDialog();

  fireEvent.press(screen.getByRole('button', { name: 'Share invite' }));
  fireEvent.press(screen.getByRole('button', { name: 'Share invite' }));

  expect(share).toHaveBeenCalledTimes(1);
  expect(share).toHaveBeenCalledWith({ message: 'Join "Flat" on Success Budget -- use invite code K7QX2P' });

  await act(async () => finishSharing());

  expect(screen.getByText(TITLE)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Share invite' }));

  expect(share).toHaveBeenCalledTimes(2);
});

it('says in the dialog when sharing failed, and drops it on the next try', async () => {
  const share = jest.spyOn(Share, 'share').mockRejectedValueOnce(new Error('No app can share this'));
  renderDialog();

  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Share invite' })));

  expect(screen.getByText('Couldn’t open sharing. Try again, or copy the code.')).toBeTruthy();
  expect(screen.getByText(TITLE)).toBeTruthy();

  share.mockReturnValueOnce(new Promise(() => {}));
  fireEvent.press(screen.getByRole('button', { name: 'Share invite' }));

  expect(screen.queryByText('Couldn’t open sharing. Try again, or copy the code.')).toBeNull();
});

it('says nothing when the share sheet is dismissed', async () => {
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction });
  renderDialog();

  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Share invite' })));

  expect(screen.queryByText(/Couldn’t open sharing/)).toBeNull();
  expect(screen.getByText(TITLE)).toBeTruthy();
});

it.each([
  ['Close', () => fireEvent.press(screen.getByRole('button', { name: 'Close' }))],
  ['the backdrop', pressSheetBackdrop],
  ['a swipe', swipeDownSheet],
])('closes on %s', (_way, close) => {
  const { onClose } = renderDialog();

  close();

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(TITLE)).toBeNull();
});
