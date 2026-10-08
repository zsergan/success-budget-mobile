import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';

import Icon from '@components/Icon/Icon';
import { useAppDispatch, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { getActiveCategories } from '@redux/state/category/selectors';
import { categoryPicked } from '@redux/state/transactionFlow/slice';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import { hexToRgba } from '@shared/utils';
import PanelHeader from '../PanelHeader/PanelHeader';
import SectionLoad, { listLoad } from '../SectionLoad/SectionLoad';
import useBoundedHeight from '@components/Modals/BottomSheetModal/useBoundedHeight';

import styles from './style';

const SEARCH_THRESHOLD = 16;

interface Props {
  transactionType: TransactionType;
  selectedId: number | null;
  onBack: () => void;
  onClose: () => void;
}

// Every active category of the draft's type; a tap picks it and goes back to the form, which kept the rest.
const CategoriesPanel = ({ transactionType, selectedId, onBack, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const { height } = useBoundedHeight();
  const categoriesQuery = useGetCategoriesQuery(useSpaceArg());
  const { currentData } = categoriesQuery;
  const load = listLoad(categoriesQuery);
  const { incomes, expenses } = useMemo(() => getActiveCategories(currentData), [currentData]);
  const [query, setQuery] = useState('');

  useEffect(() => Keyboard.dismiss(), []);

  const isIncome = transactionType === TransactionType.INCOME;
  const typeColor = isIncome ? colors.ok : colors.danger;
  const categories = isIncome ? incomes : expenses;
  const needle = query.trim().toLowerCase();
  const shown = needle ? categories.filter(({ name }) => name.toLowerCase().includes(needle)) : categories;

  return (
    <View style={{ height }}>
      <PanelHeader title="Categories" subtitle="Your transaction is kept" onBack={onBack} onClose={onClose} />

      <BottomSheetScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {load !== 'ready' && <SectionLoad load={load} name="categories" onRetry={categoriesQuery.refetch} />}

        {categories.length > SEARCH_THRESHOLD && (
          <BottomSheetTextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Search categories"
          />
        )}

        {shown.length === 0 && needle !== '' && (
          <Text style={styles.noMatches}>
            No {isIncome ? 'income' : 'expense'} categories match “{query.trim()}”
          </Text>
        )}

        <View style={styles.grid}>
          {shown.map((category) => {
            const isSelected = category.id === selectedId;

            return (
              <TouchableOpacity
                key={category.id}
                style={styles.cell}
                onPress={() => dispatch(categoryPicked({ categoryId: category.id }))}
                activeOpacity={0.6}
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={[
                    styles.iconBox,
                    isSelected && { backgroundColor: hexToRgba(typeColor, 0.1), borderColor: typeColor },
                  ]}
                >
                  <Icon name={category.icon} size={22} color={isSelected ? typeColor : colors.text} />
                </View>

                <Text style={[styles.name, isSelected && { color: typeColor }]} numberOfLines={2}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetScrollView>
    </View>
  );
};

export default CategoriesPanel;
