import { useEffect } from 'react';
import type { AccessibilityActionEvent, GestureResponderEvent } from 'react-native';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

import type { Money } from '@api/dto';
import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { TransactionType } from '@shared/enums';
import { getBreakdownAppearance } from '@screens/Stats/breakdownAppearance';
import { formatMoney } from '@screens/Stats/format';
import useChartMotion from '@screens/Stats/hooks/useChartMotion';
import type { BreakdownGroup, BreakdownMode } from '@screens/Stats/statsItems';
import { CHART_MAX_FONT_SCALE } from '@screens/Stats/chartText';

import {
  CIRCUMFERENCE,
  DONUT_SIZE,
  RADIUS,
  SELECTED_STROKE,
  STROKE,
  hitTestDonut,
  toDonutSegments,
} from './donutGeometry';
import createStyles from './style';

const DIMMED_OPACITY = 0.28;
const CENTER = DONUT_SIZE / 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// A surface-colored ring that unwinds clockwise over the segments, drawn once per data set.
const Reveal = ({ duration }: { duration: number }) => {
  const { colors } = useTheme().colorTheme;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, [progress, duration]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: -CIRCUMFERENCE * progress.get() }));

  return (
    <AnimatedCircle
      cx={CENTER}
      cy={CENTER}
      r={RADIUS}
      fill="none"
      stroke={colors.surface}
      strokeWidth={SELECTED_STROKE + 4}
      strokeDasharray={[CIRCUMFERENCE, CIRCUMFERENCE]}
      animatedProps={animatedProps}
    />
  );
};

const TYPE_LOOK = {
  [TransactionType.EXPENSE]: { label: 'Spent', subject: 'Expenses', icon: 'expense', tone: 'danger' },
  [TransactionType.INCOME]: { label: 'Income', subject: 'Income', icon: 'income', tone: 'ok' },
} as const;

const countLabel = (count: number, mode: BreakdownMode) =>
  mode === 'wallet'
    ? `${count} ${count === 1 ? 'wallet' : 'wallets'}`
    : `${count} ${count === 1 ? 'category' : 'categories'}`;

interface Props {
  groups: BreakdownGroup[];
  totalAmount: Money;
  sourceCount: number;
  currency: string;
  type: TransactionType;
  mode: BreakdownMode;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  // Fires for any touch that starts on the donut, so the screen can tell it from a tap outside.
  onTouchInside?: () => void;
}

const DonutChart = ({
  groups,
  totalAmount,
  sourceCount,
  currency,
  type,
  mode,
  selectedKey,
  onSelect,
  onTouchInside,
}: Props) => {
  const colorTheme = useTheme().colorTheme;
  const { colors } = colorTheme;
  const styles = useThemedStyles(createStyles);
  const { isAnimated, duration } = useChartMotion();
  const segments = toDonutSegments(groups);
  const selected = groups.find((group) => group.key === selectedKey) ?? null;
  const look = TYPE_LOOK[type];

  const dataKey = `${type}:${mode}:${groups.map((group) => `${group.key}=${group.amount}`).join(',')}`;

  const handlePress = (event: GestureResponderEvent) => {
    const key = hitTestDonut(event.nativeEvent.locationX, event.nativeEvent.locationY, segments);
    onSelect(key === null || key === selectedKey ? null : key);
  };

  const center = !selected
    ? { label: look.label, amount: totalAmount, sub: countLabel(sourceCount, mode) }
    : {
        label: getBreakdownAppearance(selected, colorTheme).name,
        amount: selected.amount,
        sub: `${selected.percent.toFixed(1)}%`,
      };

  // Screen readers step through the segments in order; past either end the selection clears.
  const handleAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) => {
    const keys = segments.map((segment) => segment.key);
    const index = selectedKey === null ? -1 : keys.indexOf(selectedKey);
    const next = nativeEvent.actionName === 'increment' ? index + 1 : (index === -1 ? keys.length : index) - 1;

    onSelect(keys[next] ?? null);
  };

  // The selected segment is drawn last so its wider stroke sits on top of its neighbours.
  const ordered = [...segments].sort((a, b) => Number(a.key === selectedKey) - Number(b.key === selectedKey));

  return (
    <Pressable
      style={styles.root}
      onPress={handlePress}
      onTouchStart={onTouchInside}
      accessibilityRole="adjustable"
      accessibilityLabel={`${look.subject} by ${mode}`}
      accessibilityValue={{ text: `${center.label}, ${formatMoney(center.amount, currency)}, ${center.sub}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
      testID="donut-chart"
    >
      <Svg style={styles.svg} width={DONUT_SIZE} height={DONUT_SIZE} pointerEvents="none">
        <G rotation={-90} origin={`${CENTER}, ${CENTER}`}>
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={colors.track} strokeWidth={STROKE} />

          {ordered.map((segment) => {
            const group = groups.find((item) => item.key === segment.key)!;
            const isSelected = segment.key === selectedKey;

            return (
              <Circle
                key={segment.key}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={getBreakdownAppearance(group, colorTheme).color}
                strokeWidth={isSelected ? SELECTED_STROKE : STROKE}
                strokeDasharray={[segment.visibleLength, CIRCUMFERENCE - segment.visibleLength]}
                strokeDashoffset={-segment.start}
                opacity={selected && !isSelected ? DIMMED_OPACITY : 1}
              />
            );
          })}

          {isAnimated && <Reveal key={dataKey} duration={duration} />}
        </G>
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <View style={styles.centerHead}>
          <Icon name={look.icon} size={10} color={colors[look.tone]} strokeWidth={2.6} />
          <Text maxFontSizeMultiplier={CHART_MAX_FONT_SCALE} style={styles.centerLabel} numberOfLines={1}>
            {center.label}
          </Text>
        </View>
        <Text
          maxFontSizeMultiplier={CHART_MAX_FONT_SCALE}
          style={styles.centerAmount}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatMoney(center.amount, currency)}
        </Text>
        <Text maxFontSizeMultiplier={CHART_MAX_FONT_SCALE} style={styles.centerSub}>
          {center.sub}
        </Text>
      </View>
    </Pressable>
  );
};

export default DonutChart;
