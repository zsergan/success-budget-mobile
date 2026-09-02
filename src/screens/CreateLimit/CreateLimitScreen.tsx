import { Dimensions, View } from 'react-native';
import { Controller } from 'react-hook-form';

import type { Limit } from '@api/dto';
import type { CategoryModel } from '@api/models';
import type { RadioButtons } from '@components';
import { Button, Input, RadioGroup, RootLayout, SectionTitle } from '@components';
import type { IconType, ScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import { useAppSelector } from '@redux/hooks';
import { selectProfile } from '@redux/state/profile/selectors';
import { selectCategory } from '@redux/state/category/selectors';
import { selectLimit } from '@redux/state/limit/selectors';
import { ALL_OTHERS_CATEGORIES_ID } from '@shared/constants';
import useCreateLimitForm from './useCreateLimitForm';

import { horizontalScreenPadding } from '@shared/theme';
import styles from './style';

const getCategoryRadioButtons = (
  expenses: CategoryModel[],
  limits: Limit[],
  screenWidth: number,
  prevCategoryId?: number,
): RadioButtons<number>[] => {
  const limitCategoryIds = limits.map((limit) => (limit.category ? limit.category.id : ALL_OTHERS_CATEGORIES_ID));
  const availableCategories = expenses.filter((category) => category.isActive);

  const allOthersCategoriesButton: RadioButtons<number> = {
    value: ALL_OTHERS_CATEGORIES_ID,
    icon: 'interests' as IconType,
    title: 'All not limited categories',
    size: 'md',
    disabled: limitCategoryIds.includes(ALL_OTHERS_CATEGORIES_ID) && ALL_OTHERS_CATEGORIES_ID !== prevCategoryId,
    style: [styles.allOthersCategoriesButton, { width: screenWidth - 2 * horizontalScreenPadding }],
  };

  const categoryButtons: RadioButtons<number>[] = availableCategories.map((category) => ({
    ...category,
    title: category.name,
    value: category.id,
    size: 'md',
    disabled: limitCategoryIds.includes(category.id) && category.id !== prevCategoryId,
  }));

  return [allOthersCategoriesButton, ...categoryButtons];
};

interface Props extends ScreenProps<ScreenNames.ADD_LIMIT_SCREEN> {}

const CreateLimitScreen = ({ navigation, route }: Props) => {
  const { width: screenWidth } = Dimensions.get('window');
  const { limits } = useAppSelector(selectLimit);
  const { baseCurrency } = useAppSelector(selectProfile);
  const { expenses } = useAppSelector(selectCategory);
  const { isNewLimit, prevLimit, control, onSubmit, isSubmitDisabled } = useCreateLimitForm({
    navigation,
    route,
  });

  return (
    <>
      <RootLayout>
        <View style={styles.root}>
          <SectionTitle title={isNewLimit ? 'Add Limit' : 'Edit Limit'} onBackButtonPress={() => navigation.goBack()} />

          <Controller
            name="amount"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Input
                label={`Limit (${baseCurrency?.code})`}
                placeholder="Enter your limit"
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          <View style={styles.section}>
            <SectionTitle title="Category" />

            <Controller
              name="category_id"
              control={control}
              render={({ field: { onChange, value } }) => (
                <RadioGroup
                  value={value}
                  limitRows={false}
                  buttons={getCategoryRadioButtons(expenses, limits, screenWidth, prevLimit?.category_id)}
                  onPress={(v) => onChange(v)}
                />
              )}
            />
          </View>
        </View>
      </RootLayout>

      <View style={styles.buttonContainer}>
        <Button
          title={isNewLimit ? 'Create' : 'Save changes'}
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          withShadow
        />
      </View>
    </>
  );
};

export default CreateLimitScreen;
