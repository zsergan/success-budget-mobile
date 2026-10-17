import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  items: string[];
  onContinue: () => void;
  onKeepAccount: () => void;
}

const WarningStep = ({ items, onContinue, onKeepAccount }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Icon name="alert" size={23} color={colors.danger} strokeWidth={1.9} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>Delete this account for good?</Text>
        </View>
      </View>

      <Text style={styles.body}>This cannot be undone. Nothing can be restored afterwards -- we keep no backups.</Text>

      <View style={styles.listBox}>
        <Text style={styles.listHead}>What gets deleted</Text>

        {items.map((item) => (
          <View key={item} style={styles.listRow}>
            <View style={styles.listDot} />
            <Text style={styles.listLabel}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onKeepAccount} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>Keep my account</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default WarningStep;
