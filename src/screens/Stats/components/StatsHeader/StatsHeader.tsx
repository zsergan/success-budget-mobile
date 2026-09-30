import { Text, View } from 'react-native';

import type { PeriodBarPreset } from '@components';
import { PeriodBar } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpace } from '@redux/state/space/selectors';
import type { DateRange } from '@shared/utils';

import styles from './style';

interface Props {
  range: DateRange;
  onPresetPress: (preset: PeriodBarPreset) => void;
  onOpenPicker: () => void;
  onReset: () => void;
}

const StatsHeader = ({ range, onPresetPress, onOpenPicker, onReset }: Props) => {
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

      <PeriodBar range={range} onPresetPress={onPresetPress} onOpenPicker={onOpenPicker} onReset={onReset} />
    </View>
  );
};

export default StatsHeader;
