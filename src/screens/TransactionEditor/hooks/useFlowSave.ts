import { useCallback, useEffect } from 'react';

import { useToast, useTransactionOperation } from '@hooks';
import { useAppDispatch, useAppSelector, useAppStore } from '@redux/hooks';
import type { RootState } from '@redux/Store';
import type { TransactionDraft } from '@redux/state/transactionFlow/draft';
import { getDraftErrors, hasDraftErrors, toCreateRequest, toUpdateRequest } from '@redux/state/transactionFlow/draft';
import { hasUnsavedChanges, selectTransactionFlow } from '@redux/state/transactionFlow/selectors';
import type { SaveNotice } from '@redux/state/transactionFlow/slice';
import {
  assigneeRefused,
  createFound,
  createSucceeded,
  recordRecovered,
  editSucceeded,
  recordGone,
  saveFailed,
  saveStarted,
  writeConflicted,
} from '@redux/state/transactionFlow/slice';
import type { ErrorResponse } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { memberApi } from '@redux/state/member/api';
import type { TransactionFailureKind } from '@redux/state/transaction/operations';
import { getErrorMessage } from '@shared/utils';

const SAVE_NOTICES: Partial<Record<TransactionFailureKind, SaveNotice>> = {
  uncertain: 'saveUnknown',
  expired: 'saveExpired',
  notSent: 'saveNotSent',
  blocked: 'saveBlocked',
  unverified: 'saveUnverified',
};

// Named as the save starts: a refusal refreshes the members, and the list that comes back no longer has them.
const assigneeName = (state: RootState, spaceId: number, { assignment }: TransactionDraft) => {
  if (assignment?.kind !== 'member') return null;

  const members = memberApi.endpoints.getMembers.select({ spaceId })(state).data;
  const member = members?.find((entry) => entry.type === 'member' && entry.user_id === assignment.userId);

  return member?.name?.trim() || member?.email || null;
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
    const assignee = assigneeName(store.getState(), spaceId, draft);
    const ticket = toast.begin();
    const pending = saved
      ? submit({
          type: 'update',
          spaceId,
          transactionId: saved.id,
          version: saved.version,
          data: toUpdateRequest(draft),
        })
      : submit({
          type: 'create',
          spaceId,
          data: toCreateRequest(draft),
          ...(flow.operationId && { operationId: flow.operationId }),
        });

    dispatch(saveStarted(scope));
    const outcome = await pending;

    if (outcome.status === 'ignored') return;

    // A record found opens in the details, which say why; one deleted since ends the flow and closes the form, so a
    // toast on the screen it leaves for says it.
    if (outcome.status === 'found') {
      if (!outcome.transaction) {
        ticket.showAfterNavigation({
          tone: 'info',
          text: 'This transaction was saved earlier and has since been deleted',
        });
      }
      dispatch(createFound({ ...scope, transaction: outcome.transaction }));
      return;
    }

    // Made against an older version: the form now edits the record as it is, the typed values kept to review and save.
    if (outcome.status === 'recovered') {
      const notice = outcome.reconciled ? 'recordChanged' : 'saveRecovered';
      return void dispatch(recordRecovered({ ...scope, transaction: outcome.transaction, notice }));
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

      if ((error as Partial<ErrorResponse> | null)?.code === ApiErrorCode.ASSIGNEE_NOT_MEMBER) {
        return void dispatch(assigneeRefused({ ...scope, name: assignee }));
      }
      const notice = SAVE_NOTICES[kind];

      return void dispatch(
        saveFailed(
          notice ? { ...scope, notice } : { ...scope, notice: 'saveRefused', refusal: getErrorMessage(error) },
        ),
      );
    }

    if (saved) {
      dispatch(editSucceeded({ ...scope, transaction: outcome.result.transaction }));
    } else {
      dispatch(createSucceeded({ ...scope, result: outcome.result, now: Date.now() }));
    }
  }, [dispatch, store, submit, toast]);
};

export default useFlowSave;
