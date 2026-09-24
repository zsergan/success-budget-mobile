interface InitialState {
  currentSpaceId: number | null;
  // When currentSpaceId was last chosen (ms since epoch); a spaces list
  // requested before that can't tell whether the selection is still valid.
  selectedAt: number;
}

const initialState: InitialState = {
  currentSpaceId: null,
  selectedAt: 0,
};

export default initialState;
