import type { StyleProp, ViewStyle } from 'react-native';
import { Alert, View } from 'react-native';

import Banner from '@components/Banner/Banner';
import { useAlert, usePendingWrites } from '@hooks';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectSpacePendingWrites } from '@redux/state/pendingWrite/selectors';
import { forgetPendingWrite } from '@redux/state/pendingWrite/storage';
import { sendPendingWriteAgain } from '@redux/state/pendingWrite/thunks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { StoredOperation } from '@redux/state/transaction/operations';
import { formatAmount, getErrorMessage } from '@shared/utils';
import { formatDateTime } from '../format';

const describe = ({ data }: Extract<StoredOperation, { type: 'create' }>, currencyCode?: string) =>
  `${formatAmount(data.amount, data.transaction_type, currencyCode)} · ${formatDateTime(data.timestamp)}`;

// Writes of this space that got no answer, or that the server never got in time. They outlive the form that made
// them, so they are offered here until settled.
interface Props {
  style?: StyleProp<ViewStyle>;
}

const PendingWritesBanner = ({ style }: Props) => {
  const dispatch = useAppDispatch();
  const { addAlert } = useAlert();
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const writes = useAppSelector((state) => selectSpacePendingWrites(state, spaceId));
  const { resume, isResuming } = usePendingWrites();

  // Only a create can run out: its key is all that keeps it from applying twice.
  const expired = writes.find(({ status }) => status === 'expired')?.operation;
  const unknown = writes.filter(({ status }) => status === 'unknown');

  if (expired?.type === 'create') {
    const key = expired.idempotencyKey;
    const what = describe(expired, currencyCode);

    const sendAgain = async () => {
      const result = await dispatch(sendPendingWriteAgain(key));

      if (result?.kind === 'done' || result?.kind === 'applied') addAlert('Transaction saved');
      else if (result?.kind === 'refused') addAlert(`Couldn’t save it: ${getErrorMessage(result.error)}`);
    };

    return (
      <View style={style}>
        <Banner
          tone="danger"
          title="A transaction wasn’t saved"
          text={`${what}. The server never got it, and it’s too old to send on its own.`}
          actionLabel="Review"
          onAction={() =>
            Alert.alert('Send this transaction now?', `${what}. It will be added as new.`, [
              { text: 'Discard', style: 'destructive', onPress: () => dispatch(forgetPendingWrite(key)) },
              { text: 'Send', onPress: () => void sendAgain() },
              { text: 'Cancel', style: 'cancel', isPreferred: true },
            ])
          }
        />
      </View>
    );
  }

  if (unknown.length === 0) return null;

  return (
    <View style={style}>
      <Banner
        tone="warn"
        title={unknown.length === 1 ? 'A save isn’t confirmed yet' : `${unknown.length} saves aren’t confirmed yet`}
        text="The server didn’t answer, so it may already be saved. Retrying never adds a transaction twice."
        actionLabel="Retry"
        isBusy={isResuming}
        onAction={() => void resume()}
      />
    </View>
  );
};

export default PendingWritesBanner;
