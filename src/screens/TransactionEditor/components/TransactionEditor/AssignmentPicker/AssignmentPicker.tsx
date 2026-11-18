import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import AssignmentAvatar from '@components/AssignmentAvatar/AssignmentAvatar';
import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { DraftAssignment } from '@redux/state/transactionFlow/draft';
import { isSameAssignment } from '@redux/state/transactionFlow/draft';
import { hexToRgba } from '@shared/utils';
import type { ListLoad } from '../../SectionLoad/SectionLoad';
import type { AssignmentOption } from './assignmentOptions';
import { visibleOptions } from './assignmentOptions';

import createStyles from './style';

// Past this a label may be cut short in its chip, so the pick is spelled out under the chips.
const LONG_LABEL = 18;

const NOTES: Partial<Record<DraftAssignment['kind'], string>> = {
  space: 'Counts once in the space total. Not included in anyone’s personal amount.',
  unassigned: 'Counted in the space total, shown apart from Whole space.',
};

interface Props {
  load: ListLoad;
  options: AssignmentOption[];
  selected: DraftAssignment | null;
  // Who the record is by: "You’re the author", or its saved author in an edit.
  authorNote: string;
  // The server refused a member who had left; the draft waits for a new pick.
  error?: string;
  selfId?: number;
  typeColor: string;
  onSelect: (assignment: DraftAssignment) => void;
  onRetry: () => void;
}

const AssignmentPicker = ({
  load,
  options,
  selected,
  authorNote,
  error,
  selfId,
  typeColor,
  onSelect,
  onRetry,
}: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const [isExpanded, setExpanded] = useState(false);
  const [isOpened, setOpened] = useState(false);
  const picked = options.find(({ value }) => isSameAssignment(value, selected));
  const people = options.filter(({ isPerson }) => isPerson);
  // With nobody else in the space, the user's own pick stays one row until they ask for the other two values.
  const isCompact = !isOpened && load === 'ready' && people.length === 1 && picked === people[0] && !picked.isGone;
  const { shown, hidden } = visibleOptions(options, selected, isExpanded);
  const selectedStyle = { backgroundColor: hexToRgba(typeColor, 0.09), borderColor: typeColor };

  const note = picked?.isGone
    ? picked.value.kind === 'member' && picked.value.userId === null
      ? 'This member’s account was deleted. You can keep this assignment or choose someone else.'
      : `${picked.label} left this space. You can keep this assignment or choose someone else.`
    : selected && NOTES[selected.kind];
  const spelledOut = picked && (picked.detail || picked.label.length > LONG_LABEL) ? picked.fullName : undefined;

  const chip = (option: AssignmentOption) => {
    const isSelected = option === picked;

    return (
      <TouchableOpacity
        key={option.key}
        style={[styles.chip, option.isGone && styles.chipGone, isSelected && selectedStyle]}
        onPress={() => onSelect(option.value)}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={option.fullName}
        accessibilityState={{ selected: isSelected }}
      >
        <AssignmentAvatar subject={option.subject} selfId={selfId} size={22} />

        <View style={styles.chipTexts}>
          <Text style={[styles.chipText, option.isGone && !isSelected && styles.mutedText]} numberOfLines={1}>
            {option.label}
          </Text>
          {option.detail && (
            <Text style={styles.chipDetail} numberOfLines={1}>
              {option.detail}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const chips = (
    <View style={styles.chips}>
      {shown.map(chip)}

      {load === 'loading' && (
        <View style={styles.ghostRow} accessibilityLabel="Loading members">
          <View style={[styles.ghostChip, { width: 84 }]} />
          <View style={[styles.ghostChip, { width: 72 }]} />
        </View>
      )}

      {hidden > 0 && (
        <TouchableOpacity
          style={[styles.chip, styles.moreChip]}
          onPress={() => setExpanded(true)}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`Show ${hidden} more people`}
        >
          <Icon name="chevron-down" size={13} color={colors.muted} strokeWidth={2.2} />
          <Text style={[styles.chipText, styles.mutedText]}>{`${hidden} more`}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.label}>Assigned to</Text>
        <Text style={styles.author} numberOfLines={1}>
          {authorNote}
        </Text>
      </View>

      {isCompact && picked ? (
        <TouchableOpacity
          style={[styles.compact, selectedStyle]}
          onPress={() => setOpened(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${picked.fullName}. Assign to Whole space or No member assigned instead`}
        >
          <AssignmentAvatar subject={picked.subject} selfId={selfId} size={30} />

          <View style={styles.compactTexts}>
            <Text style={styles.chipText}>{picked.label}</Text>
            <Text style={styles.compactHint}>Tap to assign to Whole space or No member assigned</Text>
          </View>

          <Icon name="chevron-down" size={14} color={colors.muted} strokeWidth={2.2} />
        </TouchableOpacity>
      ) : isExpanded ? (
        // Every member is reachable, inside a bounded box rather than an ever longer form.
        <ScrollView style={styles.expanded} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {chips}
        </ScrollView>
      ) : (
        chips
      )}

      {load === 'failed' && (
        <View style={styles.loadError}>
          <Text style={styles.loadErrorText}>Members didn’t load. You can still save with the current choice.</Text>

          <TouchableOpacity
            onPress={onRetry}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retry loading members"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {error ? (
        <View style={styles.noteRow}>
          <Icon name="alert" size={14} color={colors.danger} strokeWidth={2.2} />
          <Text style={[styles.note, styles.errorText]}>{error}</Text>
        </View>
      ) : (
        <>
          {spelledOut && <Text style={styles.spelled}>{`Assigned to ${spelledOut}`}</Text>}
          {note && (
            <View style={styles.noteRow}>
              <Icon name="info" size={14} color={colors.muted} strokeWidth={1.9} />
              <Text style={styles.note}>{note}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default AssignmentPicker;
