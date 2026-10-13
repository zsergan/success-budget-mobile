import type { TypedUseSelectorHook } from 'react-redux';
import { useCallback } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

import type { SpaceArg } from '@redux/api/baseApi';
import type { AppDispatch, AppStore, RootState } from '@redux/Store';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { RecentTransactionsArg } from '@redux/state/transaction/api';
import { recentArg } from '@redux/state/transaction/api';

export const useAppDispatch = useDispatch<AppDispatch>;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore = useStore.withTypes<AppStore>();

// Call the returned function when an action starts; the check it gives back tells,
// after an await, whether the session that started it is still the active one.
export const useSessionGuard = () => {
  const store = useAppStore();

  return useCallback(() => {
    const { sessionKey } = store.getState().auth;

    return () => store.getState().auth.sessionKey === sessionKey;
  }, [store]);
};

// The argument for a space-scoped query: skipped, not failed, while no space is active.
export const useSpaceArg = (): SpaceArg | typeof skipToken => {
  const spaceId = useAppSelector(selectCurrentSpaceId);

  return spaceId === null ? skipToken : { spaceId };
};

// Home's latest records, read by Home and kept warm by the initial load: one cache entry for both.
export const useRecentArg = (): RecentTransactionsArg | typeof skipToken => {
  const spaceId = useAppSelector(selectCurrentSpaceId);

  return spaceId === null ? skipToken : recentArg(spaceId);
};
