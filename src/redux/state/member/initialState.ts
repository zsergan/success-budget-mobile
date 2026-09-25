interface InitialState {
  // Epoch ms, not a countdown, so it survives backgrounding; the rate limit isn't
  // per space, so only logout clears it.
  inviteCooldownUntil: number | null;
}

const initialState: InitialState = {
  inviteCooldownUntil: null,
};

export default initialState;
