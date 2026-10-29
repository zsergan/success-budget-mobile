// Tagged so a user_id and an invite id can't reach the wrong endpoint, and so
// removing someone stays distinct from leaving though both hit the same endpoint.
export type MemberActionTarget =
  | { kind: 'remove'; userId: number; label: string }
  | { kind: 'revoke'; inviteId: number; label: string }
  | { kind: 'leave'; spaceName: string };
