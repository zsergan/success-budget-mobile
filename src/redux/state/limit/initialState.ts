import type { ErrorResponse } from '@api/dto';
import type { LimitModel, OverAllocationModel } from '@api/models';

interface InitialState {
  total: LimitModel | null;
  categoryLimits: LimitModel[];
  overAllocation: OverAllocationModel | null;
  isLoading: boolean;
  isDeleting: boolean;
  // Guards against an older fetch resolving after a newer one (e.g. a fast
  // space switch) and clobbering it — only the fulfilled/rejected action
  // matching this id is applied.
  requestId?: string;
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
