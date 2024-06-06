import { Dimensions, View } from 'react-native';
import { Controller } from 'react-hook-form';

import { Button, Input, RadioButtonGroup, RootLayout, SectionTitle } from '@components';
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

interface Props extends ScreenProps<ScreenNames.ADD_LIMIT_SCREEN> {}

const CreateLimitScreen = ({ navigation, route }: Props) => {
  const { width: screenWidth } = Dimensions.get('window');
  const { limits } = useAppSelector(selectLimit);
  const limitCategoryIds = limits.map((limit) => (limit.category ? limit.category.id : ALL_OTHERS_CATEGORIES_ID));
  const { baseCurrency } = useAppSelector(selectProfile);
  const { expenses } = useAppSelector(selectCategory);
  const availableCategories = expenses.filter((category) => category.is_active === 1);
  const { isNewLimit, prevLimit, control, onSubmit, isSubmitSuccessful, watch } = useCreateLimitForm({
    navigation,
    route,
  });

  const selectedCategoryId = watch('category_id');

  const allOthersCategoriesButton = {
    id: ALL_OTHERS_CATEGORIES_ID,
    value: ALL_OTHERS_CATEGORIES_ID,
    icon: 'interests' as IconType,
    title: 'All not limited categories',
    selected: selectedCategoryId === ALL_OTHERS_CATEGORIES_ID,
    size: 'md' as 'sm' | 'md',
    disabled:
      limitCategoryIds.includes(ALL_OTHERS_CATEGORIES_ID) && ALL_OTHERS_CATEGORIES_ID !== prevLimit?.category_id,
    style: [styles.allOthersCategoriesButton, { width: screenWidth - 2 * horizontalScreenPadding }],
  };

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
                <RadioButtonGroup
                  limitRows={false}
                  buttons={[
                    allOthersCategoriesButton,
                    ...availableCategories.map((category) => ({
                      ...category,
                      title: category.name,
                      value: category.id,
                      selected: category.id === Number(value),
                      size: 'md' as 'sm' | 'md',
                      disabled: limitCategoryIds.includes(category.id) && category.id !== prevLimit?.category_id,
                    })),
                  ]}
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
          disabled={isSubmitSuccessful}
          withShadow
        />
      </View>
    </>
  );
};

export default CreateLimitScreen;
