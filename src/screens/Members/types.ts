// A confirmation target, not a raw id -- keeps a member's user_id and an
// invite's invite id from ever being passed to the wrong endpoint, and
// keeps "owner removes someone" distinct from "I'm leaving" even though
// both end up calling the same backend endpoint.
export type MemberActionTarget =
  | { kind: 'remove'; userId: number; label: string }
  | { kind: 'revoke'; inviteId: number; label: string }
  | { kind: 'leave' };
