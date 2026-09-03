import { View } from 'react-native';
import { Controller } from 'react-hook-form';

import type { RadioButtons } from '@components';
import { Button, Input, RadioGroup, RootLayout, SectionTitle } from '@components';
import type { CategoryIconType, ScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import { TransactionType } from '@shared/enums';
import { colors, palette } from '@shared/theme';

import useCreateCategoryForm from './useCreateCategoryForm';

import styles from './style';

const icons: CategoryIconType[] = [
  'paid',
  'home',
  'pets',
  'store',
  'money',
  'flight',
  'cable',
  'school',
  'healing',
  'category',
  'fastfood',
  'checkroom',
  'water-drop',
  'directions-bus',
  'directions-car',
  'sports-esports',
  'shopping-basket',
  'card-giftcard',
];

const getIconRadioButtons = (selectedColor: string): RadioButtons<string>[] =>
  icons.map((icon) => ({
    value: icon,
    color: selectedColor,
    icon,
    size: 'md',
  }));

const categoryColors: string[] = [
  palette.black,
  palette.yellow,
  palette.greenDark,
  palette.blue,
  palette.red,
  palette.pinkLight,
];

const getColorRadioButtons = (): RadioButtons<string>[] =>
  categoryColors.map((color) => ({
    circleColor: color,
    showCircle: true,
    value: color,
    size: 'md',
  }));

const transactionTypes: RadioButtons<string>[] = [
  {
    title: 'Expense',
    value: TransactionType.EXPENSE,
    icon: 'arrow-outward',
    color: colors.danger,
    size: 'md',
  },
  {
    title: 'Income',
    value: TransactionType.INCOME,
    icon: 'arrow-downward',
    color: colors.ok,
    size: 'md',
  },
];

interface Props extends ScreenProps<ScreenNames.ADD_CATEGORY_SCREEN> {}

const CreateCategoryScreen = ({ navigation, route }: Props) => {
  const { isNewCategory, control, watch, onSubmit, isSubmitDisabled } = useCreateCategoryForm({ navigation, route });
  const selectedColor = watch('color');

  return (
    <>
      <RootLayout>
        <View style={styles.root}>
          <SectionTitle
            title={isNewCategory ? 'Add Category' : 'Edit Category'}
            onBackButtonPress={() => navigation.goBack()}
          />

          <Controller
            name="name"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input label="Name" placeholder="My category" value={value} onChangeText={onChange} />
            )}
          />

          <View style={styles.section}>
            <SectionTitle title="Type" />

            <View style={styles.alignCenter}>
              <Controller
                name="transactionType"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <RadioGroup value={value} limitRows={false} buttons={transactionTypes} onPress={onChange} />
                )}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Icon" />

            <Controller
              name="icon"
              control={control}
              render={({ field: { onChange, value } }) => (
                <RadioGroup
                  value={value}
                  radioGroupContainerStyle={styles.justifyCenter}
                  limitRows={false}
                  buttons={getIconRadioButtons(selectedColor)}
                  onPress={onChange}
                />
              )}
            />
          </View>

          <View style={styles.section}>
            <SectionTitle title="Color" />

            <View style={styles.alignCenter}>
              <Controller
                name="color"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <RadioGroup value={value} limitRows={false} buttons={getColorRadioButtons()} onPress={onChange} />
                )}
              />
            </View>
          </View>
        </View>
      </RootLayout>

      <View style={styles.buttonContainer}>
        <Button
          title={isNewCategory ? 'Create' : 'Save changes'}
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          withShadow
        />
      </View>
    </>
  );
};

export default CreateCategoryScreen;
