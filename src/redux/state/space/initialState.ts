interface InitialState {
  currentSpaceId: number | null;
  // When currentSpaceId was last chosen (ms since epoch); a spaces list
  // requested before that can't tell whether the selection is still valid.
  selectedAt: number;
  // When the space's data was last asked for again on a return; a selection counts as a fresh load.
  refreshedAt: number;
}

const initialState: InitialState = {
  currentSpaceId: null,
  selectedAt: 0,
  refreshedAt: 0,
};

export default initialState;
