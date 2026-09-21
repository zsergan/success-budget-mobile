import type { ErrorResponse, SpaceMember } from '@api/dto';

interface InitialState {
  members: SpaceMember[];
  isLoading: boolean;
  // True once fetchMembers has resolved at least once for the active
  // space -- lets useMembersData tell the first load apart from a
  // background refresh.
  hasLoaded: boolean;
  // Guards against an older fetchMembers resolving after a newer one (e.g.
  // a space switch while a fetch is in flight) and clobbering the list.
  requestId?: string;
  error?: ErrorResponse;
  // The invite endpoint's rate limit isn't scoped to one space, so this
  // deliberately survives a space switch or leaving/reopening the Members
  // screen -- only logout clears it. Absolute deadline (ms since epoch),
  // not a countdown, so it stays correct across backgrounding.
  inviteCooldownUntil: number | null;
}

const initialState: InitialState = {
  members: [],
  isLoading: false,
  hasLoaded: false,
  inviteCooldownUntil: null,
};

export default initialState;
