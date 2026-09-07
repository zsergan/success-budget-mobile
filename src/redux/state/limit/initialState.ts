import type { ErrorResponse } from '@api/dto';
import type { LimitModel, OverAllocationModel } from '@api/models';

interface InitialState {
  total: LimitModel | null;
  categoryLimits: LimitModel[];
  overAllocation: OverAllocationModel | null;
  isLoading: boolean;
  isDeleting: boolean;
  error?: ErrorResponse;
}

const initialState: InitialState = {
  total: null,
  categoryLimits: [],
  overAllocation: null,
  isLoading: false,
  isDeleting: false,
};

export default initialState;
