import { createSelector } from '@reduxjs/toolkit';

import type { Space } from '@api/dto';
import type { RootState } from '@redux/Store';
import { SpaceType } from '@shared/enums';
import { spaceApi } from './api';

const EMPTY_SPACES: Space[] = [];

export const selectCurrentSpaceId = (state: RootState) => state.space.currentSpaceId;

export const selectSpacesResult = spaceApi.endpoints.getSpaces.select();

export const selectSpaces = (state: RootState) => selectSpacesResult(state).data ?? EMPTY_SPACES;

export const selectCurrentSpace = createSelector(selectSpaces, selectCurrentSpaceId, (spaces, currentSpaceId) =>
  spaces.find((space) => space.id === currentSpaceId),
);

export const selectCurrentSpaceCurrencyCode = createSelector(
  selectCurrentSpace,
  (currentSpace) => currentSpace?.currency.code,
);

export const pickFallbackSpaceId = (spaces: Pick<Space, 'id' | 'type'>[]): number | null => {
  if (spaces.length === 0) return null;

  const personalSpace = spaces.find((space) => space.type === SpaceType.PERSONAL);

  if (personalSpace) return personalSpace.id;

  // No personal space (a group-only account, or it was just left/deleted) --
  // fall back to the lowest id so the pick is deterministic rather than
  // whatever order the backend happened to return.
  return spaces.reduce((lowest, space) => (space.id < lowest.id ? space : lowest)).id;
};
