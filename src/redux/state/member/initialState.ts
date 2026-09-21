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
}

const initialState: InitialState = {
  members: [],
  isLoading: false,
  hasLoaded: false,
};

export default initialState;
