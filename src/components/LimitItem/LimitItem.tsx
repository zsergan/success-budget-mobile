import { Text, TouchableOpacity, View } from 'react-native';

import type { LimitModel } from '@api/models';
import useCategoryAppearance from '@hooks/useCategoryAppearance';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { formatCurrencyAmount, getDailyPace, getDaysLeftInMonth, getLimitStatus, hexToRgba } from '@shared/utils';
import Icon from '../Icon/Icon';
import ProgressBar from '../ProgressBar/ProgressBar';

import createStyles from './style';

interface Props {
  limit: LimitModel;
  currencyCode?: string;
  onPress?(): void;
}

const LimitItem = ({ limit, currencyCode, onPress }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const { name, amount, spent, categories } = limit;
  const amountNumber = Number(amount);
  const status = getLimitStatus(spent, amountNumber);
  const daysLeft = getDaysLeftInMonth();
  const pace = getDailyPace(spent, amountNumber, daysLeft);
  const isGroup = categories.length > 1;

  const statusColor = status.level === 'over' ? colors.danger : status.level === 'near' ? colors.warn : colors.text;
  const barColor = status.level === 'over' ? colors.danger : status.level === 'near' ? colors.warn : colors.ok;
  const appearanceOf = useCategoryAppearance();
  // A limit near or over its cap says so in place of its categories' colours; otherwise each glyph keeps its own.
  const warning = status.level === 'over' ? colors.danger : status.level === 'near' ? colors.warn : null;
  const single = categories.length === 1 ? appearanceOf(categories[0].color) : null;
  const iconBg =
    status.level === 'over'
      ? hexToRgba(colors.danger, 0.1)
      : status.level === 'near'
        ? hexToRgba(colors.warn, 0.13)
        : (single?.tint ?? colors.track);
  const glyphColor = (index: number) => warning ?? appearanceOf(categories[index].color).stroke;

  const displayName = name ?? categories[0]?.name ?? 'Limit';
  const subtitle = isGroup ? categories.map((category) => category.name).join(' · ') : 'Single category';
  const statusText =
    status.level === 'over'
      ? `Over by ${formatCurrencyAmount(spent - amountNumber, currencyCode)}`
      : status.level === 'near'
        ? `${formatCurrencyAmount(amountNumber - spent, currencyCode)} left · ${status.pctActual}%`
        : `${formatCurrencyAmount(amountNumber - spent, currencyCode)} left`;
  const paceText =
    status.level === 'over'
      ? `Day ${new Date().getDate()} of the month`
      : `${formatCurrencyAmount(pace, currencyCode)}/day`;

  return (
    <TouchableOpacity
      style={[styles.card, status.level === 'over' && styles.cardOver]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          {isGroup ? (
            <View style={styles.miniIconGrid}>
              {categories.slice(0, 4).map((category, index) => (
                <View key={category.id} style={styles.miniIconCell}>
                  <Icon name={category.icon} size={14} color={glyphColor(index)} strokeWidth={2.2} />
                </View>
              ))}
            </View>
          ) : (
            <Icon
              name={categories[0]?.icon ?? 'limit'}
              size={20}
              color={categories[0] ? glyphColor(0) : (warning ?? colors.text)}
              strokeWidth={1.7}
            />
          )}
        </View>

        <View style={styles.textBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{displayName}</Text>

            {isGroup && (
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>{`${categories.length} CATS`}</Text>
              </View>
            )}
          </View>

          <Text style={styles.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.amountBlock}>
          <Text style={styles.spent}>{formatCurrencyAmount(spent, currencyCode)}</Text>

          <Text style={styles.cap}>{`of ${formatCurrencyAmount(amountNumber, currencyCode)}`}</Text>
        </View>
      </View>

      <ProgressBar percentage={status.pctClamped} color={barColor} />

      <View style={styles.bottomRow}>
        <View style={styles.statusRow}>
          {status.level !== 'ok' && (
            <Icon name={status.level === 'over' ? 'alert' : 'info'} size={13} color={statusColor} strokeWidth={2} />
          )}

          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        <Text style={styles.paceText}>{paceText}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default LimitItem;
