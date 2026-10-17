import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import type { pieDataItem } from 'react-native-gifted-charts';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import type { BreakdownGroup } from '../../fixtures';
import createStyles, { DONUT_SIZE, INNER_RADIUS, RADIUS, SEGMENT_GAP, SELECTED_GROWTH } from './style';

import { useTheme, useThemedStyles } from '@hooks';

interface Props {
  groups: BreakdownGroup[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  formatAmount: (value: number) => string;
}

const DIMMED_ALPHA = 0.28;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const COVER_RADIUS = (RADIUS + INNER_RADIUS) / 2;
const COVER_LENGTH = 2 * Math.PI * COVER_RADIUS;

const withAlpha = (color: string, alpha: number) => {
  const rgb = color.startsWith('#')
    ? [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)).join(',')
    : color.slice(4, -1);
  return `rgba(${rgb},${alpha})`;
};

const DonutChart = ({ groups, selectedIndex, onSelect, formatAmount }: Props) => {
  const { colors, categories } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const total = groups.reduce((sum, g) => sum + g.amount, 0);
  const selected = selectedIndex === null ? null : groups[selectedIndex];

  // Fresh objects on every selection change: the library flags the focused item by mutating it.
  const data = useMemo<pieDataItem[]>(
    () =>
      groups.map((g, k) => {
        const color = g.color === 'other' ? colors.chartOther : categories[g.color].stroke;
        const isDimmed = selectedIndex !== null && selectedIndex !== k;
        return { value: g.amount, color: isDimmed ? withAlpha(color, DIMMED_ALPHA) : color };
      }),
    [groups, selectedIndex, colors, categories],
  );

  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [groups, reveal]);

  const coverProps = useAnimatedProps(() => ({
    strokeDashoffset: -COVER_LENGTH * reveal.value,
  }));

  return (
    <View style={styles.root}>
      <PieChart
        data={data}
        donut
        radius={RADIUS}
        innerRadius={INNER_RADIUS}
        innerCircleColor={colors.surface}
        strokeColor={colors.surface}
        strokeWidth={SEGMENT_GAP}
        focusOnPress
        toggleFocusOnPress
        focusedPieIndex={selectedIndex ?? -1}
        extraRadius={SELECTED_GROWTH}
        inwardExtraLengthForFocused={SELECTED_GROWTH}
        onPress={(_: pieDataItem, index: number) => onSelect(selectedIndex === index ? null : index)}
      />

      <Svg style={styles.cover} width={DONUT_SIZE} height={DONUT_SIZE} pointerEvents="none">
        <AnimatedCircle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={COVER_RADIUS}
          fill="none"
          stroke={colors.surface}
          strokeWidth={RADIUS - INNER_RADIUS + SELECTED_GROWTH * 2 + 2}
          strokeDasharray={[COVER_LENGTH, COVER_LENGTH]}
          animatedProps={coverProps}
          transform={`rotate(-90 ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerLabel} numberOfLines={1}>
          {selected ? selected.name : 'Spent'}
        </Text>
        <Text style={styles.centerAmount} numberOfLines={1} adjustsFontSizeToFit>
          {formatAmount(selected ? selected.amount : total)}
        </Text>
        <Text style={styles.centerSub}>
          {selected
            ? `${((selected.amount / total) * 100).toFixed(1)}%`
            : `${groups.length} ${groups.length === 1 ? 'category' : 'categories'}`}
        </Text>
      </View>
    </View>
  );
};

export default DonutChart;
