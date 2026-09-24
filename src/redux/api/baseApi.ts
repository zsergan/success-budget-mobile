import { createApi } from '@reduxjs/toolkit/query/react';

import { httpBaseQuery } from './baseQuery';

const TAG_TYPES = [
  'Spaces',
  'Profile',
  'Currencies',
  'Wallets',
  'Categories',
  'Limits',
  'Transactions',
  'Members',
] as const;

type TagType = (typeof TAG_TYPES)[number];

// Endpoints are injected per domain from src/redux/state/<domain>/api.ts; the
// tags follow the resources in docs/server-data.md.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: httpBaseQuery,
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});

// Every space-scoped endpoint takes the space explicitly, so its cache entry
// and tags belong to that space; with no active space the caller passes skipToken.
export interface SpaceArg {
  spaceId: number;
}

export const spaceTags = (spaceId: number, ...types: TagType[]) => types.map((type) => ({ type, id: spaceId }));

// A failed mutation (including one that outlived its session) leaves the cache
// alone; a success without a body arrives as null and still invalidates.
export const invalidatesOnSuccess =
  <Result, Arg>(getTags: (result: Result, arg: Arg) => ReturnType<typeof spaceTags>) =>
  (result: Result | undefined, error: unknown, arg: Arg) =>
    error ? [] : getTags(result as Result, arg);

// Screens that write space data are only reachable with an active space, so a
// null here fails the submit instead of sending a request to /spaces/null.
export const requireSpaceId = (spaceId: number | null): number => {
  if (spaceId === null) {
    throw new Error('Select a space first.');
  }

  return spaceId;
};
