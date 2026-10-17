import { Text, View } from 'react-native';

import { PeriodBar } from '@components';
import { useThemedStyles } from '@hooks';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpace } from '@redux/state/space/selectors';
import type { Period, PeriodUnit } from '@shared/utils';

import createStyles from './style';

interface Props {
  period: Period;
  onPresetPress: (unit: PeriodUnit) => void;
  onOpenPicker: () => void;
  onReset: () => void;
}

const StatsHeader = ({ period, onPresetPress, onOpenPicker, onReset }: Props) => {
  const styles = useThemedStyles(createStyles);
  const space = useAppSelector(selectCurrentSpace);

  return (
    <View style={styles.root}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Stats</Text>

        {space && (
          <Text style={styles.space} numberOfLines={1}>
            {`${space.name} · ${space.currency.code}`}
          </Text>
        )}
      </View>

      <PeriodBar period={period} onPresetPress={onPresetPress} onOpenPicker={onOpenPicker} onReset={onReset} />
    </View>
  );
};

export default StatsHeader;
