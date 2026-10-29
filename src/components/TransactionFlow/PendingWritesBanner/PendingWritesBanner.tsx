import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import Banner from '@components/Banner/Banner';
import ConfirmationSheet from '@components/ConfirmationSheet/ConfirmationSheet';
import { useConfirmation, usePendingWrites, useToast } from '@hooks';
import { pendingWriteNoun, pendingWriteSubject } from '@hooks/usePendingWrites';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import type { RootState } from '@redux/Store';
import { selectSpacePendingWrites } from '@redux/state/pendingWrite/selectors';
import { forgetPendingWrite } from '@redux/state/pendingWrite/storage';
import { sendPendingWriteAgain } from '@redux/state/pendingWrite/thunks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { StoredOperation } from '@redux/state/transaction/operations';
import { formatAmount, getErrorMessage } from '@shared/utils';
import { formatDateTime } from '../format';

const describe = ({ data }: Extract<StoredOperation, { type: 'create' }>, currencyCode?: string) =>
  `${formatAmount(data.amount, data.transaction_type, currencyCode)} · ${formatDateTime(data.timestamp)}`;

// Only a create can run out: its key is all that keeps it from applying twice.
const findExpired = (writes: ReturnType<typeof selectSpacePendingWrites>) => {
  const operation = writes.find(({ status }) => status === 'expired')?.operation;
  return operation?.type === 'create' ? operation : null;
};

// A review answers for the write it was opened on, in that session; once the write is settled it is gone.
const selectReviewScope = (state: RootState) => {
  const spaceId = selectCurrentSpaceId(state);
  const expired = findExpired(selectSpacePendingWrites(state, spaceId));
  return expired ? `${state.auth.sessionKey}:${spaceId}:${expired.idempotencyKey}` : null;
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
  const { resume, isResuming } = usePendingWrites();
  const { lock, confirmation } = useConfirmation(selectReviewScope);

  const expired = findExpired(writes);
  const unknown = writes.filter(({ status }) => status === 'unknown');

  const review = (operation: Extract<StoredOperation, { type: 'create' }>, what: string) => {
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
