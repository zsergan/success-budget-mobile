import { Children, Fragment } from 'react';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Divider } from '@components';
import { useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  label?: string;
  children: ReactNode;
}

const SettingsSection = ({ label, children }: Props) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      {label && <Text style={styles.sectionLabel}>{label}</Text>}

      <View style={styles.card}>
        {Children.toArray(children).map((child, index) => (
          <Fragment key={index}>
            {index > 0 && <Divider style={styles.divider} />}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
};

export default SettingsSection;
