import type { ErrorResponse, ProfileResponse } from '@api/dto';

interface InitialState extends Partial<ProfileResponse> {
  isLoading: boolean;
  // Guards against a fetchProfile resolving after logout (or after a newer
  // fetchProfile) and repopulating a profile that shouldn't be there.
  requestId?: string;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  id: undefined,
  email: undefined,
  name: undefined,
  isLoading: false,
};

export default initialState;
