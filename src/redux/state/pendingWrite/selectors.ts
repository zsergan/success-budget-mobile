import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';

export const selectPendingWrites = (state: RootState) => state.pendingWrite.writes;

export const selectPendingWrite = (state: RootState, key: string) =>
  state.pendingWrite.writes.find(({ operation }) => operation.idempotencyKey === key);

// The latest delete of this record that got no answer; it is settled with its own key before anything else is sent.
export const selectUnconfirmedDelete = (state: RootState, transactionId: string) =>
  state.pendingWrite.writes.findLast(
    ({ operation, status }) =>
      status === 'unknown' && operation.type === 'delete' && operation.transactionId === transactionId,
  );

export const selectSpacePendingWrites = createSelector(
  [selectPendingWrites, (_state: RootState, spaceId: number | null) => spaceId],
  (writes, spaceId) => writes.filter(({ operation }) => operation.spaceId === spaceId),
);
