import { memo } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { CategoryModel } from '@api/models';
import type { RadioButtons } from '@components';
import { RadioGroup, SectionTitle } from '@components';

import styles from './style';

const getRadioButtons = (
  categories: CategoryModel[],
  onCategoryLongPress: (category: CategoryModel) => void,
): RadioButtons<number>[] =>
  categories.map((category) => ({
    ...category,
    title: category.name,
    value: category.id,
    selected: category.isActive,
    size: 'md',
    onLongPress: () => Haptics.impactAsync().then(() => onCategoryLongPress(category)),
  }));

interface Props {
  title: string;
  categories: CategoryModel[];
  onPress: (categoryId: number) => void;
  onCategoryLongPress: (category: CategoryModel) => void;
}

const CategoriesBlock = memo(function CategoriesBlock({ title, categories, onPress, onCategoryLongPress }: Props) {
  return (
    <View style={styles.section}>
      <SectionTitle title={title} />

      <RadioGroup limitRows={false} buttons={getRadioButtons(categories, onCategoryLongPress)} onPress={onPress} />
    </View>
  );
});

export default CategoriesBlock;
