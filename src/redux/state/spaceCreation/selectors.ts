import type { RootState } from '@redux/Store';
import { selectProfileId } from '../profile/selectors';

// The signed-in user's creation whose outcome is not known yet, once read from storage.
export const selectSpaceCreationAttempt = (state: RootState) => {
  const { userId, attempt } = state.spaceCreation;

  return userId !== null && userId === selectProfileId(state) ? attempt : null;
};
