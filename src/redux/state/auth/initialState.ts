interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  userToken: string | null;
}

const initialState: AuthState = {
  isLoading: true,
  isSignedIn: false,
  userToken: null,
};

export default initialState;
