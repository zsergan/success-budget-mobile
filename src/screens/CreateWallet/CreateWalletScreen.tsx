import { TouchableOpacity, View } from 'react-native';

import { Input, RootLayout, Button, SectionTitle, GradientBackground, WalletCard, InputPicker } from '@components';
import type { ScreenProps } from '@shared/types';
import type { ScreenNames, WalletDesign } from '@shared/enums';
import { gradients } from '@shared/constants';
import useCreateWalletForm from './useCreateWalletForm';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.ADD_WALLET_SCREEN> {}

const CreateWalletScreen = ({ navigation, route }: Props) => {
  const {
    currencies,
    isNewWallet,
    walletName,
    setWalletName,
    initialBalance,
    setInitialBalance,
    currency,
    setCurrency,
    design,
    setDesign,
    onSubmit,
  } = useCreateWalletForm({ navigation, route });

  return (
    <>
      <RootLayout style={styles.root}>
        <View style={styles.blocksContainer}>
          <View>
            <SectionTitle
              title={isNewWallet ? 'Add Wallet' : 'Edit Wallet'}
              onBackButtonPress={() => navigation.goBack()}
            />

            <View style={styles.formContainer}>
              <Input
                label="Wallet Name"
                placeholder="My Wallet"
                value={walletName}
                onChangeText={setWalletName}
                withShadow
              />

              <View style={styles.rowInputs}>
                <InputPicker
                  items={currencies}
                  selectedValue={currency}
                  onValueChange={(v) => setCurrency(v as number)}
                  label="Currency"
                  withShadow
                  containerStyle={styles.currency}
                  disabled={!isNewWallet}
                />

                <Input
                  containerStyle={styles.balance}
                  label="Balance"
                  placeholder="0"
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                  keyboardType="numeric"
                  returnKeyType="done"
                  editable={isNewWallet}
                  withShadow
                />
              </View>
            </View>
          </View>

          <View>
            <SectionTitle title="Design" />

            <View style={styles.designsContainer}>
              {Object.keys(gradients).map((key) => (
                <TouchableOpacity key={key} onPress={() => setDesign(key as WalletDesign)} activeOpacity={0.5}>
                  <View style={[styles.designCircle, key === design && styles.selectedCircle]}>
                    <GradientBackground
                      colors={gradients[key as WalletDesign]}
                      style={styles.gradient}
                      start={{ x: 0, y: 0.0 }}
                      end={{ x: 1.0, y: 1.0 }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <SectionTitle title="Preview" />

            <WalletCard
              walletName="Wallet name"
              balance="999999999999"
              currencyCode={currencies.find((c) => c.value === Number(currency))?.label || ''}
              totalIncome={9999999999}
              totalSpend={999999999}
              design={design}
            />
          </View>
        </View>

        <Button title={isNewWallet ? 'Create' : 'Save changes'} onPress={onSubmit} />
      </RootLayout>
    </>
  );
};

export default CreateWalletScreen;
