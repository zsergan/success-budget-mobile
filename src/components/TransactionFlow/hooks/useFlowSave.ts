import { useCallback, useEffect } from 'react';

import { useAlert, useTransactionOperation } from '@hooks';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { getDraftErrors, hasDraftErrors, toCreateRequest, toUpdateRequest } from '@redux/state/transactionFlow/draft';
import { hasUnsavedChanges, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import { createSucceeded, editSucceeded, saveFailed, saveStarted } from '@redux/state/transactionFlow/slice';
import { getErrorMessage } from '@shared/utils';

// Saves the open draft once the API confirms it; a second tap, or an answer for another draft, space or session, does nothing.
const useFlowSave = () => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { addAlert } = useAlert();
  const { submit, reset } = useTransactionOperation();
  const draftId = useAppSelector((state) => selectTransactionFlow(state)?.draftId);

  // Each draft keeps its own unsettled attempt; a new one starts with none.
  useEffect(() => reset(), [draftId, reset]);

  return useCallback(async () => {
    const flow = selectTransactionFlow(store.getState());
    if (!flow?.draft || flow.isSaving) return;

    const { saved, draft, spaceId } = flow;
    const errors = getDraftErrors(draft, {
      baseline: saved ? (flow.baseline ?? undefined) : undefined,
      now: Date.now(),
    });
    if (hasDraftErrors(errors) || (saved && !hasUnsavedChanges(flow))) return;

    const scope = { draftId: flow.draftId };
    const pending = saved
      ? submit({
          type: 'update',
          spaceId,
          transactionId: saved.id,
          version: saved.version,
          data: toUpdateRequest(draft),
        })
      : submit({ type: 'create', spaceId, data: toCreateRequest(draft) });

    dispatch(saveStarted(scope));
    const outcome = await pending;

    if (outcome.status === 'ignored') return;

    if (outcome.status !== 'succeeded') {
      dispatch(saveFailed(scope));
      if (outcome.status === 'failed') addAlert(getErrorMessage(outcome.failure.error));
      return;
    }

    if ('previousBalance' in outcome.result) {
      dispatch(createSucceeded({ ...scope, result: outcome.result }));
    } else {
      dispatch(editSucceeded({ ...scope, transaction: outcome.result.transaction }));
    }
  }, [dispatch, store, submit, addAlert]);
};

export default useFlowSave;
