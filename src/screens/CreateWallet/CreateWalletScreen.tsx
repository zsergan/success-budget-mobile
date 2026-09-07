import { Text, TouchableOpacity, View } from 'react-native';
import { Controller } from 'react-hook-form';

import {
  Input,
  RootLayout,
  Button,
  SectionTitle,
  GradientBackground,
  WalletCard,
  InputPicker,
  Icon,
} from '@components';
import type { ScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import { gradients, walletTextColors } from '@shared/constants';
import { CATEGORY_COLOR_NAMES, CATEGORY_COLOR_ORDER } from '@shared/categoryColors';
import useCreateWalletForm from './useCreateWalletForm';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.ADD_WALLET_SCREEN> {}

const CreateWalletScreen = ({ navigation, route }: Props) => {
  const { currencies, isNewWallet, control, onSubmit, watch, isSubmitDisabled } = useCreateWalletForm({
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
            <SectionTitle
              title="Card colour"
              button={<Text style={styles.presetName}>{CATEGORY_COLOR_NAMES[selectedDesign]}</Text>}
            />

            <Controller
              name="design"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View style={styles.designsContainer}>
                  {CATEGORY_COLOR_ORDER.map((design) => {
                    const isSelected = design === value;

                    return (
                      <TouchableOpacity key={design} onPress={() => onChange(design)} activeOpacity={0.5}>
                        <View style={[styles.designCircle, isSelected && styles.selectedCircle]}>
                          <GradientBackground
                            colors={gradients[design]}
                            style={styles.gradient}
                            start={{ x: 0, y: 0.0 }}
                            end={{ x: 1.0, y: 1.0 }}
                          />

                          {isSelected && <Icon name="check" size={17} color={walletTextColors[design].fg} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
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

        <Button title={isNewWallet ? 'Create' : 'Save changes'} onPress={onSubmit} disabled={isSubmitDisabled} />
      </RootLayout>
    </>
  );
};

export default CreateWalletScreen;
