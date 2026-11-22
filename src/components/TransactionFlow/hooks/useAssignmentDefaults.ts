import { useCallback } from 'react';

import { useAppStore } from '@redux/hooks';
import type { RootState } from '@redux/Store';
import { memberApi } from '@redux/state/member/api';
import { activeMemberIds } from '@redux/state/member/selectors';
import { selectProfileId } from '@redux/state/profile/selectors';
import { selectSpaces } from '@redux/state/space/selectors';
import type { AssignmentContext, DraftAssignment } from '@redux/state/transactionFlow/draft';
import { defaultAssignment, keptAssignment } from '@redux/state/transactionFlow/draft';

const contextOf = (state: RootState, spaceId: number): AssignmentContext => ({
  spaceType: selectSpaces(state).find(({ id }) => id === spaceId)?.type,
  userId: selectProfileId(state),
});

// Read once when a form starts, from what is already known about the flow's own space; a later load changes nothing.
const useAssignmentDefaults = () => {
  const store = useAppStore();

  const forNew = useCallback((spaceId: number) => defaultAssignment(contextOf(store.getState(), spaceId)), [store]);

  const forAnother = useCallback(
    (spaceId: number, last: DraftAssignment | null) => {
      const state = store.getState();
      const members = memberApi.endpoints.getMembers.select({ spaceId })(state).data;

      return keptAssignment(last, { ...contextOf(state, spaceId), memberIds: activeMemberIds(members) });
    },
    [store],
  );

  return { forNew, forAnother };
};

export default useAssignmentDefaults;
