import type { ErrorResponse, Space } from '@api/dto';

interface InitialState {
  spaces: Space[];
  currentSpaceId: number | null;
  isLoading: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  spaces: [],
  currentSpaceId: null,
  isLoading: false,
};

export default initialState;
