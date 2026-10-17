import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { useTheme, useThemedStyles } from '@hooks';
import { formatNumber } from '@shared/utils';

import createStyles from './style';

interface Props {
  total: number;
  currencyCode?: string;
  walletsCount: number;
  deltaPercent: number;
  isHidden: boolean;
  onToggleVisibility: () => void;
}

const BalanceOverview = ({ total, currencyCode, walletsCount, deltaPercent, isHidden, onToggleVisibility }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const deltaPositive = deltaPercent > 0;
  const deltaNeutral = deltaPercent === 0;
  const deltaFg = deltaNeutral ? colors.muted : deltaPositive ? colors.ok : colors.danger;
  const deltaBg = deltaNeutral ? colors.track : `${deltaFg}26`;

  return (
    <View style={styles.hero}>
      <View style={styles.heroRow}>
        <View style={styles.heroInfo}>
          <View style={styles.heroLabelRow}>
            <Text style={styles.heroLabel}>Total balance</Text>

            <TouchableOpacity onPress={onToggleVisibility} hitSlop={8}>
              <Icon name={isHidden ? 'eye-off' : 'eye'} size={15} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTotal}>
            {isHidden
              ? `••• •••${currencyCode ? ` ${currencyCode}` : ''}`
              : `${formatNumber(total)}${currencyCode ? ` ${currencyCode}` : ''}`}
          </Text>

          {currencyCode && (
            <Text
              style={styles.heroSub}
            >{`${walletsCount} wallet${walletsCount === 1 ? '' : 's'} · ${currencyCode}`}</Text>
          )}
        </View>

        {currencyCode && (
          <View style={[styles.deltaBadge, { backgroundColor: deltaBg }]}>
            {!deltaNeutral && (
              <Icon name={deltaPositive ? 'trend-up' : 'trend-down'} size={11} color={deltaFg} strokeWidth={2.3} />
            )}

            <Text style={[styles.deltaText, { color: deltaFg }]}>{`${Math.abs(deltaPercent).toFixed(1)}%`}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default BalanceOverview;
