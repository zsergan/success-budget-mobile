import { Text, TouchableOpacity, View } from 'react-native';

import { Icon, PasswordInput } from '@components';
import { useTheme, useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  password: string;
  passwordError?: string;
  onPasswordChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const PasswordStep = ({ password, passwordError, onPasswordChange, onContinue, onBack }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <>
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Icon name="lock" size={23} color={colors.danger} strokeWidth={1.9} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>Confirm with your password</Text>
        </View>
      </View>

      <Text style={styles.body}>Enter your account password so we know the request came from you.</Text>

      <View>
        <Text style={styles.fieldLabel}>Password</Text>
        <PasswordInput value={password} onChangeText={onPasswordChange} withShadow error={passwordError} />
      </View>

      <Text style={styles.fieldHint}>Forgot it? Reset the password first, then come back.</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default PasswordStep;
