import { Text, View } from 'react-native';

import BrandMark from '../BrandMark/BrandMark';

import styles from './style';

interface Props {
  layout: 'inline' | 'stacked';
}

const APP_NAME = 'Success Budget';

const BrandLockup = ({ layout }: Props) =>
  layout === 'inline' ? (
    <View style={styles.inline}>
      <BrandMark height={30} />
      <Text style={styles.inlineName}>{APP_NAME}</Text>
    </View>
  ) : (
    <View style={styles.stacked}>
      <BrandMark height={60} />
      <Text style={styles.stackedName}>{APP_NAME}</Text>
      <Text style={styles.tagline}>Personal and shared budgets</Text>
    </View>
  );

export default BrandLockup;
