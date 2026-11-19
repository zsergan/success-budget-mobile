import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { restorePendingWrites } from '@redux/state/pendingWrite/thunks';
import { selectProfileId } from '@redux/state/profile/selectors';
import usePendingWrites from './usePendingWrites';
import useToast from './useToast';

// Picks up the signed-in user's unsettled writes from the last run, and tries them again on every return to the app.
// An edit an older build left that only moved a record to another wallet cannot be kept, and the user is told so.
const usePendingWritesSync = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const userId = useAppSelector(selectProfileId);
  const { resume } = usePendingWrites();

  useEffect(() => {
    if (userId === undefined) return;

    const ticket = toast.begin();
    void dispatch(restorePendingWrites(userId)).then((retired) => {
      if (retired.length > 0) {
        ticket.show({
          tone: 'info',
          text: 'A wallet change made before this update wasn’t kept: transactions no longer belong to wallets',
          subject: 'retired-wallet-edits',
        });
      }

      return resume();
    });
  }, [dispatch, toast, userId, resume]);

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
