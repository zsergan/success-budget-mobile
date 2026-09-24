import type { Space } from '@api/dto';
import { baseApi } from '@redux/api/baseApi';

export const spaceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSpaces: build.query<Space[], void>({
      query: () => ({ url: '/spaces' }),
      providesTags: ['Spaces'],
    }),
  }),
});
