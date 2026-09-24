import type { ListenerEffectAPI, ListenerMiddlewareInstance, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import type { RootState } from '@redux/Store';
import { categoryApi } from '@redux/state/category/api';
import { walletApi } from '@redux/state/wallet/api';
import { transactionsInvalidated } from '@redux/state/transaction/actions';
import { fetchTransactions } from '@redux/state/transaction/thunks';

type LegacyResource = 'Transactions';

// Temporary, until every financial domain is on RTK Query: tags can't reach data
// still kept in slices, so RTK Query writes re-fetch those slices here instead.
export const startLegacyBridge = (listener: ListenerMiddlewareInstance<RootState>) => {
  const refresh = (
    { dispatch, getState }: ListenerEffectAPI<RootState, ThunkDispatch<RootState, unknown, UnknownAction>>,
    spaceId: number,
    resources: LegacyResource[],
  ) => {
    const { currentSpaceId, contextKey } = getState().space;

    if (spaceId !== currentSpaceId) return;

    if (resources.includes('Transactions')) {
      dispatch(fetchTransactions());
      dispatch(transactionsInvalidated({ contextKey }));
    }
  };

  listener.startListening({
    matcher: categoryApi.endpoints.updateCategory.matchFulfilled,
    effect: (action, api) => refresh(api, action.meta.arg.originalArgs.spaceId, ['Transactions']),
  });

  listener.startListening({
    matcher: categoryApi.endpoints.deleteCategory.matchFulfilled,
    effect: (action, api) =>
      refresh(api, action.meta.arg.originalArgs.spaceId, action.payload.archived ? ['Transactions'] : []),
  });

  listener.startListening({
    matcher: walletApi.endpoints.createWallet.matchFulfilled,
    effect: (action, api) =>
      refresh(api, action.meta.arg.originalArgs.spaceId, action.payload.transaction ? ['Transactions'] : []),
  });

  listener.startListening({
    matcher: walletApi.endpoints.updateWallet.matchFulfilled,
    effect: (action, api) => refresh(api, action.meta.arg.originalArgs.spaceId, ['Transactions']),
  });

  listener.startListening({
    matcher: walletApi.endpoints.deleteWallet.matchFulfilled,
    effect: (action, api) => refresh(api, action.meta.arg.originalArgs.spaceId, ['Transactions']),
  });
};
