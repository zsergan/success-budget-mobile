import { createAction } from '@reduxjs/toolkit';

// For a mutation outside the transaction domain that still affects
// transaction history (e.g. wallet/thunks.ts's addWallet, when it creates a
// starting-balance transaction) to bump dataRevision without importing
// transaction/thunks.ts, which would create wallet <-> transaction <->
// wallet import cycle (transaction/thunks.ts already imports fetchWallets).
export const transactionsInvalidated = createAction<{ contextKey: number }>('transaction/invalidated');
