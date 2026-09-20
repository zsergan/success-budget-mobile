import type { ErrorResponse, Space } from '@api/dto';

interface InitialState {
  spaces: Space[];
  currentSpaceId: number | null;
  isLoading: boolean;
  // Guards against an older fetchSpaces resolving after a newer one (e.g.
  // two quick space creations) and clobbering currentSpaceId.
  requestId?: string;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  spaces: [],
  currentSpaceId: null,
  isLoading: false,
};

export default initialState;
