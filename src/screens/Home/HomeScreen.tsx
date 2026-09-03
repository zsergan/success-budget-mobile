import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { View } from 'react-native';

import { BottomSheetModal as BottomModal, Button, RootLayout, SectionTitle, TinyButton } from '@components';
import { ScreenNames, TransactionType } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import Wallets from './Wallets';
import TransactionForm from './TransactionForm';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.HOME_TAB> {}

const HomeScreen = ({ navigation }: Props) => {
  const [currentWalletIndex, setCurrentWalletIndex] = useState<number>(0);

  const expenseBottomSheetRef = useRef<BottomSheetModal>(null);
  const incomeBottomSheetRef = useRef<BottomSheetModal>(null);

  const handlePresentExpenseModalPress = () => expenseBottomSheetRef.current?.present();
  const handlePresentIncomeModalPress = () => incomeBottomSheetRef.current?.present();

  return (
    <>
      <BottomModal ref={expenseBottomSheetRef}>
        <TransactionForm navigation={navigation} initialWalletIndex={currentWalletIndex} />
      </BottomModal>

      <BottomModal ref={incomeBottomSheetRef}>
        <TransactionForm
          navigation={navigation}
          initialWalletIndex={currentWalletIndex}
          transactionType={TransactionType.INCOME}
        />
      </BottomModal>

      <RootLayout style={styles.container}>
        <SectionTitle
          title="Your wallets"
          button={
            <TinyButton
              title="Add Wallet"
              icon="plus"
              onPress={() => navigation.navigate(ScreenNames.ADD_WALLET_SCREEN, { id: 'new' })}
            />
          }
        />

        <Wallets navigation={navigation} onScrollEnd={(index: number) => setCurrentWalletIndex(index)} />

        <View style={styles.buttonsContainer}>
          <Button title="Expense" onPress={handlePresentExpenseModalPress} style={styles.button} withShadow />

          <Button
            title="Income"
            onPress={handlePresentIncomeModalPress}
            style={styles.button}
            variant="secondary"
            withShadow
          />
        </View>
      </RootLayout>
    </>
  );
};

export default HomeScreen;
