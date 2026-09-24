interface InitialState {
  // The invite endpoint's rate limit isn't scoped to one space, so this
  // survives a space switch or leaving/reopening the Members screen -- only
  // logout clears it. Absolute deadline (ms since epoch), not a countdown,
  // so it stays correct across backgrounding.
  inviteCooldownUntil: number | null;
}

const initialState: InitialState = {
  inviteCooldownUntil: null,
};

export default initialState;
