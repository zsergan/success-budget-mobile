import { Text, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  rules: { length: boolean; letter: boolean; digit: boolean };
}

const RULE_LABELS = { length: '8+ characters', letter: 'A letter', digit: 'A number' };

// Updated on every keystroke, so a weak password's error can point here for what is missing.
const PasswordRules = ({ rules }: Props) => (
  <View style={styles.root}>
    {(Object.keys(RULE_LABELS) as (keyof typeof RULE_LABELS)[]).map((rule) => {
      const isMet = rules[rule];

      return (
        <View
          key={rule}
          style={[styles.chip, isMet && styles.chipMet]}
          accessible
          accessibilityLabel={`${RULE_LABELS[rule]}, ${isMet ? 'done' : 'missing'}`}
        >
          <Icon
            name={isMet ? 'check' : 'minus'}
            size={12}
            color={isMet ? colors.okText : colors.muted}
            strokeWidth={2.6}
          />
          <Text style={[styles.label, isMet && styles.labelMet]}>{RULE_LABELS[rule]}</Text>
        </View>
      );
    })}
  </View>
);

export default PasswordRules;
