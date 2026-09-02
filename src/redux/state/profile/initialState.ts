import type { ErrorResponse, ProfileResponse } from '@api/dto';

interface InitialState extends Partial<ProfileResponse> {
  isLoading: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  id: undefined,
  email: undefined,
  name: undefined,
  baseCurrency: undefined,
  isLoading: false,
};

export default initialState;
