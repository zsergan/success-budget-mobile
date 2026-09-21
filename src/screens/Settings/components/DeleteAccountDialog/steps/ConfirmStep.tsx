import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  onCancel: () => void;
}

const ConfirmStep = ({ onCancel }: Props) => (
  <>
    <View style={styles.headerRow}>
      <View style={styles.iconBox}>
        <Icon name="trash" size={23} color={colors.danger} strokeWidth={1.9} />
      </View>

      <View style={styles.headerText}>
        <Text style={styles.title}>One last check</Text>
      </View>
    </View>

    <Text style={styles.body}>
      Password accepted. The button below would delete your account and all of its data immediately.
    </Text>

    <View style={styles.strip}>
      <Text style={styles.stripText}>
        There is no way back -- not through support, not by signing up again with the same email.
      </Text>
    </View>

    <View style={styles.actions}>
      <TouchableOpacity style={[styles.primaryButton, styles.primaryButtonDisabled]} disabled activeOpacity={1}>
        <Text style={[styles.primaryButtonText, styles.primaryButtonTextDisabled]}>Delete account</Text>
      </TouchableOpacity>

      <Text style={styles.note}>Account deletion isn&apos;t available yet -- this is a preview of the flow.</Text>

      <TouchableOpacity style={styles.secondaryButton} onPress={onCancel} activeOpacity={0.7}>
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </>
);

export default ConfirmStep;
