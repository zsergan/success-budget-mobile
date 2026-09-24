import type { RootState } from '@redux/Store';
import { profileApi } from './api';

const selectProfileResult = profileApi.endpoints.getProfile.select();

export const selectProfileId = (state: RootState) => selectProfileResult(state).data?.id;
