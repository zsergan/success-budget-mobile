import type { ErrorResponse } from '@api/dto';

interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  userToken: string | null;
  userEmail: string | null;
  error?: ErrorResponse;
  // Bumped every time the signed-in session ends (explicit logout, or
  // checkAuth finding no token at boot). A mutation thunk that captured
  // this before an await can tell, after it resolves, whether the session
  // it ran in is still the one that's active -- see member/thunks.ts's
  // inviteMember for why contextKey (which also changes on an ordinary
  // space switch) isn't the right thing to compare there.
  sessionKey: number;
}

const initialState: AuthState = {
  isLoading: true,
  isSignedIn: false,
  userToken: null,
  userEmail: null,
  sessionKey: 0,
};

export default initialState;
