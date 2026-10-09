import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

import type { LimitModel } from '@api/models';
import { BottomSheetModal as BottomModal, EmptyState, FrameScrollView, Icon, ScreenFrame } from '@components';
import { useConfirmAction, useSpaceRefresh } from '@hooks';
import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { EMPTY_LIMITS } from '@redux/state/limit/selectors';
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
  useSpaceRefresh();
  const limitsQuery = useGetLimitsQuery(useSpaceArg());
  const { currentData, refetch } = limitsQuery;
  const { isLoading, hasError } = getLoadState(limitsQuery);
  const { total, categoryLimits, overAllocation } = currentData ?? EMPTY_LIMITS;
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const { editorTarget, editorKey, openEditor, editorRef } = useLimitEditor();
  const limitDeletion = useConfirmAction<LimitModel>();

  const isFullyEmpty = !total && categoryLimits.length === 0;

  return (
    <>
      <BottomModal ref={editorRef} snapPoint={LIMIT_EDITOR_SNAP_POINT}>
        <LimitEditorSheet
          key={editorKey}
          limit={editorTarget.limit}
          initialScope={editorTarget.scope}
          onRequestDelete={limitDeletion.open}
        />
      </BottomModal>

      <DeleteLimitDialog deletion={limitDeletion} currencyCode={currencyCode} />

      <ScreenFrame edges={['top', 'left', 'right']} blurredStatusBar>
        <FrameScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <LimitsHeader />

          <View style={styles.container}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : hasError ? (
              <EmptyState
                icon="limit"
                title="Couldn't load limits"
                description="Check your connection and try again."
                actionLabel="Retry"
                onActionPress={refetch}
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
        </FrameScrollView>
      </ScreenFrame>

      {!isFullyEmpty && (
        <TouchableOpacity style={styles.fab} onPress={() => openEditor({ scope: 'category' })} activeOpacity={0.85}>
          <Icon name="plus" size={24} color={colors.onAccent} strokeWidth={2.4} />
        </TouchableOpacity>
      )}
    </>
  );
};

export default LimitsScreen;
