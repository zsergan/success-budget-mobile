import type { ErrorResponse, SpaceMember } from '@api/dto';

interface InitialState {
  members: SpaceMember[];
  isLoading: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  members: [],
  isLoading: false,
};

export default initialState;
