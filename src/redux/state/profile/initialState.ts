import type { ProfileResponse } from '@api/dto';

interface InitialState extends Partial<ProfileResponse> {
  isLoading: boolean;
}

const initialState: InitialState = {
  id: undefined,
  email: undefined,
  name: undefined,
  baseCurrency: undefined,
  isLoading: false,
};

export default initialState;
