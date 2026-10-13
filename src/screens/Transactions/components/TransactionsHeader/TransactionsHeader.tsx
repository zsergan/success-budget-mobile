import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles, { BUTTON_SIZE, CANCEL_GAP, FIELD_ICON_LEFT, ICON_SIZE } from './style';

export const SEARCH_MOTION_MS = 220;

// A part faded out stays laid out for the motion, so screen readers are told to skip it.
const hiddenWhen = (isHidden: boolean) => ({
  accessibilityElementsHidden: isHidden,
  importantForAccessibility: isHidden ? ('no-hide-descendants' as const) : ('auto' as const),
});

interface Props {
  // Hidden while a Stats filter is shown: search starts from the plain history.
  canSearch: boolean;
  isSearching: boolean;
  query: string;
  // Why the text is not searched for, shown under the field.
  error?: string | null;
  onOpen: () => void;
  onCancel: () => void;
  onChangeQuery: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

const TransactionsHeader = ({
  canSearch,
  isSearching,
  query,
  error = null,
  onOpen,
  onCancel,
  onChangeQuery,
  onSubmit,
  onClear,
}: Props) => {
  const isReduced = useReducedMotion();
  const inputRef = useRef<TextInput>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const [cancelWidth, setCancelWidth] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const progress = useSharedValue(isSearching ? 1 : 0);

  // The keyboard starts with the field, so both arrive together; it leaves as the field folds back.
  useEffect(() => {
    if (isSearching) inputRef.current?.focus();
    else inputRef.current?.blur();

    progress.value = withTiming(isSearching ? 1 : 0, {
      duration: isReduced ? 0 : SEARCH_MOTION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [isSearching, isReduced, progress]);

  // A cleared search, from the field or from the empty list, is typed again at once.
  const isCleared = isSearching && query === '';
  useEffect(() => {
    if (isCleared) inputRef.current?.focus();
  }, [isCleared]);

  const fieldBorder = error ? colors.danger : isFocused ? colors.accent : colors.hairline;

  // The search button's background grows into the field: its right edge makes room for Cancel, its left edge
  // reaches the start of the row, and the magnifier rides along at the field's start.
  const fieldStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [Math.max(rowWidth - BUTTON_SIZE, 0), 0]),
    right: interpolate(progress.value, [0, 1], [0, cancelWidth + CANCEL_GAP]),
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.track, colors.surface]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.track, fieldBorder]),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [(BUTTON_SIZE - ICON_SIZE) / 2, FIELD_ICON_LEFT]),
  }));
  const fadeOutStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const fadeInStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View style={styles.header}>
      <View style={styles.row} onLayout={(event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width)}>
        <Animated.Text style={[styles.title, fadeOutStyle]} pointerEvents="none" {...hiddenWhen(isSearching)}>
          Transactions
        </Animated.Text>

        {canSearch && (
          // Unmeasured, the button would span the whole row for a frame.
          <Animated.View style={[styles.field, fieldStyle, rowWidth === 0 && styles.unmeasured]}>
            <TouchableOpacity
              style={styles.fieldPress}
              onPress={isSearching ? () => inputRef.current?.focus() : onOpen}
              activeOpacity={isSearching ? 1 : 0.7}
              accessibilityRole={isSearching ? undefined : 'button'}
              accessibilityLabel={isSearching ? undefined : 'Search transactions'}
            >
              <Animated.View style={[styles.icon, iconStyle]}>
                <Animated.View style={[styles.iconLayer, fadeOutStyle]}>
                  <Icon name="search" size={ICON_SIZE} color={colors.text} strokeWidth={1.8} />
                </Animated.View>
                <Animated.View style={[styles.iconLayer, fadeInStyle]}>
                  <Icon name="search" size={ICON_SIZE} color={colors.muted} strokeWidth={1.8} />
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>

            <Animated.View
              style={[styles.inputBox, fadeInStyle]}
              pointerEvents={isSearching ? 'auto' : 'none'}
              {...hiddenWhen(!isSearching)}
            >
              <TextInput
                ref={inputRef}
                // The placeholder is set in Medium and typed text in SemiBold; a TextInput has one font for both.
                style={[styles.input, query === '' && styles.inputEmpty]}
                value={query}
                onChangeText={onChangeQuery}
                onSubmitEditing={onSubmit}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Description, category, wallet"
                placeholderTextColor={colors.muted}
                selectionColor={colors.accent}
                returnKeyType="search"
                autoCorrect={false}
                editable={isSearching}
                accessibilityLabel="Search transactions"
              />

              {query.length > 0 && (
                <TouchableOpacity
                  style={styles.clear}
                  onPress={onClear}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Icon name="close" size={10} color={colors.muted} strokeWidth={2.6} />
                </TouchableOpacity>
              )}
            </Animated.View>
          </Animated.View>
        )}

        <Animated.View
          style={[styles.cancel, fadeInStyle]}
          pointerEvents={isSearching ? 'auto' : 'none'}
          {...hiddenWhen(!isSearching)}
        >
          <TouchableOpacity
            onPress={onCancel}
            hitSlop={10}
            accessibilityRole="button"
            onLayout={(event: LayoutChangeEvent) => setCancelWidth(event.nativeEvent.layout.width)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {isSearching && error && (
        <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
};

export default TransactionsHeader;
