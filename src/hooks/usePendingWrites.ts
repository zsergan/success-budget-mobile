import { useCallback, useState } from 'react';

import { useAppDispatch } from '@redux/hooks';
import type { ResumedWrite } from '@redux/state/pendingWrite/thunks';
import { resumePendingWrites } from '@redux/state/pendingWrite/thunks';
import { classifyTransactionError } from '@redux/state/transaction/operations';
import { getErrorMessage } from '@shared/utils';
import useAlert from './useAlert';

// A delete that finds the record gone did what it was for.
const wentThrough = ({ operation, result }: ResumedWrite) =>
  result.kind === 'done' ||
  result.kind === 'applied' ||
  (result.kind === 'refused' && operation.type === 'delete' && classifyTransactionError(result.error) === 'notFound');

// Settles the writes left without an answer and says how that went; ones still without one stay on screen.
const usePendingWrites = () => {
  const dispatch = useAppDispatch();
  const { addAlert } = useAlert();
  const [isResuming, setResuming] = useState(false);

  const resume = useCallback(async () => {
    setResuming(true);
    const resumed = await dispatch(resumePendingWrites());
    setResuming(false);

    const refused = resumed.find((write) => write.result.kind === 'refused' && !wentThrough(write));
    const saved = resumed.filter(wentThrough).length;

    if (refused?.result.kind === 'refused') {
      addAlert(`An earlier save was refused: ${getErrorMessage(refused.result.error)}`);
    } else if (saved > 0) {
      addAlert(saved === 1 ? 'An earlier save went through' : `${saved} earlier saves went through`);
    }
  }, [dispatch, addAlert]);

  return { resume, isResuming };
};

export default usePendingWrites;
