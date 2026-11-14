import { useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { useRevealWhileFocused } from '@components/RootLayout/FieldReveal';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { DESCRIPTION_MAX_LENGTH, descriptionLength } from '@redux/state/transactionFlow/draft';
import { formatDateTime } from '../../format';

import createStyles from './style';

interface Props {
  timestamp: string;
  dateError?: string;
  description: string;
  descriptionError?: string;
  onOpenDate: () => void;
  onChangeDescription: (description: string) => void;
}

// The two fields that usually keep their defaults: when it happened, and an optional note.
const DetailsCard = ({
  timestamp,
  dateError,
  description,
  descriptionError,
  onOpenDate,
  onChangeDescription,
}: Props) => {
  const { scheme, colorTheme } = useTheme();
  const { colors } = colorTheme;
  const styles = useThemedStyles(createStyles);
  const descriptionRef = useRef<View>(null);
  const [isFocused, setFocused] = useState(false);
  const counter = `${descriptionLength(description)}/${DESCRIPTION_MAX_LENGTH}`;

  useRevealWhileFocused(descriptionRef, isFocused, description);

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Details</Text>

      <View style={[styles.card, (dateError || descriptionError) && styles.cardError]}>
        <TouchableOpacity style={styles.dateRow} onPress={onOpenDate} activeOpacity={0.6} accessibilityRole="button">
          <Icon name="calendar" size={17} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.rowLabel}>Date</Text>
          <Text style={styles.dateValue} numberOfLines={1}>
            {formatDateTime(timestamp)}
          </Text>
          <Icon name="chevron-right" size={14} color={colors.muted} strokeWidth={2} />
        </TouchableOpacity>

        <View ref={descriptionRef} style={styles.descriptionRow}>
          <View style={styles.descriptionIcon}>
            <Icon name="note" size={17} color={colors.muted} strokeWidth={1.8} />
          </View>

          <TextInput
            keyboardAppearance={scheme}
            style={styles.description}
            value={description}
            onChangeText={onChangeDescription}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Add note (optional)"
            placeholderTextColor={colors.muted}
            multiline
            blurOnSubmit
            returnKeyType="done"
            accessibilityLabel="Description"
          />

          {(isFocused || descriptionError) && (
            <Text style={[styles.counter, descriptionError && styles.counterError]}>{counter}</Text>
          )}
        </View>
      </View>

      {(dateError || descriptionError) && <Text style={styles.error}>{dateError ?? descriptionError}</Text>}
    </View>
  );
};

export default DetailsCard;
