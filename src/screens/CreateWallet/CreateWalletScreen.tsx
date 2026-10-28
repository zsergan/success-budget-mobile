import { Text, TouchableOpacity, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Banner, Input, RootLayout, Button, SectionTitle, GradientBackground, WalletCard, Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import type { RootStackScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import { CATEGORY_COLOR_NAMES, CATEGORY_COLOR_ORDER } from '@shared/categoryColors';
import useCreateWalletForm from './useCreateWalletForm';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.ADD_WALLET_SCREEN> {}

const CreateWalletScreen = ({ navigation, route }: Props) => {
  const { wallets } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const { spaceCurrencyCode, isNewWallet, control, onSubmit, watch, isSubmitDisabled, submitError } =
    useCreateWalletForm({
      navigation,
      route,
    });

  const selectedWalletName = watch('walletName');
  const selectedBalance = watch('initialBalance');
  const selectedDesign = watch('design');

  return (
    <>
      <RootLayout style={styles.root}>
        <View style={styles.sectionsContainer}>
          <SectionTitle
            title={isNewWallet ? 'Add Wallet' : 'Edit Wallet'}
            onBackButtonPress={() => navigation.goBack()}
          />

          <WalletCard
            walletName={selectedWalletName || 'Wallet name'}
            balance={selectedBalance || '0'}
            currencyCode={spaceCurrencyCode || ''}
            totalIncome={0}
            totalSpend={0}
            design={selectedDesign}
            badgeLabel="PREVIEW"
          />

          <View style={styles.formContainer}>
            <Controller
              name="walletName"
              control={control}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Input
                  label="Wallet Name"
                  placeholder="My Wallet"
                  value={value}
                  onChangeText={onChange}
                  error={error?.message}
                  withShadow
                />
              )}
            />

            <View style={styles.fieldGroup}>
              <Controller
                name="initialBalance"
                control={control}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Input
                    label="Starting balance"
                    error={error?.message}
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

              {isNewWallet && (
                <Text style={styles.hint}>
                  {`How much is already in this wallet. Amounts are in ${spaceCurrencyCode}, the currency of this space.`}
                </Text>
              )}
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
                        <View style={styles.swatch}>
                          <View
                            pointerEvents="none"
                            style={[styles.selectionRing, isSelected && styles.selectedRing]}
                          />

                          <View style={styles.designCircle}>
                            <GradientBackground
                              colors={wallets[design].gradient}
                              style={styles.gradient}
                              start={{ x: 0, y: 0.0 }}
                              end={{ x: 1.0, y: 1.0 }}
                            />

                            {isSelected && <Icon name="check" size={17} color={wallets[design].fg} />}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>
          {submitError && <Banner tone="danger" text={submitError} />}
        </View>

        <Button title={isNewWallet ? 'Create' : 'Save changes'} onPress={onSubmit} disabled={isSubmitDisabled} />
      </RootLayout>
    </>
  );
};

export default CreateWalletScreen;
