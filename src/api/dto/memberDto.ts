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
}

// A pending invite row. `id` is the invite id, used with
// DELETE /spaces/:id/invites/:inviteId -- there is no user yet, so
// `user_id` is always null.
export interface SpaceInviteRow extends SpaceMemberRowBase {
  type: 'invite';
  user_id: null;
  name: null;
  role: null;
}

export type SpaceMember = SpaceMemberRow | SpaceInviteRow;

export interface InviteRequest {
  email: string;
}

export interface InviteResponse {
  id: number;
  email: string;
  expires_at: string;
  code: string;
}
