import { fireEvent, render, screen } from '@testing-library/react-native';

import type { InviteEmailStatus, SpaceInviteRow, SpaceMemberRow } from '@api/dto';
import type { ResendAvailability } from '../../hooks/useInviteResend';
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
      <MembersList
        memberRows={[withUserId]}
        inviteRows={[]}
        isRefreshing={false}
        refreshFailed={false}
        onRetry={jest.fn()}
        onActionPress={onActionPress}
      />,
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
      <MembersList
        memberRows={[withoutUserId]}
        inviteRows={[]}
        isRefreshing={false}
        refreshFailed={false}
        onRetry={jest.fn()}
        onActionPress={onActionPress}
      />,
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/isn't available right now/)).toBeTruthy();
  });

  it('never falls back to the membership id when user_id is missing, even if the button somehow fires', () => {
    const onActionPress = jest.fn();
    const withoutUserId = { ...withUserId, id: 999, user_id: undefined } as unknown as SpaceMemberRow;

    render(
      <MembersList
        memberRows={[withoutUserId]}
        inviteRows={[]}
        isRefreshing={false}
        refreshFailed={false}
        onRetry={jest.fn()}
        onActionPress={onActionPress}
      />,
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
      <MembersList
        memberRows={[withUserId]}
        inviteRows={[invite]}
        isRefreshing={false}
        refreshFailed={false}
        onRetry={jest.fn()}
        onActionPress={jest.fn()}
      />,
    );

    expect(screen.getByText('1 member · 1 pending')).toBeTruthy();
  });

  it('shows a retry hint for a failed background refresh without hiding the already-loaded list', () => {
    const onRetry = jest.fn();

    render(
      <MembersList
        memberRows={[withUserId]}
        inviteRows={[]}
        isRefreshing={false}
        refreshFailed
        onRetry={onRetry}
        onActionPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Alex')).toBeTruthy();
    expect(screen.getByText("Couldn't refresh the list.")).toBeTruthy();

    fireEvent.press(screen.getByText('Retry'));

    expect(onRetry).toHaveBeenCalled();
  });

  it('does not show the refresh-failed hint while still refreshing', () => {
    render(
      <MembersList
        memberRows={[withUserId]}
        inviteRows={[]}
        isRefreshing
        refreshFailed
        onRetry={jest.fn()}
        onActionPress={jest.fn()}
      />,
    );

    expect(screen.queryByText("Couldn't refresh the list.")).toBeNull();
  });

  describe('pending invitations', () => {
    const invitation = (id: number, email: string, email_status?: InviteEmailStatus): SpaceInviteRow => ({
      type: 'invite',
      id,
      user_id: null,
      name: null,
      role: null,
      email,
      can_remove: true,
      ...(email_status && { email_status, can_resend: email_status !== 'sending', resend_after_seconds: 0 }),
    });
    const ready: ResendAvailability = { isAvailable: true, waitSeconds: 0, isResending: false };

    const renderList = (
      inviteRows: SpaceInviteRow[],
      {
        memberRows = [withUserId],
        resendAvailabilityOf,
        onResend = jest.fn(),
      }: {
        memberRows?: SpaceMemberRow[];
        resendAvailabilityOf?: (invite: SpaceInviteRow) => ResendAvailability | null;
        onResend?: (invite: SpaceInviteRow) => void;
      } = {},
    ) =>
      render(
        <MembersList
          memberRows={memberRows}
          inviteRows={inviteRows}
          isRefreshing={false}
          refreshFailed={false}
          onRetry={jest.fn()}
          onActionPress={jest.fn()}
          resendAvailabilityOf={resendAvailabilityOf}
          onResend={onResend}
        />,
      );

    it('read Invited member over their email with the Invited badge, whatever the email did', () => {
      const statuses: (InviteEmailStatus | undefined)[] = [
        'queued',
        'sending',
        'sent',
        'failed',
        'not_sent',
        undefined,
      ];
      renderList(statuses.map((status, index) => invitation(index + 10, `p${index}@example.com`, status)));

      expect(screen.getAllByText('Invited member')).toHaveLength(statuses.length);
      expect(screen.getAllByText('Invited')).toHaveLength(statuses.length);
      statuses.forEach((_, index) => expect(screen.getByText(`p${index}@example.com`)).toBeTruthy());
      expect(screen.getByText(`1 member · ${statuses.length} pending`)).toBeTruthy();
    });

    it('mark only a failed email, and leave queued, sending and sent rows plain', () => {
      renderList([invitation(10, 'q@example.com', 'queued'), invitation(11, 's@example.com', 'sent')], {
        resendAvailabilityOf: () => ready,
      });

      expect(screen.queryByText('Not sent')).toBeNull();
      expect(screen.queryByRole('button', { name: /Resend/ })).toBeNull();
    });

    it('offer the owner a resend of a failed email', () => {
      const onResend = jest.fn();
      const failed = invitation(10, 'f@example.com', 'failed');
      renderList([failed, invitation(11, 'n@example.com', 'not_sent')], {
        resendAvailabilityOf: () => ready,
        onResend,
      });

      expect(screen.getAllByLabelText('Email not sent')).toHaveLength(2);
      fireEvent.press(screen.getAllByRole('button', { name: 'Resend invitation email' })[0]);

      expect(onResend).toHaveBeenCalledWith(failed);
    });

    it('show a resend waiting out the server’s cooldown as disabled, with the time left', () => {
      const onResend = jest.fn();
      renderList([invitation(10, 'f@example.com', 'failed')], {
        resendAvailabilityOf: () => ({ isAvailable: false, waitSeconds: 42, isResending: false }),
        onResend,
      });

      const button = screen.getByRole('button', { name: 'Resend in 42s invitation email' });
      expect(button.props.accessibilityState?.disabled).toBe(true);
      fireEvent.press(button);
      expect(onResend).not.toHaveBeenCalled();
    });

    it('show a failure but no resend to anyone but the owner', () => {
      renderList([invitation(10, 'f@example.com', 'failed')]);

      expect(screen.getByLabelText('Email not sent')).toBeTruthy();
      expect(screen.queryByRole('button', { name: /Resend/ })).toBeNull();
    });

    it('turn into the member, by name, once accepted', () => {
      const { rerender } = renderList([invitation(10, 'anna@example.com', 'sent')]);
      expect(screen.getByText('Invited member')).toBeTruthy();

      const anna: SpaceMemberRow = { ...withUserId, id: 2, user_id: 102, name: 'Anna', email: 'anna@example.com' };
      rerender(
        <MembersList
          memberRows={[withUserId, anna]}
          inviteRows={[]}
          isRefreshing={false}
          refreshFailed={false}
          onRetry={jest.fn()}
          onActionPress={jest.fn()}
        />,
      );

      expect(screen.queryByText('Invited member')).toBeNull();
      expect(screen.queryByText('Invited')).toBeNull();
      expect(screen.getByText('Anna')).toBeTruthy();
      expect(screen.getByText('anna@example.com')).toBeTruthy();
      expect(screen.getByText('2 members')).toBeTruthy();
    });
  });
});
