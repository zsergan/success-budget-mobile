import type { ErrorResponse } from '@api/dto';

interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  userToken: string | null;
  userEmail: string | null;
  error?: ErrorResponse;
}

const initialState: AuthState = {
  isLoading: true,
  isSignedIn: false,
  userToken: null,
  userEmail: null,
};

export default initialState;
