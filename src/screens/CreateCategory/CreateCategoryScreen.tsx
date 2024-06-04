import { View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, Input, RadioButtonGroup, RootLayout, SectionTitle } from '@components';
import type { CategoryIconType, IconType, ScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import { TransactionType } from '@shared/enums';
import { palette } from '@shared/theme';

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

const colors: string[] = [
  palette.black,
  palette.yellow,
  palette.greenDark,
  palette.blue,
  palette.red,
  palette.pinkLight,
];

interface Props extends ScreenProps<ScreenNames.ADD_CATEGORY_SCREEN> {}

const CreateCategoryScreen = ({ navigation, route }: Props) => {
  const { isNewCategory, control, watch, onSubmit, isSubmitSuccessful } = useCreateCategoryForm({ navigation, route });
  const { transactionType: selectedTransactionType, color: selectedColor } = watch();

  const transactionTypes = [
    {
      title: 'Expense',
      value: TransactionType.EXPENSE,
      selected: selectedTransactionType === TransactionType.EXPENSE,
      icon: 'arrow-outward' as IconType,
      color: palette.red,
      size: 'md' as 'sm' | 'md',
    },
    {
      title: 'Income',
      value: TransactionType.INCOME,
      selected: selectedTransactionType === TransactionType.INCOME,
      icon: 'arrow-downward' as IconType,
      color: palette.green,
      size: 'md' as 'sm' | 'md',
    },
  ];

  return (
    <>
      <RootLayout>
        <View style={styles.root}>
          <SectionTitle
            title={isNewCategory ? 'Add Category' : 'Edit Category'}
            onBackButtonPress={() => navigation.goBack()}
            style={styles.pageTitle}
          />

          <Controller
            name="name"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input label="Name" placeholder="My category" value={value} onChangeText={onChange} />
            )}
          />

          <View>
            <SectionTitle title="Type" />

            <View style={styles.alignCenter}>
              <Controller
                name="transactionType"
                control={control}
                render={({ field: { onChange } }) => (
                  <RadioButtonGroup limitRows={false} buttons={transactionTypes} onPress={onChange} />
                )}
              />
            </View>
          </View>

          <View>
            <SectionTitle title="Icon" />

            <Controller
              name="icon"
              control={control}
              render={({ field: { onChange, value } }) => (
                <RadioButtonGroup
                  radioButtonGroupContainerStyle={styles.justifyCenter}
                  limitRows={false}
                  buttons={icons.map((icon) => ({
                    value: icon,
                    selected: value === icon,
                    color: selectedColor,
                    icon,
                    size: 'md',
                  }))}
                  onPress={onChange}
                />
              )}
            />
          </View>

          <View>
            <SectionTitle title="Color" />

            <View style={styles.alignCenter}>
              <Controller
                name="color"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <RadioButtonGroup
                    limitRows={false}
                    buttons={colors.map((color) => ({
                      circleColor: color,
                      showCircle: true,
                      value: color,
                      selected: value === color,
                      size: 'md',
                    }))}
                    onPress={onChange}
                  />
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
          disabled={isSubmitSuccessful}
          withShadow
        />
      </View>
    </>
  );
};

export default CreateCategoryScreen;
