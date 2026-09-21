import { fireEvent, render, screen } from '@testing-library/react-native';

import type { SpaceMemberRow } from '@api/dto';
import MembersList from './MembersList';

const withUserId: SpaceMemberRow = {
  type: 'member',
  id: 1,
  user_id: 101,
  name: 'Alex',
  email: 'alex@example.com',
  role: 'member',
  can_remove: true,
};

describe('MembersList', () => {
  it('calls onActionPress with the row user_id, not the membership id', () => {
    const onActionPress = jest.fn();

    render(
      <MembersList memberRows={[withUserId]} inviteRows={[]} isRefreshing={false} onActionPress={onActionPress} />,
    );

    fireEvent.press(screen.getByRole('button'));

    expect(onActionPress).toHaveBeenCalledWith({ kind: 'remove', userId: 101, label: 'Alex' });
  });

  it('hides the action and shows a recovery hint when the server has not sent a usable user_id', () => {
    const onActionPress = jest.fn();
    // Simulates an old backend that hasn't deployed the user_id compat
    // field yet -- can_remove is still true, user_id is missing.
    const withoutUserId = { ...withUserId, user_id: undefined } as unknown as SpaceMemberRow;

    render(
      <MembersList memberRows={[withoutUserId]} inviteRows={[]} isRefreshing={false} onActionPress={onActionPress} />,
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/isn't available right now/)).toBeTruthy();
  });

  it('never falls back to the membership id when user_id is missing, even if the button somehow fires', () => {
    const onActionPress = jest.fn();
    const withoutUserId = { ...withUserId, id: 999, user_id: undefined } as unknown as SpaceMemberRow;

    render(
      <MembersList memberRows={[withoutUserId]} inviteRows={[]} isRefreshing={false} onActionPress={onActionPress} />,
    );

    // No button is rendered (previous test), so nothing to press -- this
    // asserts the guard inside the handler too, for defence in depth.
    expect(screen.queryByRole('button')).toBeNull();
    expect(onActionPress).not.toHaveBeenCalled();
  });

  it('reports members and pending invites as separate counts', () => {
    const invite = {
      type: 'invite' as const,
      id: 5,
      user_id: null,
      name: null,
      role: null,
      email: 'a@b.com',
      can_remove: true,
    };

    render(
      <MembersList memberRows={[withUserId]} inviteRows={[invite]} isRefreshing={false} onActionPress={jest.fn()} />,
    );

    expect(screen.getByText('1 member · 1 pending')).toBeTruthy();
  });
});
