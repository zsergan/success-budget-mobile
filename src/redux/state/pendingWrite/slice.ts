import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import type { StoredOperation } from '../transaction/operations';

// `sending`: stored before it went out, so one found after a restart got no answer we know of.
// `unknown`: no answer, or a server failure; it may have applied. `expired`: a create the server has no trace of
// after its key ran out; only the user sends it again.
export type PendingWriteStatus = 'sending' | 'unknown' | 'expired';

export interface PendingWrite {
  operation: StoredOperation;
  status: PendingWriteStatus;
}

interface PendingWriteState {
  // Whose writes these are; another user's stay in storage until they sign in.
  userId: number | null;
  writes: PendingWrite[];
}

const initialState: PendingWriteState = { userId: null, writes: [] };

const keyOf = ({ operation }: PendingWrite) => operation.idempotencyKey;

const forUser = (state: PendingWriteState, userId: number) => {
  if (state.userId !== userId) {
    state.userId = userId;
    state.writes = [];
  }
};

const pendingWriteSlice = createSlice({
  name: 'pendingWrite',
  initialState,
  reducers: {
    // What storage held for the user joins what this session already started.
    writesRestored: (state, { payload }: PayloadAction<{ userId: number; writes: PendingWrite[] }>) => {
      forUser(state, payload.userId);
      const known = new Set(state.writes.map(keyOf));

      payload.writes
        .filter((write) => !known.has(keyOf(write)))
        .forEach((write) =>
          state.writes.push({ ...write, status: write.status === 'sending' ? 'unknown' : write.status }),
        );
    },
    writeRecorded: (state, { payload }: PayloadAction<{ userId: number; operation: StoredOperation }>) => {
      forUser(state, payload.userId);
      const write: PendingWrite = { operation: payload.operation, status: 'sending' };
      const index = state.writes.findIndex((entry) => keyOf(entry) === payload.operation.idempotencyKey);

      if (index === -1) state.writes.push(write);
      else state.writes[index] = write;
    },
    // Null once its outcome is known: applied, refused, or found by its operation id.
    writeSettled: (
      state,
      { payload }: PayloadAction<{ key: string; status: Exclude<PendingWriteStatus, 'sending'> | null }>,
    ) => {
      const index = state.writes.findIndex((entry) => keyOf(entry) === payload.key);
      if (index === -1) return;

      if (payload.status === null) state.writes.splice(index, 1);
      else state.writes[index].status = payload.status;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);
  },
});

export const { writesRestored, writeRecorded, writeSettled } = pendingWriteSlice.actions;

export default pendingWriteSlice.reducer;
