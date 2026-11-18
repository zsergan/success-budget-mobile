import { useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { FieldRevealProvider, useFieldRevealScroll } from '@components/RootLayout/FieldReveal';
import useKeyboardHeight from '@hooks/useKeyboardHeight';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { useAppDispatch, useAppSelector, useSpaceArg } from '@redux/hooks';
import { useGetCategoriesQuery } from '@redux/state/category/api';
import { getActiveCategories } from '@redux/state/category/selectors';
import { useGetLimitsQuery } from '@redux/state/limit/api';
import { useGetMembersQuery } from '@redux/state/member/api';
import { activeMemberIds } from '@redux/state/member/selectors';
import { useGetProfileQuery } from '@redux/state/profile/api';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import type { TransactionDraft } from '@redux/state/transactionFlow/draft';
import { changedFields, getDraftErrors, hasDraftErrors } from '@redux/state/transactionFlow/draft';
import { hasUnsavedChanges, selectIsDeleting } from '@redux/state/transactionFlow/selectors';
import type { TransactionFlow } from '@redux/state/transactionFlow/slice';
import { draftChanged } from '@redux/state/transactionFlow/slice';
import { loadLatestRecord } from '@redux/state/transactionFlow/thunks';
import { TransactionType } from '@shared/enums';
import { authorLabel } from '@shared/utils';
import DeleteButton from '@components/TransactionFlow/DeleteButton/DeleteButton';
import { deleteFailureAction, deleteFailureText } from '@components/TransactionFlow/deleteMessage';
import Banner from '@components/Banner/Banner';
import type { ListLoad } from '../SectionLoad/SectionLoad';
import { listLoad } from '../SectionLoad/SectionLoad';
import ActionRow from './ActionRow/ActionRow';
import AmountField from './AmountField/AmountField';
import { buildAssignmentOptions } from './AssignmentPicker/assignmentOptions';
import AssignmentPicker from './AssignmentPicker/AssignmentPicker';
import CategoryGrid from './CategoryGrid/CategoryGrid';
import { buildCategoryGrid } from './CategoryGrid/categoryLayout';
import DetailsCard from './DetailsCard/DetailsCard';
import { forecastLimit } from './LimitHint/limitForecast';
import LimitHint from './LimitHint/LimitHint';
import TypeToggle from './TypeToggle/TypeToggle';

import createStyles from './style';

interface Props {
  flow: TransactionFlow & { draft: TransactionDraft };
  onSave: () => void;
  onBack: () => void;
  onOpenCategories: () => void;
  onOpenDate: () => void;
  onCreateCategory: () => void;
  onDelete: () => void;
  onRetryDelete: () => void;
}

const TransactionEditor = ({
  flow,
  onSave,
  onBack,
  onOpenCategories,
  onOpenDate,
  onCreateCategory,
  onDelete,
  onRetryDelete,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const fieldReveal = useFieldRevealScroll(scrollRef);
  const [isScrolled, setScrolled] = useState(false);
  const [isLoadingLatest, setLoadingLatest] = useState(false);
  const [hasLatestFailed, setLatestFailed] = useState(false);
  // The category a type change cleared, named until another is picked in the same draft.
  const [cleared, setCleared] = useState<{ draftId: number; name: string; typeWord: string } | null>(null);
  const spaceArg = useSpaceArg();
  const membersQuery = useGetMembersQuery(spaceArg);
  const { currentData: members } = membersQuery;
  const membersLoad = listLoad(membersQuery);
  const { currentData: profile } = useGetProfileQuery();
  const categoriesQuery = useGetCategoriesQuery(spaceArg);
  const { currentData: allCategories } = categoriesQuery;
  const categoriesLoad = listLoad(categoriesQuery);
  const { currentData: limits } = useGetLimitsQuery(spaceArg);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const { draft, saved, isSaving } = flow;
  const isEdit = saved !== null;
  const isDeleting = useAppSelector((state) => !!saved && selectIsDeleting(state, saved.id));
  const isIncome = draft.transactionType === TransactionType.INCOME;
  const typeColor = isIncome ? colors.ok : colors.danger;
  const now = new Date();

  const { incomes, expenses } = useMemo(() => getActiveCategories(allCategories), [allCategories]);
  const activeOf = (type: TransactionType) => (type === TransactionType.INCOME ? incomes : expenses);
  // Only the record's own archived category is offered, and only for its type.
  const archived = saved?.category.isArchived ? saved.category : null;
  const ownArchived = archived?.transactionType === draft.transactionType ? archived : null;

  const fitsType = (categoryId: number | null, type: TransactionType) =>
    categoryId !== null &&
    (activeOf(type).some(({ id }) => id === categoryId) ||
      (archived?.id === categoryId && archived.transactionType === type));

  const grid = buildCategoryGrid({
    active: activeOf(draft.transactionType),
    archived: ownArchived,
    promotedId: flow.promotedCategoryId,
  });

  const change = (patch: Parameters<typeof draftChanged>[0]) => dispatch(draftChanged(patch));

  // A category of the other type cannot stay picked; amount, date, note and assignment stay as they are.
  const changeType = (transactionType: TransactionType) => {
    if (transactionType === draft.transactionType) return;

    const isCleared = draft.categoryId !== null && !fitsType(draft.categoryId, transactionType);
    const name = [...activeOf(draft.transactionType), ...(archived ? [archived] : [])].find(
      ({ id }) => id === draft.categoryId,
    )?.name;

    if (isCleared && name) setCleared({ draftId: flow.draftId, name, typeWord: isIncome ? 'an income' : 'an expense' });
    change({ transactionType, ...(isCleared && { categoryId: null }) });
  };
  const clearedNote =
    cleared?.draftId === flow.draftId && draft.categoryId === null
      ? `${cleared.name} is ${cleared.typeWord} category, so it was cleared. Amount, date, note and assignment are kept.`
      : undefined;

  const selfId = profile?.id;
  // A new record is dated now, also from an earlier month on Home; the form says which month is behind it.
  const viewed = flow.selection;
  const time = Date.parse(draft.timestamp);
  const dateNote =
    !isEdit && viewed?.origin === 'home' && (time < Date.parse(viewed.from) || time > Date.parse(viewed.to))
      ? `You’re viewing ${new Date(viewed.from).toLocaleString('en-US', { month: 'long' })}`
      : undefined;
  const assignmentOptions = buildAssignmentOptions({
    members,
    self: profile && { id: profile.id, name: profile.name },
    saved: saved?.assignment ?? null,
  });
  const authorNote = saved ? `Created by ${authorLabel(saved.author, selfId)}` : 'You’re the author';
  const assigneeError =
    flow.notice === 'assigneeLeft'
      ? isEdit
        ? `${flow.refusal ?? 'The member you chose'} left this space before your change was saved. Choose another option — your other edits are kept.`
        : `${flow.refusal ?? 'The member you chose'} left this space while you were saving. Choose who this is assigned to — everything else is kept.`
      : undefined;

  const errors = getDraftErrors(draft, {
    baseline: isEdit ? (flow.baseline ?? undefined) : undefined,
    now: now.getTime(),
    available: {
      // The user is a member of the space they are in, whatever an older list says.
      memberIds: members && [...(activeMemberIds(members) ?? []), ...(selfId === undefined ? [] : [selfId])],
      categoryIds: allCategories && [
        ...activeOf(draft.transactionType).map(({ id }) => id),
        ...(ownArchived ? [ownArchived.id] : []),
      ],
    },
  });
  const isChanged = hasUnsavedChanges(flow);
  const hasConflict = flow.notice === 'conflict';
  // A pick is checked against its list, so Save waits for every list a new record or a changed pick needs.
  const changed = isEdit && flow.baseline ? changedFields(draft, flow.baseline) : null;
  const notLoaded = (load: ListLoad, name: string) =>
    load === 'loading' ? `Loading ${name}…` : load === 'failed' ? `Retry loading ${name} to save` : undefined;
  const categoriesNote =
    !changed || changed.includes('categoryId') || changed.includes('transactionType')
      ? notLoaded(categoriesLoad, 'categories')
      : undefined;
  const ready = !hasDraftErrors(errors) && !categoriesNote && (!isEdit || isChanged) && !hasConflict;
  // A typed value that is not an amount, and a date out of range, are explained at their fields; the footer names
  // what is still missing.
  const amountError = draft.amount.trim() ? errors.amount : undefined;
  const missing = [
    amountError ? undefined : errors.amount,
    categoriesNote ?? errors.category,
    errors.assignment,
    errors.description,
  ];
  const helperText = hasConflict ? undefined : isEdit && !isChanged ? 'No changes yet' : missing.find(Boolean);

  const limitForecast = forecastLimit({
    limits,
    original: saved && { ...saved, categoryId: saved.category.id },
    draft,
    now: now.getTime(),
  });

  const loadLatest = async () => {
    setLoadingLatest(true);
    setLatestFailed(false);
    const outcome = await dispatch(loadLatestRecord());
    setLoadingLatest(false);
    setLatestFailed(outcome === 'failed');
  };

  const saveLabel = isEdit
    ? 'Save changes'
    : flow.operationId
      ? 'Retry save'
      : isIncome
        ? 'Save income'
        : 'Save expense';

  return (
    <View style={styles.root}>
      <View style={[styles.header, isScrolled && styles.headerScrolled]}>
        <TouchableOpacity
          style={[styles.headerButton, isSaving && styles.headerButtonLocked]}
          onPress={onBack}
          disabled={isSaving}
          activeOpacity={0.6}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? 'Back to details' : 'Back'}
        >
          <Icon name="back" size={16} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
          {isEdit ? 'Edit transaction' : 'New transaction'}
        </Text>
      </View>

      <View style={[styles.fields, isSaving && styles.fieldsLocked]} pointerEvents={isSaving ? 'none' : 'auto'}>
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(event) => {
            fieldReveal.onScroll(event);
            setScrolled(event.nativeEvent.contentOffset.y > 0);
          }}
          onLayout={fieldReveal.onLayout}
        >
          <FieldRevealProvider value={fieldReveal.value}>
            <TypeToggle value={draft.transactionType} onChange={changeType} />

            <AmountField
              value={draft.amount}
              onChange={(amount) => change({ amount })}
              autoFocus={flow.view.name === 'create' && flow.view.focusAmount}
              typeColor={typeColor}
              isIncome={isIncome}
              currencyCode={currencyCode}
              error={amountError}
            />

            <View style={styles.categoryBlock}>
              {clearedNote && (
                <View style={styles.clearedNote}>
                  <Icon name="info" size={14} color={colors.warnText} strokeWidth={2} />
                  <Text style={styles.clearedNoteText}>{clearedNote}</Text>
                </View>
              )}

              <CategoryGrid
                load={categoriesLoad}
                tiles={grid.tiles}
                hasMore={grid.hasMore}
                selectedId={draft.categoryId}
                archived={ownArchived}
                typeColor={typeColor}
                typeWord={isIncome ? 'income' : 'expense'}
                onSelect={(categoryId) => {
                  // The number pad has no Return: picking a category is how the amount is done with.
                  Keyboard.dismiss();
                  change({ categoryId });
                }}
                onMore={onOpenCategories}
                onCreate={onCreateCategory}
                onRetry={categoriesQuery.refetch}
              />

              {limitForecast && <LimitHint forecast={limitForecast} currencyCode={currencyCode} />}
            </View>

            <AssignmentPicker
              key={flow.draftId}
              load={membersLoad}
              options={assignmentOptions}
              selected={draft.assignment}
              authorNote={authorNote}
              error={assigneeError}
              selfId={selfId}
              typeColor={typeColor}
              onSelect={(assignment) => change({ assignment })}
              onRetry={membersQuery.refetch}
            />

            <DetailsCard
              timestamp={draft.timestamp}
              dateNote={dateNote}
              dateError={errors.timestamp}
              description={draft.description}
              descriptionError={errors.description}
              onOpenDate={onOpenDate}
              onChangeDescription={(description) => change({ description })}
            />

            {isEdit && (
              <DeleteButton isOutlined isDeleting={isDeleting} disabled={isSaving || hasConflict} onPress={onDelete} />
            )}
          </FieldRevealProvider>
        </ScrollView>
      </View>

      <ActionRow
        label={saveLabel}
        helperText={helperText}
        ready={ready}
        isSaving={isSaving && !isDeleting}
        isAboveKeyboard={keyboardHeight > 0}
        banner={
          hasConflict ? (
            <Banner
              tone="warn"
              title="This transaction was changed"
              text={
                hasLatestFailed
                  ? 'Couldn’t load the latest version. Check your connection and try again; your edits are still here.'
                  : 'Someone saved it after you opened it. Your edits are still here; loading the latest version replaces them.'
              }
              actionLabel="Load latest"
              isBusy={isLoadingLatest}
              onAction={loadLatest}
            />
          ) : flow.notice === 'saveUnknown' ? (
            <Banner
              tone="warn"
              title="Not confirmed yet"
              text="The server didn’t answer, so it may already be saved. Trying again never saves it twice."
              actionLabel="Try again"
              onAction={onSave}
            />
          ) : flow.notice === 'saveRecovered' ? (
            <Banner
              tone="warn"
              title="Your earlier save went through"
              text={
                isChanged
                  ? 'The form now edits that saved transaction. Changes made after it aren’t saved yet: review them and save again.'
                  : 'It was saved as shown here; nothing else is waiting to be saved.'
              }
            />
          ) : flow.notice === 'saveRestored' ? (
            <Banner
              tone="warn"
              title="This transaction wasn’t saved"
              text="We restored your draft. Check it and retry: it’s sent under its original operation, so it can’t be added twice."
            />
          ) : flow.notice === 'saveRefused' ? (
            <Banner tone="danger" title="The server refused this save" text={flow.refusal ?? ''} />
          ) : flow.notice === 'saveNotSent' ? (
            <Banner
              tone="danger"
              title="Not saved"
              text="It couldn’t be stored on this device first, so nothing was sent."
              actionLabel="Try again"
              onAction={onSave}
            />
          ) : flow.notice === 'saveExpired' ? (
            <Banner
              tone="danger"
              title="Not saved"
              text="The server never got it, and a day has passed. Send it now to add it as new."
              actionLabel="Send now"
              onAction={onSave}
            />
          ) : (
            (flow.notice === 'deleteFailed' || flow.notice === 'deleteUncertain') && (
              <Banner
                tone="danger"
                text={deleteFailureText(flow.notice, 'delete')}
                actionLabel={deleteFailureAction(flow.notice)}
                onAction={onRetryDelete}
              />
            )
          )
        }
        onPress={onSave}
      />
    </View>
  );
};

export default TransactionEditor;
