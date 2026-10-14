import { skipToken } from '@reduxjs/toolkit/query';

import { useAppSelector, useRecentArg, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { useGetRecentTransactionsQuery } from '@redux/state/transaction/api';

// Space data the app can open without (its blocks show their own loading, empty and error states),
// asked for alongside the launch so the first screens rarely wait for it.
const useSpaceDataWarmup = () => {
  const isSignedIn = useAppSelector((state) => state.auth.isSignedIn);
  const spaceArg = useSpaceArg();
  const recentArg = useRecentArg();

  useGetCategoriesQuery(isSignedIn ? spaceArg : skipToken);
  useGetLimitsQuery(isSignedIn ? spaceArg : skipToken);
  useGetRecentTransactionsQuery(isSignedIn ? recentArg : skipToken);
};

export default useSpaceDataWarmup;
