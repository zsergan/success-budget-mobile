import { RootLayout, SectionTitle, TinyButton, LongPressedModal } from '@components';
import type { ScreenProps } from '@shared/types';
import { ScreenNames } from '@shared/enums';

import CategoriesBlock from './CategoriesBlock';
import useAllCategories from './useAllCategories';

import styles from './style';

interface Props extends ScreenProps<ScreenNames.CATEGORIES_SCREEN> {}

const CategoriesScreen = ({ navigation, route }: Props) => {
  const {
    isModalVisible,
    incomes,
    expenses,
    longPressedCategory,
    onEdit,
    onUpdate,
    onMoveForward,
    onCategoryLongPress,
    onLongPressCancel,
  } = useAllCategories({ navigation, route });

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
        onEdit={onEdit}
        customOptions={[{ onPress: onMoveForward, text: 'Move forward' }]}
      />

      <RootLayout style={styles.root}>
        <SectionTitle
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

        <CategoriesBlock
          title="Income"
          categories={incomes}
          onPress={onUpdate}
          onCategoryLongPress={onCategoryLongPress}
        />

        <CategoriesBlock
          title="Expense"
          categories={expenses}
          onPress={onUpdate}
          onCategoryLongPress={onCategoryLongPress}
        />
      </RootLayout>
    </>
  );
};

export default CategoriesScreen;
