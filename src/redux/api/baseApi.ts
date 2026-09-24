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
