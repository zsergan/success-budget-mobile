import type { ListRenderItem } from 'react-native';
import { FlatList, Text, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';
import type { BreakdownMode, StatsItem } from '@screens/Stats/statsItems';
import BlockPlaceholder from '../BlockPlaceholder/BlockPlaceholder';
import BreakdownHeader from '../BreakdownHeader/BreakdownHeader';
import BreakdownRow from '../BreakdownRow/BreakdownRow';

import styles from './style';

interface Props {
  items: StatsItem[];
  currencyCode?: string;
  mode: BreakdownMode;
  isOtherExpanded: boolean;
  onModeChange: (mode: BreakdownMode) => void;
  onToggleOther: () => void;
}

const StatsList = ({ items, currencyCode, mode, isOtherExpanded, onModeChange, onToggleOther }: Props) => {
  const renderItem: ListRenderItem<StatsItem> = ({ item }) => {
    switch (item.kind) {
      case 'summary':
        return <BlockPlaceholder height={134} />;
      case 'trend':
        return <BlockPlaceholder height={236} style={styles.spaced} />;
      case 'breakdownHeader':
        return <BreakdownHeader mode={mode} showModes={item.hasSpending} onModeChange={onModeChange} />;
      case 'breakdownStatus':
        return <BlockPlaceholder height={260} />;
      case 'breakdownEmpty':
        return (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon name="pie" size={20} color={colors.muted} strokeWidth={1.8} />
            </View>

            <Text style={styles.emptyTitle}>No expenses in this period</Text>
            <Text style={styles.emptyText}>
              The breakdown shows spending only. It appears once an expense is recorded in this period.
            </Text>
          </View>
        );
      case 'donut':
        return (
          <View style={styles.cardTop}>
            <View style={styles.donut} />
          </View>
        );
      case 'row':
        return (
          <View style={[styles.cardMiddle, item.isLast && styles.cardBottom]}>
            <BreakdownRow
              group={item.group}
              currencyCode={currencyCode}
              isChild={item.isChild}
              isFirst={item.isFirst}
              isOtherExpanded={isOtherExpanded}
              onPress={item.group.kind === 'other' ? onToggleOther : undefined}
            />
          </View>
        );
    }
  };

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      extraData={isOtherExpanded}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default StatsList;
