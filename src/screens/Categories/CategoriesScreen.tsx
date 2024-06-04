import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { RadioButtonGroup, RootLayout, SectionTitle, TinyButton, LongPressedModal } from '@components';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';
import type { Category } from '@api/dto';

import useAllCategories from './useAllCategories';

import styles from './style';

const renderBlock = (
  title: string,
  categories: Category[],
  onPress: (categoryId: number, categoryName: string, isActive: number) => void,
  onCategoryLongPress: (category: Category) => void,
) => (
  <View>
    <SectionTitle title={title} />

    <RadioButtonGroup
      limitRows={false}
      buttons={categories.map((category) => ({
        ...category,
        title: category.name,
        value: category.id,
        selected: category.is_active === 1,
        size: 'md',
        onLongPress: () => Haptics.impactAsync().then(() => onCategoryLongPress(category)),
      }))}
      onPress={(id) => {
        const category = categories.find((item) => item.id === id);
        onPress(id, category?.name || '', category?.is_active === 1 ? 0 : 1);
      }}
    />
  </View>
);

interface Props extends ScreenProps<ScreenNames.CATEGORIES_SCREEN> {}

const CategoriesScreen = ({ navigation }: Props) => {
  const {
    incomes,
    expenses,
    handleUpdate,
    longPressedCategory,
    onCategoryLongPress,
    isModalVisible,
    onLongPressCancel,
  } = useAllCategories();

  const handleOnEdit = () => {
    if (longPressedCategory) {
      navigation.navigate(ScreenNames.ADD_CATEGORY_SCREEN, {
        id: longPressedCategory.id,
        name: longPressedCategory.name,
        icon: longPressedCategory.icon,
        color: longPressedCategory.color,
        transaction_type: longPressedCategory.transaction_type,
      });
    }

    onLongPressCancel();
  };

  return (
    <>
      <LongPressedModal
        isVisible={isModalVisible}
        longPressedItem={
          <TinyButton
            title={longPressedCategory?.name}
            icon={longPressedCategory?.icon}
            color={longPressedCategory?.color}
            size="md"
            selected={longPressedCategory?.is_active === 1}
            style={styles.selectedCategory}
          />
        }
        onClose={onLongPressCancel}
        onEdit={handleOnEdit}
      />

      <RootLayout style={styles.root}>
        <SectionTitle
          style={styles.pageTitle}
          title="Your Categories"
          onBackButtonPress={() => navigation.goBack()}
          button={
            <TinyButton
              title="Add category"
              icon="add"
              onPress={() => navigation.navigate(ScreenNames.ADD_CATEGORY_SCREEN, { id: 'new' })}
            />
          }
        />

        {renderBlock('Income', incomes, handleUpdate, onCategoryLongPress)}

        {renderBlock('Expense', expenses, handleUpdate, onCategoryLongPress)}
      </RootLayout>
    </>
  );
};

export default CategoriesScreen;
