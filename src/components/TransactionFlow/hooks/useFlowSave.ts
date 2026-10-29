import { useCallback, useEffect } from 'react';

import { useToast, useTransactionOperation } from '@hooks';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import { getDraftErrors, hasDraftErrors, toCreateRequest, toUpdateRequest } from '@redux/state/transactionFlow/draft';
import { hasUnsavedChanges, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import type { SaveNotice } from '@redux/state/transactionFlow/slice';
import {
  createFound,
  createSucceeded,
  recordRecovered,
  editSucceeded,
  recordGone,
  saveFailed,
  saveStarted,
  writeConflicted,
} from '@redux/state/transactionFlow/slice';
import type { TransactionFailureKind } from '@redux/state/transaction/operations';
import { getErrorMessage } from '@shared/utils';

const SAVE_NOTICES: Partial<Record<TransactionFailureKind, SaveNotice>> = {
  uncertain: 'saveUnknown',
  expired: 'saveExpired',
  notSent: 'saveNotSent',
};

// Saves the open draft once the API confirms it; a second tap, or an answer for another draft, space or session, does nothing.
const useFlowSave = () => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const toast = useToast();
  const { submit, reset } = useTransactionOperation();
  const draftId = useAppSelector((state) => selectTransactionFlow(state)?.draftId);

  // Each draft keeps its own unsettled attempt; a new one starts with none.
  useEffect(() => reset(), [draftId, reset]);

  return useCallback(async () => {
    const flow = selectTransactionFlow(store.getState());
    // After a conflict the same version would be refused again; the user loads the latest one first.
    if (!flow?.draft || flow.isSaving || flow.notice === 'conflict') return;

    const { saved, draft, spaceId } = flow;
    const errors = getDraftErrors(draft, {
      baseline: saved ? (flow.baseline ?? undefined) : undefined,
      now: Date.now(),
    });
    if (hasDraftErrors(errors) || (saved && !hasUnsavedChanges(flow))) return;

    const scope = { draftId: flow.draftId };
    const ticket = toast.begin();
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

    // A record found stays in the sheet, which says why; one deleted since ends the flow, so a toast says it.
    if (outcome.status === 'found') {
      dispatch(createFound({ ...scope, transaction: outcome.transaction }));
      if (!outcome.transaction) {
        ticket.showAfterSheetsClose({
          tone: 'info',
          text: 'This transaction was saved earlier and has since been deleted',
        });
      }
      return;
    }

    if (outcome.status === 'recovered') {
      return void dispatch(recordRecovered({ ...scope, transaction: outcome.transaction }));
    }

    if (outcome.status === 'failed' && saved) {
      const { kind } = outcome.failure;

      if (kind === 'conflict') return void dispatch(writeConflicted(scope));
      if (kind === 'notFound') return void dispatch(recordGone(scope));
    }

    if (outcome.status === 'stale') return void dispatch(saveFailed(scope));

    // The form keeps saying what happened and what to do next until the next save.
    if (outcome.status === 'failed') {
      const { kind, error } = outcome.failure;
      const notice = SAVE_NOTICES[kind];

      return void dispatch(
        saveFailed(
          notice ? { ...scope, notice } : { ...scope, notice: 'saveRefused', refusal: getErrorMessage(error) },
        ),
      );
    }

    if ('previousBalance' in outcome.result) {
      dispatch(createSucceeded({ ...scope, result: outcome.result, now: Date.now() }));
    } else {
      dispatch(editSucceeded({ ...scope, transaction: outcome.result.transaction }));
    }
  }, [dispatch, store, submit, toast]);
};

export default useFlowSave;
