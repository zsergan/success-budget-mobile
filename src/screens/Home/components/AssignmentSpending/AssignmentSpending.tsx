import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';

import type { AssignmentBreakdownItem, StatisticsBreakdown } from '@api/dto';
import type { AssignmentKey } from '@api/models';
import type { AvatarSubject } from '@components';
import { AssignmentAvatar, Icon, SectionTitle } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { homeAssignmentRows, homeMoney } from '@screens/Home/homeFigures';
import createBreakdownStyles from '@screens/Home/components/TopSpending/style';
import { assignmentItemLabel, assignmentKeyColor } from '@shared/utils';

interface Props {
  breakdown: StatisticsBreakdown | undefined;
  isLoading: boolean;
  hasError: boolean;
  currencyCode?: string;
  isHidden: boolean;
  selfId?: number;
  // A line under the title, e.g. when the user is the only active member.
  subtitle?: string;
  onOpenRow: (item: AssignmentBreakdownItem, name: string) => void;
  onSeeAll: () => void;
  onRetry: () => void;
}

const subjectOf = (item: AssignmentBreakdownItem): AvatarSubject => {
  if (item.kind === 'space' || item.kind === 'unassigned') return { kind: item.kind };
  if (item.kind === 'deleted_member') return { kind: 'member', userId: null, name: null, status: 'deleted' };

  return { kind: 'member', userId: item.user_id, name: item.name, status: item.status ?? 'member' };
};

// Who the month's expenses were for. The whole space and nobody keep rows of their own; each row opens its expenses.
const AssignmentSpending = ({
  breakdown,
  isLoading,
  hasError,
  currencyCode,
  isHidden,
  selfId,
  subtitle,
  onOpenRow,
  onSeeAll,
  onRetry,
}: Props) => {
  const colorTheme = useTheme().colorTheme;
  const { colors } = colorTheme;
  const styles = useThemedStyles(createBreakdownStyles);
  const { rows, total, hidden } = breakdown
    ? homeAssignmentRows(breakdown.by_assignment)
    : { rows: [], total: 0, hidden: 0 };
  const max = Math.max(...rows.map(({ amount }) => Number(amount)), 0);

  return (
    <>
      <SectionTitle style={styles.title} title="Spending by assignment" subtitle={subtitle} />

      {breakdown ? (
        rows.length === 0 ? (
          <Text style={styles.empty}>No expenses this month.</Text>
        ) : (
          <View style={styles.card}>
            {rows.map((row, index) => {
              const name = assignmentItemLabel(row, selfId);
              const isGone = row.kind === 'deleted_member' || row.status === 'former_member';

              return (
                <Pressable
                  key={row.key}
                  style={({ pressed }) => [styles.row, index > 0 && styles.rowSeparated, pressed && styles.rowPressed]}
                  onPress={() => onOpenRow(row, name)}
                  accessibilityRole="button"
                  accessibilityLabel={`${name}, ${homeMoney(row.amount, currencyCode, isHidden)}. Show its expenses`}
                >
                  <AssignmentAvatar subject={subjectOf(row)} selfId={selfId} size={32} />

                  <View style={styles.body}>
                    <View style={styles.line}>
                      <Text style={[styles.name, isGone && styles.nameMuted]} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={styles.amount}>{homeMoney(row.amount, currencyCode, isHidden)}</Text>
                    </View>

                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          {
                            width: `${max > 0 ? (Number(row.amount) / max) * 100 : 0}%`,
                            backgroundColor: assignmentKeyColor(row.key as AssignmentKey, selfId, colorTheme),
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <Icon name="chevron-right" size={13} color={colors.muted} strokeWidth={2} />
                </Pressable>
              );
            })}

            {hidden > 0 && (
              <TouchableOpacity style={styles.more} onPress={onSeeAll} activeOpacity={0.7} accessibilityRole="button">
                <Text style={styles.moreText}>{`See all ${total} assignments`}</Text>
              </TouchableOpacity>
            )}
          </View>
        )
      ) : isLoading ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.muted} accessibilityLabel="Loading spending by assignment" />
        </View>
      ) : (
        hasError && (
          <View style={styles.placeholder}>
            <Text style={styles.empty}>Couldn’t load the breakdown.</Text>
            <TouchableOpacity onPress={onRetry} hitSlop={8} accessibilityRole="button">
              <Text style={styles.retry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </>
  );
};

export default AssignmentSpending;
