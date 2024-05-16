import { useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { View } from 'react-native';

import { BottomSheetModal as BottomModal, Button } from '@components';
import { TransactionType } from '@shared/enums';
import General from './General';
import TransactionForm from './TransactionForm';

import styles from './style';

const HomeScreen = () => {
  const expenseBottomSheetRef = useRef<BottomSheetModal>(null);
  const incomeBottomSheetRef = useRef<BottomSheetModal>(null);

  const handlePresentExpenseModalPress = () => expenseBottomSheetRef.current?.present();
  const handlePresentIncomeModalPress = () => incomeBottomSheetRef.current?.present();

  return (
    <>
      <BottomModal ref={expenseBottomSheetRef}>
        <TransactionForm />
      </BottomModal>

      <BottomModal ref={incomeBottomSheetRef}>
        <TransactionForm transactionType={TransactionType.INCOME} />
      </BottomModal>

      <View style={styles.container}>
        <General />

        <View style={styles.buttonsContainer}>
          <Button title="Expense" onPress={handlePresentExpenseModalPress} style={styles.button} />
          <Button title="Income" onPress={handlePresentIncomeModalPress} style={styles.button} />
        </View>
      </View>
    </>
  );
};

export default HomeScreen;
