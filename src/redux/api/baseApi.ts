import { createApi } from '@reduxjs/toolkit/query/react';

import { httpBaseQuery } from './baseQuery';

// Endpoints are injected per domain from src/redux/state/<domain>/api.ts; the
// tags follow the resources in docs/server-data.md.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: httpBaseQuery,
  tagTypes: ['Spaces', 'Profile', 'Currencies', 'Wallets', 'Categories', 'Limits', 'Transactions', 'Members'],
  endpoints: () => ({}),
});

// Every space-scoped endpoint takes the space explicitly, so its cache entry
// and tags belong to that space; with no active space the caller passes skipToken.
export interface SpaceArg {
  spaceId: number;
}
