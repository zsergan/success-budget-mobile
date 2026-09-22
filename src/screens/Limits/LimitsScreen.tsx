import { useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { LimitModel } from '@api/models';
import { BottomSheetModal as BottomModal, EmptyState, Icon } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectLimit } from '@redux/state/limit/selectors';
import { fetchLimits } from '@redux/state/limit/thunks';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { colors } from '@shared/theme';
import LimitEditorSheet, { LIMIT_EDITOR_SNAP_POINT } from './components/LimitEditor/LimitEditorSheet';
import DeleteLimitDialog from './components/DeleteLimitDialog/DeleteLimitDialog';
import TotalLimitCard from './components/TotalLimitCard/TotalLimitCard';
import OverAllocationBanner from './components/OverAllocationBanner/OverAllocationBanner';
import LimitsHeader from './components/LimitsHeader/LimitsHeader';
import LimitsEmptyState from './components/LimitsEmptyState/LimitsEmptyState';
import CategoryLimitsSection from './components/CategoryLimitsSection/CategoryLimitsSection';
import useLimitEditor from './hooks/useLimitEditor';

import styles from './style';

const LimitsScreen = () => {
  const dispatch = useAppDispatch();
  const { total, categoryLimits, overAllocation, isLoading, error } = useAppSelector(selectLimit);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const { editorTarget, editorKey, openEditor, editorRef } = useLimitEditor();
  const [deletingLimit, setDeletingLimit] = useState<LimitModel | undefined>(undefined);

  const isFullyEmpty = !total && categoryLimits.length === 0;

  return (
    <>
      <BottomModal ref={editorRef} snapPoint={LIMIT_EDITOR_SNAP_POINT}>
        <LimitEditorSheet
          key={editorKey}
          limit={editorTarget.limit}
          initialScope={editorTarget.scope}
          onRequestDelete={(limit) => setDeletingLimit(limit)}
        />
      </BottomModal>

      <DeleteLimitDialog
        limit={deletingLimit}
        currencyCode={currencyCode}
        onClose={() => setDeletingLimit(undefined)}
      />

      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <LimitsHeader />

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {isLoading && isFullyEmpty ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : !isLoading && error && isFullyEmpty ? (
              <EmptyState
                icon="limit"
                title="Couldn't load limits"
                description="Check your connection and try again."
                actionLabel="Retry"
                onActionPress={() => dispatch(fetchLimits())}
              />
            ) : isFullyEmpty ? (
              <LimitsEmptyState
                onSetTotalLimit={() => openEditor({ scope: 'total' })}
                onAddCategoryLimit={() => openEditor({ scope: 'category' })}
              />
            ) : (
              <>
                {total && (
                  <TotalLimitCard
                    total={total}
                    currencyCode={currencyCode}
                    onEdit={() => openEditor({ limit: total })}
                  />
                )}

                {overAllocation && (
                  <OverAllocationBanner
                    overAllocation={overAllocation}
                    currencyCode={currencyCode}
                    onRaiseTotal={() => openEditor({ limit: total ?? undefined, scope: 'total' })}
                  />
                )}

                <CategoryLimitsSection
                  categoryLimits={categoryLimits}
                  currencyCode={currencyCode}
                  onAddLimit={() => openEditor({ scope: 'category' })}
                  onSelectLimit={(limit) => openEditor({ limit })}
                />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {!isFullyEmpty && (
        <TouchableOpacity style={styles.fab} onPress={() => openEditor({ scope: 'category' })} activeOpacity={0.85}>
          <Icon name="plus" size={24} color={colors.onAccent} strokeWidth={2.4} />
        </TouchableOpacity>
      )}
    </>
  );
};

export default LimitsScreen;
