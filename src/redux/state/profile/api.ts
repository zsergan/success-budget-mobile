import type { ProfileResponse } from '@api/dto';
import { baseApi } from '@redux/api/baseApi';

export const profileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfile: build.query<ProfileResponse, void>({
      query: () => ({ url: '/users/profile' }),
      providesTags: ['Profile'],
    }),
  }),
});
