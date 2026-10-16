import { Fragment } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { IconType } from '@shared/types';
import Divider from '@components/Divider/Divider';
import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Option {
  text: string;
  icon?: IconType;
  onPress?: () => void;
  color?: string;
}

const OptionRow = ({ text, icon, onPress, color }: Option) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const shownColor = color ?? colors.text;

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.option}>
        <Text style={[styles.text, { color: shownColor }]}>{text}</Text>

        {icon && <Icon name={icon} size={16} color={shownColor} />}
      </View>
    </TouchableOpacity>
  );
};

export interface ModalOptionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  customOptions?: Option[];
}

const ModalOptions = ({ onEdit, onDelete, customOptions = [] }: ModalOptionsProps) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const options: Option[] = [
    { onPress: onEdit, text: 'Edit', icon: 'edit' },
    ...customOptions,
    { onPress: onDelete, text: 'Delete', icon: 'trash', color: colors.danger },
  ];

  const optionsToRender = options.reduce((acc: Option[], option) => {
    if (option.onPress) {
      acc.push(option);
    }

    return acc;
  }, []);

  return (
    <View style={styles.options}>
      {optionsToRender.map((opt, index) => (
        <Fragment key={index}>
          <OptionRow {...opt} />

          {index !== optionsToRender.length - 1 && (
            <View>
              <Divider style={styles.divider} />
            </View>
          )}
        </Fragment>
      ))}
    </View>
  );
};

export default ModalOptions;
