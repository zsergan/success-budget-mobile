import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Text, View } from 'react-native';

import { BottomSheetModal as BottomModal, Button, RootLayout, SectionTitle, TinyButton } from '@components';
import { ScreenNames, TransactionType } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import Wallets from './Wallets';
import TransactionForm from './TransactionForm';

import styles from './style';
import { Slice, VictoryBar, VictoryChart, VictoryPie, VictoryTheme } from 'victory-native';
import { palette } from '@shared/theme';

const data = [
  { quarter: 1, earnings: 13000 },
  { quarter: 2, earnings: 16500 },
  { quarter: 3, earnings: 14250 },
  { quarter: 4, earnings: 19000 },
  { quarter: 5, earnings: 19100 },
  { quarter: 6, earnings: 19200 },
  { quarter: 7, earnings: 19300 },
];

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
              icon="add"
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

        <View>
          <VictoryPie
            labelPlacement="perpendicular"
            labelRadius={150}
            labelIndicator={<Text>EXample</Text>}
            padAngle={3}
            innerRadius={110}
            colorScale={[palette.redLight, palette.green, palette.blue, palette.greyDark]}
            width={390}
            cornerRadius={12}
            data={[
              { x: 'Grocery', y: 140000 },
              { x: 'Car', y: 100000 },
              { x: 'Housing', y: 250000 },
              { x: 'Other', y: 50000 },
            ]}
          />
        </View>
      </RootLayout>
    </>
  );
};

export default HomeScreen;
