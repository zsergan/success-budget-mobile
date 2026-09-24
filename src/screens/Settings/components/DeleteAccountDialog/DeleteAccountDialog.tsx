import { Text, TouchableWithoutFeedback, View } from 'react-native';

import { ModalContainer } from '@components';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { EMPTY_CATEGORIES } from '@redux/state/category/selectors';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { EMPTY_LIMITS } from '@redux/state/limit/selectors';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { getTotalBalance } from '@redux/state/wallet/selectors';
import { formatCurrencyAmount } from '@shared/utils';
import WarningStep from './steps/WarningStep';
import PasswordStep from './steps/PasswordStep';
import ConfirmStep from './steps/ConfirmStep';
import useDeleteAccountFlow from './hooks/useDeleteAccountFlow';

import styles from './style';

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

const DeleteAccountDialog = ({ isVisible, onClose }: Props) => {
  const { step, password, passwordError, goToPassword, goToWarning, setPassword, continueFromPassword, reset } =
    useDeleteAccountFlow();

  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const spaceArg = useSpaceArg();
  const { total, walletsCount } = getTotalBalance(useGetWalletsQuery(spaceArg).currentData);
  const { categoryLimits } = useGetLimitsQuery(spaceArg).currentData ?? EMPTY_LIMITS;
  const { incomes, expenses, archived } = useGetCategoriesQuery(spaceArg).currentData ?? EMPTY_CATEGORIES;

  const handleClose = () => {
    reset();
    onClose();
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

          {step === 'warning' && <WarningStep items={items} onContinue={goToPassword} onKeepAccount={handleClose} />}

          {step === 'password' && (
            <PasswordStep
              password={password}
              passwordError={passwordError}
              onPasswordChange={setPassword}
              onContinue={continueFromPassword}
              onBack={goToWarning}
            />
          )}

          {step === 'confirm' && <ConfirmStep onCancel={handleClose} />}
        </View>
      </TouchableWithoutFeedback>
    </ModalContainer>
  );
};

export default DeleteAccountDialog;
