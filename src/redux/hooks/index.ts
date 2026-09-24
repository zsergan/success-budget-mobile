import type { TypedUseSelectorHook } from 'react-redux';
import { useCallback } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

import type { SpaceArg } from '@redux/api/baseApi';
import type { AppDispatch, AppStore, RootState } from '@redux/Store';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { TransactionsArg } from '@redux/state/transaction/api';
import { periodArg } from '@redux/state/transaction/api';
import { getCurrentMonthRange } from '@shared/utils';

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

// Home's recent activity is History's default period, so both read the same cache entry.
export const useCurrentMonthArg = (): TransactionsArg | typeof skipToken => {
  const spaceId = useAppSelector(selectCurrentSpaceId);

  return spaceId === null ? skipToken : periodArg(spaceId, getCurrentMonthRange());
};
