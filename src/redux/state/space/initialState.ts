import type { ErrorResponse, Space } from '@api/dto';

interface InitialState {
  spaces: Space[];
  currentSpaceId: number | null;
  // Bumped on every real space activation (switch, fallback pick, create,
  // accept, leave-with-fallback) and on logout -- never reused, including
  // across a logout/login cycle. Slice-held space data (member) records the
  // value it was last told about and uses it to reject a response that
  // belongs to a context that is no longer current. RTK Query data needs no
  // such guard: its cache entries are keyed by spaceId. See
  // `spaceContextChanged`/`activateSpace`.
  contextKey: number;
  isLoading: boolean;
  // Guards against an older fetchSpaces resolving after a newer one (e.g.
  // two quick space creations) and clobbering currentSpaceId.
  requestId?: string;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  spaces: [],
  currentSpaceId: null,
  contextKey: 0,
  isLoading: false,
};

export default initialState;
