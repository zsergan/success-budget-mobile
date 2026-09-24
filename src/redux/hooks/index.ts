import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

import type { SpaceArg } from '@redux/api/baseApi';
import type { AppDispatch, RootState } from '@redux/Store';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';

export const useAppDispatch = useDispatch<AppDispatch>;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// The argument for a space-scoped query: skipped, not failed, while no space is active.
export const useSpaceArg = (): SpaceArg | typeof skipToken => {
  const spaceId = useAppSelector(selectCurrentSpaceId);

  return spaceId === null ? skipToken : { spaceId };
};
