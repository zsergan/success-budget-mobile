import type { StyleProp, ViewStyle } from 'react-native';
import { View, Text } from 'react-native';

import TinyButton from '@components/Buttons/TinyButton/TinyButton';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

export interface AlertAction {
  label: string;
  onPress: () => void;
}

export interface AlertItem {
  id: number;
  message: string;
  // Takes the place of Dismiss, and dismisses too.
  action?: AlertAction;
}

interface Props {
  alertItem: AlertItem;
  dismissAlert?(): void;
  style?: StyleProp<ViewStyle>;
}

const Alert = ({ alertItem: { message, action }, dismissAlert, style }: Props) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.root, style]}>
      <View style={styles.container}>
        <Text style={styles.text}>{message}</Text>

        {action ? (
          <TinyButton
            title={action.label}
            onPress={() => {
              dismissAlert?.();
              action.onPress();
            }}
          />
        ) : (
          dismissAlert && <TinyButton title="Dismiss" onPress={dismissAlert} />
        )}
      </View>
    </View>
  );
};

export default Alert;
