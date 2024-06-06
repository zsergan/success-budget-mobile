import { TouchableOpacity, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Input, RootLayout, Button, SectionTitle, GradientBackground, WalletCard, InputPicker } from '@components';
import type { ScreenProps } from '@shared/types';
import type { ScreenNames, WalletDesign } from '@shared/enums';
import { gradients } from '@shared/constants';
import useCreateWalletForm from './useCreateWalletForm';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.ADD_WALLET_SCREEN> {}

const CreateWalletScreen = ({ navigation, route }: Props) => {
  const { currencies, isNewWallet, control, onSubmit, watch, isSubmitSuccessful } = useCreateWalletForm({
    navigation,
    route,
  });

  const selectedWalletName = watch('walletName');
  const selectedCurrency = watch('currency');
  const selectedDesign = watch('design');

  return (
    <>
      <RootLayout style={styles.root}>
        <View style={styles.sectionsContainer}>
          <SectionTitle
            title={isNewWallet ? 'Add Wallet' : 'Edit Wallet'}
            onBackButtonPress={() => navigation.goBack()}
          />

          <View style={styles.formContainer}>
            <Controller
              name="walletName"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Input label="Wallet Name" placeholder="My Wallet" value={value} onChangeText={onChange} withShadow />
              )}
            />

            <View style={styles.rowInputs}>
              <Controller
                name="currency"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <InputPicker
                    items={currencies}
                    selectedValue={value}
                    onValueChange={(v) => onChange(v as number)}
                    label="Currency"
                    withShadow
                    containerStyle={styles.currency}
                    disabled={!isNewWallet}
                  />
                )}
              />

              <Controller
                name="initialBalance"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    containerStyle={styles.balance}
                    label="Balance"
                    placeholder="0"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    returnKeyType="done"
                    editable={isNewWallet}
                    withShadow
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Design" />

            <Controller
              name="design"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View style={styles.designsContainer}>
                  {Object.keys(gradients).map((key) => (
                    <TouchableOpacity key={key} onPress={() => onChange(key as WalletDesign)} activeOpacity={0.5}>
                      <View style={[styles.designCircle, key === value && styles.selectedCircle]}>
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
              )}
            />
          </View>

          <View style={styles.section}>
            <SectionTitle title="Preview" />

            <WalletCard
              walletName={selectedWalletName || 'Wallet name'}
              balance="999999999999"
              currencyCode={currencies.find((c) => c.value === Number(selectedCurrency))?.label || ''}
              totalIncome={9999999999}
              totalSpend={999999999}
              design={selectedDesign}
            />
          </View>
        </View>

        <Button title={isNewWallet ? 'Create' : 'Save changes'} onPress={onSubmit} disabled={isSubmitSuccessful} />
      </RootLayout>
    </>
  );
};

export default CreateWalletScreen;
