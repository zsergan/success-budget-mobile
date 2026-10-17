import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList from 'react-native-draggable-flatlist';

import { BottomSheetModal as BottomModal, CategoryEditorSheet, EmptyState, Icon } from '@components';
import { useConfirmAction, useSpaceRefresh, useTheme, useThemedStyles } from '@hooks';
import type { CategoryModel } from '@api/models';
import type { RootStackScreenProps } from '@shared/types';
import type { ScreenNames } from '@shared/enums';
import CategoriesEmptyState from './components/CategoriesEmptyState/CategoriesEmptyState';
import DeleteCategoryDialog from './components/DeleteCategoryDialog/DeleteCategoryDialog';
import CategoryRow from './components/CategoryRow/CategoryRow';
import SegmentedControl from './components/SegmentedControl/SegmentedControl';
import useCategoryEditor from './hooks/useCategoryEditor';
import type { CategorySegment } from './hooks/useCategoryList';
import useCategoryList from './hooks/useCategoryList';

import createStyles from './style';

interface Props extends RootStackScreenProps<ScreenNames.CATEGORIES_SCREEN> {}

const ARCHIVE_FOOTNOTE =
  'Restoring puts a category back into the picker. It does not re-join limits automatically — add it to a limit again if you want it counted.';

const CategoriesScreen = ({ navigation }: Props) => {
  const { scheme, colorTheme } = useTheme();
  const { colors } = colorTheme;
  const styles = useThemedStyles(createStyles);
  useSpaceRefresh();
  const categoryDeletion = useConfirmAction<CategoryModel>();

  const {
    segment,
    changeSegment,
    counts,
    sortMode,
    toggleSortMode,
    searchQuery,
    setSearchQuery,
    isSearching,
    resultNote,
    list,
    isLoading,
    hasError,
    retry,
    handleReorder,
    handleRestore,
    defaultTransactionType,
  } = useCategoryList();

  const { editorRef, editingCategory, openCreate, openEdit } = useCategoryEditor();

  const isManual = sortMode === 'manual' && segment !== 'archived';

  const handleRequestDelete = (category: CategoryModel) => {
    editorRef.current?.dismiss();
    categoryDeletion.open(category);
  };

  const segmentOptions = (
    [
      { value: 'expenses', label: 'Expenses', count: counts.expenses },
      { value: 'income', label: 'Income', count: counts.income },
      { value: 'archived', label: 'Archived', count: counts.archived },
    ] as const
  ).map((option) => ({ ...option, value: option.value as CategorySegment }));

  return (
    <>
      <BottomModal ref={editorRef} fitContent>
        <CategoryEditorSheet
          key={editingCategory?.id ?? 'new'}
          category={editingCategory}
          defaultTransactionType={defaultTransactionType}
          onRequestDelete={handleRequestDelete}
        />
      </BottomModal>

      <DeleteCategoryDialog deletion={categoryDeletion} />

      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Icon name="back" size={16} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>

            <Text style={styles.title}>Categories</Text>
          </View>

          {segment !== 'archived' && (
            <TouchableOpacity
              style={[styles.sortChip, isManual && styles.sortChipActive]}
              onPress={toggleSortMode}
              activeOpacity={0.7}
            >
              <Icon
                name={isManual ? 'list' : 'chart'}
                size={13}
                color={isManual ? colors.onAccent : colors.text}
                strokeWidth={2.1}
              />

              <Text style={[styles.sortChipText, isManual && styles.sortChipTextActive]}>
                {isManual ? 'Manual order' : 'Most used'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.searchRow, isSearching && styles.searchRowActive]}>
          <Icon name="search" size={16} color={isSearching ? colors.text : colors.muted} strokeWidth={2} />

          <TextInput
            keyboardAppearance={scheme}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search categories"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
          />

          {isSearching && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Icon name="close" size={14} color={colors.muted} strokeWidth={2.2} />
            </TouchableOpacity>
          )}
        </View>

        {isSearching && <Text style={styles.resultNote}>{resultNote}</Text>}

        <View style={styles.segmentedWrap}>
          <SegmentedControl options={segmentOptions} value={segment} onChange={changeSegment} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : hasError ? (
          <EmptyState
            icon="list"
            title="Couldn't load categories"
            description="Check your connection and try again."
            actionLabel="Retry"
            onActionPress={retry}
          />
        ) : list.length === 0 ? (
          <CategoriesEmptyState segment={segment} isSearching={isSearching} />
        ) : isManual ? (
          <DraggableFlatList
            style={styles.body}
            contentContainerStyle={styles.listContent}
            data={list}
            keyExtractor={(category) => String(category.id)}
            onDragEnd={({ data }) => handleReorder(data)}
            renderItem={({ item, drag, isActive }) => (
              <CategoryRow category={item} manual isActive={isActive} onDrag={drag} />
            )}
          />
        ) : (
          <FlatList
            style={styles.body}
            contentContainerStyle={styles.listContent}
            data={list}
            keyExtractor={(category) => String(category.id)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) =>
              segment === 'archived' ? (
                <CategoryRow category={item} archived onRestore={() => handleRestore(item)} />
              ) : (
                <CategoryRow category={item} onPress={() => openEdit(item)} />
              )
            }
            ListFooterComponent={
              segment === 'archived' ? (
                <View style={styles.archiveFootnoteRow}>
                  <Icon name="refresh" size={13} color={colors.muted} strokeWidth={1.9} />
                  <Text style={styles.archiveFootnoteText}>{ARCHIVE_FOOTNOTE}</Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>

      {segment !== 'archived' && (
        <View style={styles.fabRoot}>
          <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.8}>
            <Icon name="plus" size={24} color={colors.onAccent} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default CategoriesScreen;
