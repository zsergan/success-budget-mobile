import { Text, View } from 'react-native';

import type { Limit } from '@api/dto';
import { formatNumber } from '@shared/utils';
import CircleIcon from '../CircleIcon/CircleIcon';
import ProgressBar from '../ProgressBar/ProgressBar';
import TinyButton from '../Buttons/TinyButton/TinyButton';

import { colors } from '@shared/theme';
import styles from './style';

interface Props {
  limit: Limit;
  currencyCode: string;
  onEdit?(): void;
}

const LimitItem = ({ limit, currencyCode, onEdit }: Props) => {
  const { category, amount, in_percent, spent } = limit;

  return (
    <View>
      <View style={styles.limit}>
        <View style={styles.section}>
          <CircleIcon
            circleColor={colors.bg}
            size="xl"
            icon={category ? category.icon : 'other'}
            color={category ? category.color : colors.text}
          />

          <Text style={styles.text}>{category ? category.name : 'All others'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>{`${formatNumber(amount)} ${currencyCode}`}</Text>

          {onEdit && <TinyButton icon="edit" onPress={onEdit} />}
        </View>
      </View>

      <ProgressBar
        percentage={in_percent}
        positionInfo="bottom"
        leftInfo={`${formatNumber(spent)} ${currencyCode}`}
        rightInfo={`${in_percent}%`}
      />
    </View>
  );
};

export default LimitItem;
