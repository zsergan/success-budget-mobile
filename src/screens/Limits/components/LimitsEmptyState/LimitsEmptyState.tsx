import { Text, View } from 'react-native';

import { EmptyState, Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';

import createStyles from './style';

const RULES = [
  'The period is always the calendar month — it starts on the 1st automatically.',
  'Nothing rolls over: unspent money does not become extra budget next month.',
  'A limit counts spending across all wallets together.',
];

interface Props {
  onSetTotalLimit: () => void;
  onAddCategoryLimit: () => void;
}

const LimitsEmptyState = ({ onSetTotalLimit, onAddCategoryLimit }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.emptyBlock}>
      <EmptyState
        icon="limit"
        title="No limits set"
        description="Start with a cap on all expenses, then narrow it down by category. Limits follow the calendar month and reset on the 1st."
        actionLabel="Set monthly limit"
        actionIcon="plus"
        onActionPress={onSetTotalLimit}
        secondaryActionLabel="Add category limit"
        onSecondaryActionPress={onAddCategoryLimit}
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
  );
};

export default LimitsEmptyState;
