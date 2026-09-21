import type { ErrorResponse, Space } from '@api/dto';

interface InitialState {
  spaces: Space[];
  currentSpaceId: number | null;
  // Bumped on every real space activation (switch, fallback pick, create,
  // accept, leave-with-fallback) and on logout -- never reused, including
  // across a logout/login cycle. wallet/category/limit/transaction/member
  // each record the value they were last told about and use it to reject a
  // response that belongs to a context that is no longer current, even
  // before their own fetch for the new context resolves. See
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
