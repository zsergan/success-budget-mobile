import { Text, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';
import { formatCurrencyAmount, hexToRgba } from '@shared/utils';
import type { LimitForecast } from './limitForecast';

import styles from './style';

const money = (cents: number, currencyCode?: string) => formatCurrencyAmount(cents / 100, currencyCode);

// A new share says what is left or how far over it goes; a share the record already had shows the move it makes.
const describe = ({ label, level, capCents, spentCents, expectedCents, replacesOwn }: LimitForecast, code?: string) => {
  if (replacesOwn) {
    return `${label}: ${money(spentCents, code)} → ${money(expectedCents, code)} of ${money(capCents, code)}`;
  }

  return level === 'over'
    ? `${label}: ${money(expectedCents - capCents, code)} over the ${money(capCents, code)} limit`
    : `${label}: ${money(capCents - expectedCents, code)} left of ${money(capCents, code)} after this`;
};

interface Props {
  forecast: LimitForecast;
  currencyCode?: string;
}

// A warning only: Save stays available whatever it says.
const LimitHint = ({ forecast, currencyCode }: Props) => {
  const isOver = forecast.level === 'over';
  const tone = isOver ? colors.danger : colors.warn;

  return (
    <View style={[styles.root, { backgroundColor: hexToRgba(tone, isOver ? 0.1 : 0.16) }]} accessibilityRole="alert">
      <Icon name="limit" size={14} color={tone} strokeWidth={2.1} />
      <Text style={styles.text} numberOfLines={2}>
        {describe(forecast, currencyCode)}
      </Text>
    </View>
  );
};

export default LimitHint;
