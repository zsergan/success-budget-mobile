import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import {
  Banner,
  ConfirmationSheet,
  PendingWritesBanner,
  ScreenFrame,
  useTransactionDelete,
  useTransactionFlow,
} from '@components';
import { useConfirmation, useSpaceRefresh } from '@hooks';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { filterSelection } from '@redux/state/transactionFlow/selection';
import { TransactionType } from '@shared/enums';
import type { ScreenNames } from '@shared/enums';
import type { HistoryFilter, StatsStackScreenProps } from '@shared/types';
import AppliedFilter from './components/AppliedFilter/AppliedFilter';
import TransactionsSkeleton from './components/Skeleton/TransactionsSkeleton';
import StatsTransactionsHeader, {
  StatsTransactionsTitle,
} from './components/StatsTransactionsHeader/StatsTransactionsHeader';
import TransactionsEmptyState from './components/TransactionsEmptyState/TransactionsEmptyState';
import TransactionsList from './components/TransactionsList/TransactionsList';
import { feedListProps } from './feedListProps';
import useTransactionsData from './hooks/useTransactionsData';

import styles from './style';

interface Props {
  // The Stats row this list stands for; fixed for as long as the screen is open.
  filter: HistoryFilter;
  onBack: () => void;
}

const StatsTransactions = ({ filter, onBack }: Props) => {
  useSpaceRefresh();
  const { lock: deleteLock, confirmation: deleteConfirmation } = useConfirmation();
  const { requestDelete } = useTransactionDelete(deleteLock);
  const { openDetails } = useTransactionFlow(filterSelection(filter));

  const visibleIdsRef = useRef<string[]>([]);
  const getVisibleIds = useCallback(() => visibleIdsRef.current, []);

  const data = useTransactionsData({ filter, getVisibleIds });
  const { viewState, income, expense, currencyCode, refreshFailed, retry } = data;

  return (
    <>
      <ScreenFrame edges={['top', 'left', 'right']}>
        <StatsTransactionsHeader onBack={onBack} />

        <TransactionsList
          {...feedListProps(data)}
          onPressTransaction={openDetails}
          onDeleteTransaction={requestDelete}
          onVisibleRowsChange={(ids) => {
            visibleIdsRef.current = ids;
          }}
          header={
            <>
              <StatsTransactionsTitle />

              <AppliedFilter
                filter={filter}
                total={filter.transactionType === TransactionType.INCOME ? income : expense}
                currencyCode={currencyCode}
              />

              <PendingWritesBanner style={styles.banner} />

              {refreshFailed && (
                <View style={styles.banner}>
                  <Banner
                    tone="danger"
                    text="Couldn’t update the list. It shows what was loaded before."
                    actionLabel="Retry"
                    onAction={retry}
                  />
                </View>
              )}
            </>
          }
          placeholder={
            <>
              {viewState === 'loading' && <TransactionsSkeleton />}

              {viewState === 'noMatches' && <TransactionsEmptyState variant="noMatches" />}

              {viewState === 'rangeError' && <TransactionsEmptyState variant="rangeError" onRetry={retry} />}
            </>
          }
        />
      </ScreenFrame>

      <ConfirmationSheet confirmation={deleteConfirmation} />
    </>
  );
};

// The list belongs to the space its row was summed in. Once another space is active, or none, it is never shown
// again, even if its own space comes back, and its route leaves the stack wherever the user is.
const StatsTransactionsScreen = ({
  navigation,
  route,
}: StatsStackScreenProps<ScreenNames.STATS_TRANSACTIONS_SCREEN>) => {
  const { filter } = route.params;
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [isStale, setIsStale] = useState(filter.spaceId !== spaceId);
  if (!isStale && filter.spaceId !== spaceId) setIsStale(true);

  useEffect(() => {
    if (!isStale) return;

    // Not goBack(): from another tab it must take only this route away, without bringing Stats into focus.
    navigation.dispatch((state) => {
      const routes = state.routes.filter(({ key }) => key !== route.key);

      return CommonActions.reset({ ...state, routes, index: routes.length - 1 });
    });
  }, [isStale, navigation, route.key]);

  return isStale ? null : <StatsTransactions filter={filter} onBack={navigation.goBack} />;
};

export default StatsTransactionsScreen;
