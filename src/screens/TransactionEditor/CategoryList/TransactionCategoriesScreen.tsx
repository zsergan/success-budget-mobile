import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import ScreenFrame from '@components/ScreenFrame/ScreenFrame';
import CategoryTile, { useCategoryColumns } from '@screens/TransactionEditor/components/CategoryTile/CategoryTile';
import SectionLoad, { listLoad } from '@screens/TransactionEditor/components/SectionLoad/SectionLoad';
import { useTheme, useThemedStyles } from '@hooks';
import { useAppDispatch, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { getActiveCategories } from '@redux/state/category/selectors';
import { awayStarted, categoryPicked } from '@redux/state/transactionFlow/slice';
import type { ScreenNames } from '@shared/enums';
import { TransactionType } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { afterKeyboardHides } from '@shared/utils';
import useEditorFlow from '../hooks/useEditorFlow';

import createStyles from './style';

const SEARCH_THRESHOLD = 16;

interface Props extends RootStackScreenProps<ScreenNames.TRANSACTION_CATEGORIES_SCREEN> {}

// Every active category of the draft's type, over the form. A tap picks it for that draft and goes back; Back leaves
// the draft as it was. The editor route below owns the flow and takes this screen with it when the flow ends.
const TransactionCategoriesScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const columns = useCategoryColumns();
  const { flow, getFlow } = useEditorFlow(route.params.spaceId);
  const categoriesQuery = useGetCategoriesQuery(useSpaceArg());
  const { currentData } = categoriesQuery;
  const load = listLoad(categoriesQuery);
  const { incomes, expenses } = useMemo(() => getActiveCategories(currentData), [currentData]);
  const [query, setQuery] = useState('');

  // The last draft stays on screen while the route animates away.
  const [lastDraft, setLastDraft] = useState(flow?.draft ?? null);
  if (flow?.draft && flow.draft !== lastDraft) setLastDraft(flow.draft);
  const draft = flow?.draft ?? lastDraft;

  const isIncome = draft?.transactionType === TransactionType.INCOME;
  const typeColor = isIncome ? colors.ok : colors.danger;
  const typeWord = isIncome ? 'income' : 'expense';
  const categories = isIncome ? incomes : expenses;
  const needle = query.trim().toLowerCase();
  const shown = needle ? categories.filter(({ name }) => name.toLowerCase().includes(needle)) : categories;

  // A second tap, or one landing as the screen leaves, must not act on the form below.
  const getOwnFlow = () => (navigation.isFocused() ? getFlow() : null);

  const pick = (categoryId: number) => {
    const current = getOwnFlow();
    if (!current || current.isSaving) return;

    dispatch(categoryPicked({ draftId: current.draftId, categoryId }));
    navigation.goBack();
  };

  // The editor below shows the category sheet and comes back into view once the new category is saved.
  const create = () => {
    const current = getOwnFlow();
    if (!current || current.isSaving || current.away) return;

    const { draftId } = current;
    afterKeyboardHides(() => dispatch(awayStarted({ draftId, target: 'category' })));
  };

  return (
    <ScreenFrame>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.isFocused() && navigation.goBack()}
          activeOpacity={0.6}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to the form"
        >
          <Icon name="back" size={16} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
          {isIncome ? 'Income categories' : 'Expense categories'}
        </Text>

        {load === 'ready' && <Text style={styles.count}>{categories.length}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {load !== 'ready' && (
          <SectionLoad load={load} name="categories" icon="grid" onRetry={categoriesQuery.refetch} />
        )}

        {categories.length > SEARCH_THRESHOLD && (
          <View style={styles.search}>
            <Icon name="search" size={16} color={colors.muted} strokeWidth={1.8} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search categories"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Search categories"
            />
          </View>
        )}

        {shown.length === 0 && needle !== '' && (
          <Text style={styles.noMatches}>
            No {typeWord} categories match “{query.trim()}”
          </Text>
        )}

        {load === 'ready' && (
          <View style={styles.grid}>
            {shown.map((category) => (
              <CategoryTile
                key={category.id}
                name={category.name}
                icon={category.icon}
                columns={columns}
                typeColor={typeColor}
                isSelected={category.id === draft?.categoryId}
                onPress={() => pick(category.id)}
              />
            ))}

            {needle === '' && (
              <CategoryTile name="New" icon="plus" columns={columns} typeColor={typeColor} isAction onPress={create} />
            )}
          </View>
        )}

        {load === 'ready' && (
          <Text style={styles.note}>Only {typeWord} categories are shown. Archived ones stay hidden here.</Text>
        )}
      </ScrollView>
    </ScreenFrame>
  );
};

export default TransactionCategoriesScreen;
