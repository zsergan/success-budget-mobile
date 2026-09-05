import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { LimitModel } from '@api/models';
import { BottomSheetModal as BottomModal, EmptyState, Icon, LimitItem } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectLimit } from '@redux/state/limit/selectors';
import { selectProfile } from '@redux/state/profile/selectors';
import { colors } from '@shared/theme';
import { formatDateMM, getDaysLeftInMonth } from '@shared/utils';
import type { LimitScope } from './LimitEditor/useLimitEditorForm';
import LimitEditorSheet from './LimitEditor/LimitEditorSheet';
import DeleteLimitDialog from './DeleteLimitDialog/DeleteLimitDialog';
import TotalLimitCard from './TotalLimitCard/TotalLimitCard';
import OverAllocationBanner from './OverAllocationBanner/OverAllocationBanner';

import styles from './style';

const RULES = [
  'The period is always the calendar month — it starts on the 1st automatically.',
  'Nothing rolls over: unspent money does not become extra budget next month.',
  'A limit counts spending across all wallets together.',
];

interface EditorTarget {
  limit?: LimitModel;
  scope?: LimitScope;
}

const LimitsScreen = () => {
  const { total, categoryLimits, overAllocation } = useAppSelector(selectLimit);
  const { baseCurrency } = useAppSelector(selectProfile);

  const editorRef = useRef<BottomSheetModal>(null);
  const [editorTarget, setEditorTarget] = useState<EditorTarget>({});
  const [editorKey, setEditorKey] = useState(0);
  const [deletingLimit, setDeletingLimit] = useState<LimitModel | undefined>(undefined);

  const openEditor = (target: EditorTarget) => {
    setEditorTarget(target);
    setEditorKey((key) => key + 1);
    editorRef.current?.present();
  };

  const isFullyEmpty = !total && categoryLimits.length === 0;
  const currencyCode = baseCurrency?.code;

  return (
    <>
      <BottomModal ref={editorRef} snapPoint="94%">
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

      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Limits</Text>

          <View style={styles.periodPill}>
            <Text style={styles.periodMonth}>{formatDateMM(new Date())}</Text>

            <View style={styles.periodDivider} />

            <Text style={styles.periodDays}>{`${getDaysLeftInMonth()} days left`}</Text>
          </View>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {isFullyEmpty ? (
              <View style={styles.emptyBlock}>
                <EmptyState
                  icon="limit"
                  title="No limits set"
                  description="Start with a cap on all expenses, then narrow it down by category. Limits follow the calendar month and reset on the 1st."
                  actionLabel="Set monthly limit"
                  actionIcon="plus"
                  onActionPress={() => openEditor({ scope: 'total' })}
                  secondaryActionLabel="Add category limit"
                  onSecondaryActionPress={() => openEditor({ scope: 'category' })}
                />

                <View style={styles.rules}>
                  {RULES.map((rule) => (
                    <View key={rule} style={styles.ruleRow}>
                      <Icon name="check" size={14} color={colors.muted} strokeWidth={2.2} />

                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
              </View>
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

                {categoryLimits.length > 0 ? (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Category limits</Text>

                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => openEditor({ scope: 'category' })}
                        activeOpacity={0.7}
                      >
                        <Icon name="plus" size={12} color={colors.text} strokeWidth={2.2} />

                        <Text style={styles.addButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.list}>
                      {categoryLimits.map((limit) => (
                        <LimitItem
                          key={limit.id}
                          limit={limit}
                          currencyCode={currencyCode}
                          onPress={() => openEditor({ limit })}
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <EmptyState
                    variant="solid"
                    icon="limit"
                    title="No category limits yet"
                    description="The monthly total tells you how much is left. Category limits tell you where it goes — groceries, transport, or a group like «Fun»."
                    actionLabel="Add first category limit"
                    actionVariant="secondary"
                    actionIcon="plus"
                    onActionPress={() => openEditor({ scope: 'category' })}
                  />
                )}
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
