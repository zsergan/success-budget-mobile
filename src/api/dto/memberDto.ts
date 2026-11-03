import type { Currency } from './currencyDto';

// The latest invitation email; `sent` means the mail server took it, not that it reached the inbox.
export type InviteEmailStatus = 'not_sent' | 'queued' | 'sending' | 'sent' | 'failed';

interface SpaceMemberRowBase {
  id: number;
  email: string;
  can_remove: boolean;
}

// A membership row. `id` is the *membership* id -- distinct from `user_id`,
// which is what DELETE /spaces/:id/members/:userId actually expects.
export interface SpaceMemberRow extends SpaceMemberRowBase {
  type: 'member';
  user_id: number;
  name: string | null;
  role: 'owner' | 'member';
  email_status?: null;
  can_resend?: false;
  resend_after_seconds?: null;
}

// A pending invite: `id` is the invite id (for DELETE /spaces/:id/invites/:inviteId).
// The delivery fields are optional: a server from before invitation emails leaves them out.
export interface SpaceInviteRow extends SpaceMemberRowBase {
  type: 'invite';
  user_id: null;
  name: null;
  role: null;
  email_status?: InviteEmailStatus;
  can_resend?: boolean;
  // A snapshot taken when the roster was answered; 0 when a resend is accepted now.
  resend_after_seconds?: number;
}

export type SpaceMember = SpaceMemberRow | SpaceInviteRow;

export interface InviteRequest {
  email: string;
}

// What a resend answers; the create answer adds the code.
export interface InviteState {
  id: number;
  email: string;
  expires_at: string;
  email_status?: InviteEmailStatus;
  resend_after_seconds?: number;
}

// The only response that carries the code; inviting an address again returns its active invitation.
export interface InviteResponse extends InviteState {
  code: string;
}

export interface InvitePreviewRequest {
  token: string;
}

// Neither the inviter, the members nor the space id: those come only with joining.
export interface InvitePreview {
  space: {
    name: string;
    currency: Currency;
  };
  expires_at: string;
}

// Exactly one of the two: the code from the email, or the token from its link.
export type AcceptInviteRequest = { code: string } | { token: string };
