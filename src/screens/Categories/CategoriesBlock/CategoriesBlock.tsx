import { memo } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { Category } from '@api/dto';
import type { RadioButtons } from '@components';
import { RadioGroup, SectionTitle } from '@components';

import styles from './style';

const getRadioButtons = (
  categories: Category[],
  onCategoryLongPress: (category: Category) => void,
): RadioButtons<number>[] =>
  categories.map((category) => ({
    ...category,
    title: category.name,
    value: category.id,
    selected: category.is_active === 1,
    size: 'md',
    onLongPress: () => Haptics.impactAsync().then(() => onCategoryLongPress(category)),
  }));

interface Props {
  title: string;
  categories: Category[];
  onPress: (categoryId: number) => void;
  onCategoryLongPress: (category: Category) => void;
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
