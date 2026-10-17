import { Pressable, Text, View } from 'react-native';

import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { IconType } from '@shared/types';
import { getBreakdownAppearance } from '@screens/Stats/breakdownAppearance';
import { formatMoney } from '@screens/Stats/format';
import type { BreakdownGroup } from '@screens/Stats/statsItems';

import createStyles from './style';

interface Props {
  group: BreakdownGroup;
  currency: string;
  isChild: boolean;
  isFirst: boolean;
  isOtherExpanded: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onPress?: () => void;
}

const BreakdownRow = ({ group, currency, isChild, isFirst, isOtherExpanded, isSelected, isDimmed, onPress }: Props) => {
  const colorTheme = useTheme().colorTheme;
  const { colors } = colorTheme;
  const styles = useThemedStyles(createStyles);
  const { name, icon, color, iconColor, iconBackground } = getBreakdownAppearance(group, colorTheme);
  const isDeleted = group.kind === 'deleted_wallets';
  const percent = `${group.percent.toFixed(1)}%`;
  const chevronIcon: IconType =
    group.kind !== 'other' ? 'chevron-right' : isOtherExpanded ? 'chevron-up' : 'chevron-down';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isFirst && styles.rowSeparated,
        isChild && styles.rowChild,
        isSelected && styles.rowSelected,
        isDimmed && styles.rowDimmed,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{
        selected: isSelected,
        ...(group.kind === 'other' ? { expanded: isOtherExpanded } : {}),
      }}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
        <Icon name={icon} size={17} color={iconColor} strokeWidth={1.8} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, isDeleted && styles.nameMuted]} numberOfLines={1}>
              {name}
            </Text>

            {group.is_archived && <Text style={styles.archived}>Archived</Text>}
          </View>

          <Text style={styles.amount}>{formatMoney(group.amount, currency)}</Text>
        </View>

        <View style={styles.shareRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(group.percent, 100)}%`, backgroundColor: color }]} />
          </View>

          <Text style={styles.percent}>{percent}</Text>
        </View>
      </View>

      <View style={styles.chevron}>
        {!isDeleted && <Icon name={chevronIcon} size={13} color={colors.muted} strokeWidth={2} />}
      </View>
    </Pressable>
  );
};

export default BreakdownRow;
