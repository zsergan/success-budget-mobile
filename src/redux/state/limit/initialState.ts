import type { GetLimitsResponse } from '@api/dto';

interface InitialState extends GetLimitsResponse {
  isLoading: boolean;
}

const initialState: InitialState = {
  limits: [],
  overall: {
    spent: 0,
    sum: 0,
    in_percent: 0,
  },
  isLoading: false,
};

export default initialState;
