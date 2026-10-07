import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

export const selectPendingWrites = (state: RootState) => state.pendingWrite.writes;

export const selectPendingWrite = (state: RootState, key: string) =>
  state.pendingWrite.writes.find(({ operation }) => operation.idempotencyKey === key);

export const selectSpacePendingWrites = createSelector(
  [selectPendingWrites, (_state: RootState, spaceId: number | null) => spaceId],
  (writes, spaceId) => writes.filter(({ operation }) => operation.spaceId === spaceId),
);
