import { useCallback, useState } from 'react';

import { deleteSubject } from '@components/TransactionFlow/deleteMessage';
import { useAppDispatch, useAppStore } from '@redux/hooks';
import type { ResumedWrite } from '@redux/state/pendingWrite/thunks';
import { resumePendingWrites } from '@redux/state/pendingWrite/thunks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { StoredOperation } from '@redux/state/transaction/operations';
import { classifyTransactionError } from '@redux/state/transaction/operations';
import { getErrorMessage } from '@shared/utils';
import useToast from './useToast';

const NOUNS: Record<StoredOperation['type'], string> = { create: 'save', update: 'edit', delete: 'delete' };

// Names what the writes were: one kind by its name, a mix of kinds as changes.
export const pendingWriteNoun = (operations: Pick<StoredOperation, 'type'>[]) => {
  const types = new Set(operations.map(({ type }) => type));
  return types.size === 1 ? NOUNS[[...types][0]] : 'change';
};

// A delete that finds the record gone did what it was for.
const wentThrough = ({ operation, result }: ResumedWrite) =>
  result.kind === 'done' ||
  result.kind === 'applied' ||
  (result.kind === 'refused' && operation.type === 'delete' && classifyTransactionError(result.error) === 'notFound');

const isSettled = ({ result }: ResumedWrite) => result.kind !== 'unknown' && result.kind !== 'stale';

// Settles the writes left without an answer, and says in one toast how those of the open space went; ones still
// without an answer stay in the banner.
const usePendingWrites = () => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const toast = useToast();
  const [isResuming, setResuming] = useState(false);

  const resume = useCallback(async () => {
    const ticket = toast.begin();
    const spaceId = selectCurrentSpaceId(store.getState());
    setResuming(true);
    const resumed = await dispatch(resumePendingWrites());
    setResuming(false);

    const here = resumed.filter(({ operation }) => operation.spaceId === spaceId);
    here.forEach((write) => {
      if (write.operation.type === 'delete' && isSettled(write)) {
        ticket.resolve(deleteSubject(write.operation.transactionId));
      }
    });

    const refused = here.filter((write) => write.result.kind === 'refused' && !wentThrough(write));
    const through = here.filter(wentThrough);
    const subject = 'pending-writes';

    if (refused.length > 0) {
      const [first] = refused;
      const noun = pendingWriteNoun(refused.map(({ operation }) => operation));
      const text =
        refused.length === 1 && first.result.kind === 'refused'
          ? `An earlier ${noun} was refused: ${getErrorMessage(first.result.error)}`
          : `${refused.length} earlier ${noun}s were refused`;

      ticket.show({ tone: 'error', text, subject });
    } else if (through.length > 0) {
      const noun = pendingWriteNoun(through.map(({ operation }) => operation));
      const text =
        through.length === 1 ? `An earlier ${noun} went through` : `${through.length} earlier ${noun}s went through`;

      ticket.show({ tone: 'success', text, subject });
    }
  }, [dispatch, store, toast]);

  return { resume, isResuming };
};

export default usePendingWrites;
