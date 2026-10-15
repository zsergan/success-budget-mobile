import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { useRevealWhileFocused } from '@components/RootLayout/FieldReveal';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

import styles from './style';

interface Props {
  children: ReactNode;
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: IconType;
  trailing?: ReactNode;
  isFocused?: boolean;
  isValid?: boolean;
  disabled?: boolean;
  // Makes the whole box the touch target, for a field that opens a picker instead of taking text.
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

const OutlinedField = ({
  children,
  label,
  error,
  hint,
  iconLeft,
  trailing,
  isFocused,
  isValid,
  disabled,
  onPress,
  containerStyle,
}: Props) => {
  const rootRef = useRef<View>(null);
  useRevealWhileFocused(rootRef, !!isFocused, error ?? hint);

  const boxStyle = [
    styles.box,
    isFocused && styles.boxFocused,
    !!error && styles.boxError,
    disabled && styles.boxDisabled,
  ];

  const content = (
    <>
      {iconLeft && <Icon name={iconLeft} size={18} color={error ? colors.danger : colors.muted} strokeWidth={1.9} />}

      {children}

      {trailing}

      {isValid && !error && <Icon name="check" size={16} color={colors.ok} strokeWidth={2.6} />}
    </>
  );

  return (
    <View ref={rootRef} style={[styles.root, containerStyle]}>
      {label && <Text style={[styles.label, !!error && styles.labelError]}>{label}</Text>}

      {onPress ? (
        <TouchableOpacity
          style={boxStyle}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
        >
          {content}
        </TouchableOpacity>
      ) : (
        <View style={boxStyle}>{content}</View>
      )}

      {error ? (
        <View style={styles.error}>
          <View style={styles.errorIcon}>
            <Icon name="alert" size={13} color={colors.danger} strokeWidth={2.2} />
          </View>

          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        hint && <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
};

export default OutlinedField;
