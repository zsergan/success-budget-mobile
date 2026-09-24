import type { ErrorResponse } from '@api/dto';

interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  userToken: string | null;
  userEmail: string | null;
  error?: ErrorResponse;
  // Bumped every time the signed-in session ends (explicit logout, or
  // checkAuth finding no token at boot). Captured before a request, it tells
  // afterwards whether the session that sent it is still the active one
  // (see httpBaseQuery and the space selection thunks).
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
