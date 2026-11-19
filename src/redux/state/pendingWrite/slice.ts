import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { TransactionModel } from '@api/models';
import { logoutMe } from '../auth/thunks';
import type { StoredOperation } from '../transaction/operations';

// `sending`: stored before it went out, so one found after a restart got no answer we know of.
// `unknown`: no answer, or a server failure; it may have applied. `expired`: a create the server has no trace of
// after its key ran out; only the user sends it again.
// A create an older build left is looked up by its operation id before anything is sent: `checking` until the server
// answers; `found`: it had applied, as `found` holds; `retry`: nothing applied, so its draft waits for the user to
// review it and send it again under the same id. `accessLost`: a create whose space is no longer the user's, so it
// can be saved nowhere.
export type PendingWriteStatus = 'sending' | 'unknown' | 'expired' | 'checking' | 'found' | 'retry' | 'accessLost';

export interface PendingWrite {
  operation: StoredOperation;
  status: PendingWriteStatus;
  found?: TransactionModel;
}

// Only the user moves these on; nothing is sent or looked up for them by itself.
export const WAITING_FOR_USER: PendingWriteStatus[] = ['expired', 'found', 'retry', 'accessLost'];

interface PendingWriteState {
  // Whose writes these are; another user's stay in storage until they sign in.
  userId: number | null;
  writes: PendingWrite[];
}

const initialState: PendingWriteState = { userId: null, writes: [] };

const keyOf = ({ operation }: PendingWrite) => operation.idempotencyKey;

// A create sent under a recovered operation id is looked up, never resent blindly, when its send got no answer.
// Entries stored before the flag existed are recognized by the statuses only such a create has.
const restoredWrite = (write: PendingWrite): PendingWrite => {
  const { operation, status } = write;
  const isRecovered =
    operation.type === 'create' && (operation.recovered === true || status === 'checking' || status === 'retry');
  if (!isRecovered) return { ...write, status: status === 'sending' ? 'unknown' : status };

  return {
    ...write,
    operation: { ...operation, recovered: true },
    status: status === 'sending' || status === 'unknown' ? 'checking' : status,
  };
};

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
        .forEach((write) => state.writes.push(restoredWrite(write)));
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
      {
        payload,
      }: PayloadAction<{
        key: string;
        status: Exclude<PendingWriteStatus, 'sending'> | null;
        found?: TransactionModel;
      }>,
    ) => {
      const index = state.writes.findIndex((entry) => keyOf(entry) === payload.key);
      if (index === -1) return;

      if (payload.status === null) state.writes.splice(index, 1);
      else state.writes[index] = { ...state.writes[index], status: payload.status, found: payload.found };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);
  },
});

export const { writesRestored, writeRecorded, writeSettled } = pendingWriteSlice.actions;

export default pendingWriteSlice.reducer;
