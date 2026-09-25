import type { ErrorResponse } from '@api/dto';

interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  userToken: string | null;
  userEmail: string | null;
  error?: ErrorResponse;
  // Bumped whenever the session ends; captured before a request to tell later
  // whether the session that sent it is still active.
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
