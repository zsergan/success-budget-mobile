import { useState } from 'react';
import { Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { Icon, ModalContainer, PasswordInput } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectCategory } from '@redux/state/category/selectors';
import { selectLimit } from '@redux/state/limit/selectors';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { selectTotalBalance } from '@redux/state/wallet/selectors';
import { colors } from '@shared/theme';
import { formatCurrencyAmount } from '@shared/utils';

import styles from './style';

type Step = 'warning' | 'password' | 'confirm';

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

const DeleteAccountDialog = ({ isVisible, onClose }: Props) => {
  const [step, setStep] = useState<Step>('warning');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const { total, walletsCount } = useAppSelector(selectTotalBalance);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const { categoryLimits } = useAppSelector(selectLimit);
  const { incomes, expenses, archived } = useAppSelector(selectCategory);

  const handleClose = () => {
    setStep('warning');
    setPassword('');
    setPasswordError(undefined);
    onClose();
  };

  const handleContinueFromPassword = () => {
    if (!password.trim()) {
      setPasswordError('Enter your password');
      return;
    }

    setPasswordError(undefined);
    setStep('confirm');
  };

  const items = [
    `${walletsCount} wallet${walletsCount === 1 ? '' : 's'} and a ${formatCurrencyAmount(total, currencyCode)} balance`,
    'Your full transaction history',
    `${categoryLimits.length} limit${categoryLimits.length === 1 ? '' : 's'} and their history`,
    `${incomes.length + expenses.length} categories, ${archived.length} archived included`,
  ];

  return (
    <ModalContainer isVisible={isVisible} onClose={handleClose} animationType="fade">
      <TouchableWithoutFeedback>
        <View style={styles.card}>
          <Text style={styles.step}>
            {step === 'warning' ? 'Step 1 of 3' : step === 'password' ? 'Step 2 of 3' : 'Step 3 of 3'}
          </Text>

          {step === 'warning' && (
            <>
              <View style={styles.headerRow}>
                <View style={styles.iconBox}>
                  <Icon name="alert" size={23} color={colors.danger} strokeWidth={1.9} />
                </View>

                <View style={styles.headerText}>
                  <Text style={styles.title}>Delete this account for good?</Text>
                </View>
              </View>

              <Text style={styles.body}>
                This cannot be undone. Nothing can be restored afterwards -- we keep no backups.
              </Text>

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
                <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('password')} activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleClose} activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>Keep my account</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'password' && (
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
                <PasswordInput value={password} onChangeText={setPassword} withShadow error={passwordError} />
              </View>

              <Text style={styles.fieldHint}>Forgot it? Reset the password first, then come back.</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleContinueFromPassword} activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('warning')} activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'confirm' && (
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
                <TouchableOpacity
                  style={[styles.primaryButton, styles.primaryButtonDisabled]}
                  disabled
                  activeOpacity={1}
                >
                  <Text style={[styles.primaryButtonText, styles.primaryButtonTextDisabled]}>Delete account</Text>
                </TouchableOpacity>

                <Text style={styles.note}>
                  Account deletion isn&apos;t available yet -- this is a preview of the flow.
                </Text>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleClose} activeOpacity={0.7}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </ModalContainer>
  );
};

export default DeleteAccountDialog;
