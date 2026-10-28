interface AuthState {
  // The session saved on this device: still being read, unreadable, or read (whether or not one was saved).
  storedSession: 'reading' | 'failed' | 'read';
  // The one read allowed to settle storedSession; any other answer, however late, changes nothing.
  storedSessionRead: { requestId: string; attempt: number } | null;
  isSignedIn: boolean;
  userToken: string | null;
  userEmail: string | null;
  // The one registration allowed to set userEmail; any other answer, however late, changes nothing.
  registrationRequestId: string | null;
  // Bumped whenever the session ends; captured before a request to tell later
  // whether the session that sent it is still active.
  sessionKey: number;
}

const initialState: AuthState = {
  storedSession: 'reading',
  storedSessionRead: null,
  isSignedIn: false,
  userToken: null,
  userEmail: null,
  registrationRequestId: null,
  sessionKey: 0,
};

export default initialState;
