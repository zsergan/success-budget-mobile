import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import Banner from '@components/Banner/Banner';
import ConfirmationSheet from '@components/ConfirmationSheet/ConfirmationSheet';
import { useConfirmation, usePendingWrites, useToast } from '@hooks';
import { pendingWriteNoun, pendingWriteSubject } from '@hooks/usePendingWrites';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import type { RootState } from '@redux/Store';
import { selectAccessLostWrites, selectSpacePendingWrites } from '@redux/state/pendingWrite/selectors';
import type { PendingWrite } from '@redux/state/pendingWrite/slice';
import { forgetPendingWrite } from '@redux/state/pendingWrite/storage';
import { sendPendingWriteAgain } from '@redux/state/pendingWrite/thunks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { StoredOperation } from '@redux/state/transaction/operations';
import { draftFromCreateRequest } from '@redux/state/transactionFlow/draft';
import { restoredOpened } from '@redux/state/transactionFlow/slice';
import { openTransactionDetails } from '@redux/state/transactionFlow/thunks';
import { formatAmount, getErrorMessage } from '@shared/utils';
import { formatTransactionDate } from '../format';

const describe = ({ data }: Extract<StoredOperation, { type: 'create' }>, currencyCode?: string) =>
  `${formatAmount(data.amount, data.transaction_type, currencyCode)} · ${formatTransactionDate(data.date)}`;

type CreateOperation = Extract<StoredOperation, { type: 'create' }>;

// Only a create waits for the user this way: an expired one, or one an older build left, found or to be retried.
const findCreate = (writes: PendingWrite[], status: PendingWrite['status']) => {
  const write = writes.find((entry) => entry.status === status);
  return write?.operation.type === 'create' ? (write as PendingWrite & { operation: CreateOperation }) : null;
};

// The one write a review is opened on: it answers for that write, in that session; once the write is settled it is gone.
const reviewedWrite = (state: RootState) => {
  const writes = selectSpacePendingWrites(state, selectCurrentSpaceId(state));
  return (
    selectAccessLostWrites(state)[0] ??
    findCreate(writes, 'found') ??
    findCreate(writes, 'retry') ??
    findCreate(writes, 'expired')
  );
};

const selectReviewScope = (state: RootState) => {
  const write = reviewedWrite(state);
  return write ? `${state.auth.sessionKey}:${write.operation.idempotencyKey}:${write.status}` : null;
};

// Writes of this space that got no answer, or that the server never got in time. They outlive the form that made
// them, so they are offered here until settled.
interface Props {
  style?: StyleProp<ViewStyle>;
}

const PendingWritesBanner = ({ style }: Props) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const writes = useAppSelector((state) => selectSpacePendingWrites(state, spaceId));
  const accessLost = useAppSelector(selectAccessLostWrites);
  const { resume, isResuming } = usePendingWrites();
  const { lock, confirmation } = useConfirmation(selectReviewScope);

  const found = findCreate(writes, 'found');
  const retry = findCreate(writes, 'retry');
  const expired = findCreate(writes, 'expired')?.operation;
  const checking = writes.filter(({ status }) => status === 'checking');
  const unknown = writes.filter(({ status }) => status === 'unknown');

  const viewFound = ({ operation, found: transaction }: PendingWrite) => {
    if (transaction) dispatch(openTransactionDetails({ spaceId: operation.spaceId, transaction }));
    dispatch(forgetPendingWrite(operation.idempotencyKey));
  };

  const reviewRetry = ({ operation }: PendingWrite & { operation: CreateOperation }, what: string) =>
    lock.ask((settle) => ({
      title: 'Ready to retry',
      description: `${what}. It wasn’t saved. We restored your draft: check it and retry. It’s sent under its original operation, so it can’t be added twice.`,
      primaryAction: {
        label: 'Review draft',
        onPress: () => {
          if (!settle()) return;
          dispatch(
            restoredOpened({
              spaceId: operation.spaceId,
              operationId: operation.idempotencyKey,
              draft: draftFromCreateRequest(operation.data),
            }),
          );
        },
      },
      additionalAction: {
        label: 'Discard',
        tone: 'danger',
        onPress: () => {
          if (settle()) dispatch(forgetPendingWrite(operation.idempotencyKey));
        },
      },
      onCancel: settle,
    }));

  const discardLost = ({ operation }: PendingWrite, what: string) =>
    lock.ask((settle) => ({
      title: 'Discard this transaction?',
      description: `${what}. You no longer have access to the space it was for, so it can’t be saved there, and it isn’t moved to another space.`,
      primaryAction: {
        label: 'Discard',
        tone: 'danger',
        onPress: () => {
          if (settle()) dispatch(forgetPendingWrite(operation.idempotencyKey));
        },
      },
      onCancel: settle,
    }));

  const review = (operation: CreateOperation, what: string) => {
    const key = operation.idempotencyKey;

    const sendAgain = async () => {
      const ticket = toast.begin();
      const result = await dispatch(sendPendingWriteAgain(key));
      const subject = pendingWriteSubject(key);

      if (result?.kind === 'done' || result?.kind === 'applied') {
        ticket.showAfterSheetsClose({ tone: 'success', text: 'Transaction saved', subject });
      } else if (result?.kind === 'refused') {
        ticket.show({ tone: 'error', text: `Couldn’t save it: ${getErrorMessage(result.error)}`, subject });
      } else if (result?.kind === 'unknown') {
        // The banner keeps offering the check after this toast is gone.
        ticket.show({
          tone: 'error',
          text: 'Couldn’t confirm the save',
          subject,
          action: { label: 'Check status', onPress: () => void resume() },
        });
      }
    };

    lock.ask((settle) => ({
      title: 'Send this transaction now?',
      description: `${what}. It will be added as new.`,
      primaryAction: {
        label: 'Send',
        onPress: () => {
          if (settle()) void sendAgain();
        },
      },
      additionalAction: {
        label: 'Discard',
        tone: 'danger',
        onPress: () => {
          if (settle()) dispatch(forgetPendingWrite(key));
        },
      },
      onCancel: settle,
    }));
  };

  const renderBanner = () => {
    const lost = accessLost[0];
    if (lost?.operation.type === 'create') {
      const what = describe(lost.operation);

      return (
        <Banner
          tone="danger"
          title="A transaction can’t be saved"
          text={`${what}. You no longer have access to the space it was made in.`}
          actionLabel="Review"
          onAction={() => discardLost(lost, what)}
        />
      );
    }

    if (found) {
      return (
        <Banner
          tone="success"
          title="Already saved"
          text={`${describe(found.operation, currencyCode)}. We found this transaction in History. Nothing was added twice.`}
          actionLabel="View transaction"
          onAction={() => viewFound(found)}
        />
      );
    }

    if (retry) {
      const what = describe(retry.operation, currencyCode);

      return (
        <Banner
          tone="warn"
          title="Ready to retry"
          text={`${what}. This transaction wasn’t saved. Its draft is kept on this device.`}
          actionLabel="Review"
          onAction={() => reviewRetry(retry, what)}
        />
      );
    }

    if (expired) {
      const what = describe(expired, currencyCode);

      return (
        <Banner
          tone="danger"
          title="A transaction wasn’t saved"
          text={`${what}. The server never got it, and it’s too old to send on its own.`}
          actionLabel="Review"
          onAction={() => review(expired, what)}
        />
      );
    }

    if (checking.length > 0) {
      return (
        <Banner
          tone="warn"
          title="Still checking"
          text="We can’t confirm yet whether a transaction was saved. Your draft is kept on this device, and checked again when you come back."
          actionLabel="Check again"
          isBusy={isResuming}
          onAction={() => void resume()}
        />
      );
    }

    if (unknown.length === 0) return null;

    const noun = pendingWriteNoun(unknown.map(({ operation }) => operation));

    return (
      <Banner
        tone="warn"
        title={
          unknown.length === 1 ? `A ${noun} isn’t confirmed yet` : `${unknown.length} ${noun}s aren’t confirmed yet`
        }
        text="The server didn’t answer, so it may already have gone through. Checking never applies it twice."
        actionLabel="Check status"
        isBusy={isResuming}
        onAction={() => void resume()}
      />
    );
  };

  const banner = renderBanner();

  return (
    <>
      {banner && <View style={style}>{banner}</View>}
      <ConfirmationSheet confirmation={confirmation} />
    </>
  );
};

export default PendingWritesBanner;
