import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@redux/Store';

export const selectSpace = (state: RootState) => state.space;

export const selectCurrentSpaceId = (state: RootState) => state.space.currentSpaceId;

const selectSpaces = (state: RootState) => state.space.spaces;

export const selectCurrentSpace = createSelector(selectSpaces, selectCurrentSpaceId, (spaces, currentSpaceId) =>
  spaces.find((space) => space.id === currentSpaceId),
);

export const selectCurrentSpaceCurrencyCode = createSelector(
  selectCurrentSpace,
  (currentSpace) => currentSpace?.currency.code,
);
