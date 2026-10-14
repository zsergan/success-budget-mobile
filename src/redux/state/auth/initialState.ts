import type { ErrorResponse } from '@api/dto';

interface AuthState {
  // The session saved on this device: still being read, unreadable, or read (whether or not one was saved).
  storedSession: 'reading' | 'failed' | 'read';
  isSignedIn: boolean;
  userToken: string | null;
  userEmail: string | null;
  error?: ErrorResponse;
  // Bumped whenever the session ends; captured before a request to tell later
  // whether the session that sent it is still active.
  sessionKey: number;
}

const initialState: AuthState = {
  storedSession: 'reading',
  isSignedIn: false,
  userToken: null,
  userEmail: null,
  sessionKey: 0,
};

export default initialState;
