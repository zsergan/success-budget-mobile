import { useCallback } from 'react';

import { useAppStore } from '@redux/hooks';
import { memberApi } from '@redux/state/member/api';
import { activeMemberIds } from '@redux/state/member/selectors';
import { selectProfileId } from '@redux/state/profile/selectors';
import type { DraftAssignment } from '@redux/state/transactionFlow/draft';
import { defaultAssignment, keptAssignment } from '@redux/state/transactionFlow/draft';

// Read when a form starts, from what is already known: the signed-in user and the space's cached members.
const useAssignmentDefaults = () => {
  const store = useAppStore();

  const forNew = useCallback(() => defaultAssignment(selectProfileId(store.getState())), [store]);

  const forAnother = useCallback(
    (spaceId: number, last: DraftAssignment | null) => {
      const state = store.getState();
      const members = memberApi.endpoints.getMembers.select({ spaceId })(state).data;

      return keptAssignment(last, { userId: selectProfileId(state), memberIds: activeMemberIds(members) });
    },
    [store],
  );

  return { forNew, forAnother };
};

export default useAssignmentDefaults;
