interface InitialState {
  currentSpaceId: number | null;
  // Bumped on every real space activation and on logout -- never reused,
  // including across a logout/login cycle. Slice-held space data (member)
  // records the value it was last told about and uses it to reject a
  // response that belongs to a context that is no longer current. RTK Query
  // data needs no such guard: its cache entries are keyed by spaceId.
  contextKey: number;
  // When currentSpaceId was last chosen (ms since epoch); a spaces list
  // requested before that can't tell whether the selection is still valid.
  selectedAt: number;
}

const initialState: InitialState = {
  currentSpaceId: null,
  contextKey: 0,
  selectedAt: 0,
};

export default initialState;
