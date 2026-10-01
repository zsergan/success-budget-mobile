import { useEffect } from 'react';

import { useAppDispatch } from '@redux/hooks';
import { spaceApi } from '@redux/state/space/api';

// A refused space is checked against a fresh spaces list instead of being retried; the
// selection listener then moves off a space the user no longer belongs to.
const useSpaceAccessRecovery = (isDenied: boolean) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isDenied) dispatch(spaceApi.util.invalidateTags(['Spaces']));
  }, [dispatch, isDenied]);
};

export default useSpaceAccessRecovery;
