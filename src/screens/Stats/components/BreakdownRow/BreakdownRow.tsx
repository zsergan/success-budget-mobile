import { Pressable, Text, View } from 'react-native';

import { toMobileIcon } from '@api/models';
import { Icon } from '@components';
import { getCategoryStroke, getCategoryTint } from '@shared/categoryColors';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';
import { formatCurrencyAmount } from '@shared/utils';
import type { BreakdownGroup } from '@screens/Stats/statsItems';

import styles, { DELETED_WALLETS_COLOR, OTHER_COLOR } from './style';

interface Appearance {
  name: string;
  icon: IconType;
  color: string;
  iconColor: string;
  iconBackground: string;
}

const getAppearance = (group: BreakdownGroup): Appearance => {
  switch (group.kind) {
    case 'other':
      return { name: 'Other', icon: 'more', color: OTHER_COLOR, iconColor: OTHER_COLOR, iconBackground: colors.track };
    case 'deleted_wallets':
      return {
        name: 'Deleted wallets',
        icon: 'wallet',
        color: DELETED_WALLETS_COLOR,
        iconColor: colors.muted,
        iconBackground: colors.track,
      };
    default: {
      const color = getCategoryStroke(group.color);

      return {
        name: group.name,
        icon: group.kind === 'wallet' ? 'wallet' : toMobileIcon(group.icon),
        color,
        iconColor: color,
        iconBackground: getCategoryTint(group.color),
      };
    }
  }
};

interface Props {
  group: BreakdownGroup;
  currencyCode?: string;
  isChild: boolean;
  isFirst: boolean;
  isOtherExpanded: boolean;
  onPress?: () => void;
}

const BreakdownRow = ({ group, currencyCode, isChild, isFirst, isOtherExpanded, onPress }: Props) => {
  const { name, icon, color, iconColor, iconBackground } = getAppearance(group);
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
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={group.kind === 'other' ? { expanded: isOtherExpanded } : undefined}
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

          <Text style={styles.amount}>{formatCurrencyAmount(group.amount, currencyCode)}</Text>
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
