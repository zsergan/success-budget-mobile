import { Text, TouchableOpacity } from 'react-native';

import styles from './style';

interface Props {
  title: string;
  onPress: () => void;
}

// The slop grows the touch target to about 44pt around a single line of text.
const HIT_SLOP = { top: 12, bottom: 12, left: 8, right: 8 };

const TextLink = ({ title, onPress }: Props) => (
  <TouchableOpacity
    style={styles.root}
    onPress={onPress}
    hitSlop={HIT_SLOP}
    activeOpacity={0.6}
    accessibilityRole="button"
  >
    <Text style={styles.title}>{title}</Text>
  </TouchableOpacity>
);

export default TextLink;
