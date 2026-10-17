import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onClose: () => void;
}

const PanelHeader = ({ title, subtitle, onBack, onClose }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.button}
          onPress={onBack}
          activeOpacity={0.6}
          hitSlop={8}
          accessibilityLabel="Back to the form"
        >
          <Icon name="back" size={14} color={colors.text} strokeWidth={2.1} />
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={onClose}
          activeOpacity={0.6}
          hitSlop={8}
          accessibilityLabel="Close"
        >
          <Icon name="close" size={14} color={colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

export default PanelHeader;
