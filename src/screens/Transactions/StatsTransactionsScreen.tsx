import { useCallback, useRef } from 'react';
import { View } from 'react-native';

import {
  Banner,
  ConfirmationSheet,
  PendingWritesBanner,
  ScreenFrame,
  useTransactionDelete,
  useTransactionFlow,
} from '@components';
import { useConfirmation, useSpaceRefresh } from '@hooks';
import { filterSelection } from '@redux/state/transactionFlow/selection';
import { TransactionType } from '@shared/enums';
import type { HistoryFilter } from '@shared/types';
import AppliedFilter from './components/AppliedFilter/AppliedFilter';
import TransactionsSkeleton from './components/Skeleton/TransactionsSkeleton';
import StatsTransactionsHeader from './components/StatsTransactionsHeader/StatsTransactionsHeader';
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

const StatsTransactionsScreen = ({ filter, onBack }: Props) => {
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
      <ScreenFrame edges={['top', 'left', 'right']} blurredStatusBar>
        <TransactionsList
          {...feedListProps(data)}
          onPressTransaction={openDetails}
          onDeleteTransaction={requestDelete}
          onVisibleRowsChange={(ids) => {
            visibleIdsRef.current = ids;
          }}
          header={
            <>
              <StatsTransactionsHeader onBack={onBack} />

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

export default StatsTransactionsScreen;
