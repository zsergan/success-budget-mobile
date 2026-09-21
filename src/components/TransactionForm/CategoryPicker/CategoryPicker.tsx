import { Text, TouchableOpacity, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import Icon from '@components/Icon/Icon';
import type { CategoryModel } from '@api/models';
import { colors } from '@shared/theme';
import { hexToRgba } from '@shared/utils';
import type { TransactionFormData } from '../useTransactionForm';

import styles from './style';

interface Props {
  control: Control<TransactionFormData>;
  categories: CategoryModel[];
  typeColor: string;
}

const CategoryPicker = ({ control, categories, typeColor }: Props) => (
  <Controller
    name="category_id"
    control={control}
    render={({ field: { onChange, value } }) => {
      const selectedName = categories.find(({ id }) => id === value)?.name;

      return (
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Category</Text>

            <Text style={[styles.sectionHint, selectedName && { color: typeColor }]}>{selectedName ?? 'Required'}</Text>
          </View>

          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const selected = category.id === value;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCell}
                  onPress={() => onChange(category.id)}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.categoryIconBox,
                      selected && { backgroundColor: hexToRgba(typeColor, 0.1), borderColor: typeColor },
                    ]}
                  >
                    <Icon name={category.icon} size={22} color={selected ? typeColor : colors.text} />
                  </View>

                  <Text style={[styles.categoryName, selected && { color: typeColor }]} numberOfLines={2}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }}
  />
);

export default CategoryPicker;
