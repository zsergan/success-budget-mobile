import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssignmentAvatar, BottomSheetModal as BottomModal, Icon } from '@components';
import { useSheetPresence, useTheme, useThemedStyles } from '@hooks';
import type { FilterOption } from '@screens/Transactions/historyFilterOptions';
import theme from '@shared/theme';

import createStyles from './style';

export interface FilterSheetContent<Value> {
  title: string;
  description?: string;
  options: FilterOption<Value>[];
  selected: Value | undefined;
  onSelect: (value: Value | undefined) => void;
}

interface Props<Value> {
  // Null hides it.
  content: FilterSheetContent<Value> | null;
  selfId?: number;
  // A swipe or the backdrop closed it.
  onClose: () => void;
}

// One choice of how History is narrowed; picking a row applies it and closes the sheet.
const FilterSheet = <Value,>({ content, selfId, onClose }: Props<Value>) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { ref, settleDismiss } = useSheetPresence(content !== null);
  // What it showed stays in it while it closes.
  const [last, setLast] = useState(content);
  if (content && content !== last) setLast(content);
  const shown = content ?? last;

  return (
    <BottomModal
      ref={ref}
      fitContent
      onDismiss={() => {
        if (settleDismiss()) onClose();
      }}
    >
      {shown && (
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xl + insets.bottom }}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {shown.title}
            </Text>
            {shown.description && <Text style={styles.description}>{shown.description}</Text>}
          </View>

          {shown.options.map((option) => {
            const isSelected = option.value === shown.selected;

            return (
              <View key={option.key}>
                {option.section && <Text style={styles.section}>{option.section}</Text>}

                <TouchableOpacity
                  style={styles.row}
                  onPress={() => shown.onSelect(option.value)}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  {option.subject ? (
                    <AssignmentAvatar subject={option.subject} selfId={selfId} size={32} />
                  ) : (
                    <View style={styles.iconBox}>
                      <Icon name="list" size={16} color={colors.text} strokeWidth={2} />
                    </View>
                  )}

                  <View style={styles.texts}>
                    <Text style={styles.label} numberOfLines={2}>
                      {option.label}
                    </Text>
                    {option.sub && <Text style={styles.sub}>{option.sub}</Text>}
                  </View>

                  {isSelected && <Icon name="check" size={16} color={colors.text} strokeWidth={2.4} />}
                </TouchableOpacity>
              </View>
            );
          })}
        </BottomSheetScrollView>
      )}
    </BottomModal>
  );
};

export default FilterSheet;
