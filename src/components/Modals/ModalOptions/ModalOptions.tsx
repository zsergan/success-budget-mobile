import { Fragment } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { palette } from '@shared/theme';
import type { IconType } from '@shared/types';
import Divider from '../../Divider/Divider';

import styles from './style';

interface Option {
  text: string;
  icon: IconType;
  onPress?: () => void;
  color?: string;
}

const renderOption = ({ text, icon, onPress, color = palette.black }: Option) => (
  <TouchableOpacity onPress={onPress}>
    <View style={styles.option}>
      <Text style={[styles.text, { color }]}>{text}</Text>

      <MaterialIcons name={icon} size={16} color={color} />
    </View>
  </TouchableOpacity>
);

const optionsContent: Record<string, Option> = {
  onEdit: { text: 'Edit', icon: 'edit' },
  onDelete: { text: 'Delete', icon: 'delete', color: palette.red },
};

export interface ModalOptionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

const ModalOptions = ({ onEdit, onDelete }: ModalOptionsProps) => {
  const options = [
    { fn: onEdit, type: 'onEdit' },
    { fn: onDelete, type: 'onDelete' },
  ];

  const optionsToRender = options.reduce((acc: Option[], { fn, type }) => {
    if (fn) {
      acc.push({ ...optionsContent[type], onPress: fn });
    }

    return acc;
  }, []);

  return (
    <View style={styles.options}>
      {optionsToRender.map((opt, index) => (
        <Fragment key={index}>
          {renderOption(opt)}

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
