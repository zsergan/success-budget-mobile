import type { StyleProp, ViewStyle } from 'react-native';
import { View, Text } from 'react-native';

import TinyButton from '@components/Buttons/TinyButton/TinyButton';

import styles from './style';

export interface AlertItem {
  id: number;
  message: string;
}

interface Props {
  alertItem: AlertItem;
  dismissAlert?(): void;
  style?: StyleProp<ViewStyle>;
}

const Alert = ({ alertItem: { message }, dismissAlert, style }: Props) => (
  <View style={[styles.root, style]}>
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>

      {dismissAlert && <TinyButton title="Dismiss" onPress={dismissAlert} />}
    </View>
  </View>
);

export default Alert;
