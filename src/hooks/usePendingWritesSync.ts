import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { restorePendingWrites } from '@redux/state/pendingWrite/thunks';
import { selectProfileId } from '@redux/state/profile/selectors';
import usePendingWrites from './usePendingWrites';

// Picks up the signed-in user's unsettled writes from the last run, and tries them again on every return to the app.
const usePendingWritesSync = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectProfileId);
  const { resume } = usePendingWrites();

  useEffect(() => {
    if (userId === undefined) return;

    void dispatch(restorePendingWrites(userId)).then(resume);
  }, [dispatch, userId, resume]);

  useEffect(() => {
    if (userId === undefined) return;

    let wasInBackground = false;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        wasInBackground = true;
      } else if (state === 'active' && wasInBackground) {
        wasInBackground = false;
        void resume();
      }
    });

    return () => subscription.remove();
  }, [userId, resume]);
};

export default usePendingWritesSync;
