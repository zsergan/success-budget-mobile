import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import type { barDataItem } from 'react-native-gifted-charts';

import type { TrendGroup } from '../../fixtures';
import createStyles, { BAR_AREA_HEIGHT, MIN_BAR_HEIGHT, PAIR_GAP, TOOLTIP_WIDTH } from './style';

import { useTheme, useThemedStyles } from '@hooks';

interface Props {
  groups: TrendGroup[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  formatAmount: (value: number) => string;
}

const getGeometry = (count: number, width: number) => {
  const barWidth = count <= 7 ? 11 : 5;
  const columnGap = count <= 7 ? 12 : count <= 12 ? 4 : 3;
  const columnWidth = (width - columnGap * (count - 1)) / count;
  const pairWidth = barWidth * 2 + PAIR_GAP;

  return { barWidth, columnGap, columnWidth, pairWidth, inset: (columnWidth - pairWidth) / 2 };
};

const TrendChart = ({ groups, selectedIndex, onSelect, formatAmount }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const [width, setWidth] = useState(0);
  const { barWidth, columnGap, columnWidth, inset } = getGeometry(groups.length, width);

  const maxValue = Math.max(1, ...groups.map((g) => Math.max(g.income ?? 0, g.expense ?? 0)));
  // The library's minHeight also lifts zero bars, so the floor is applied to non-zero values only.
  const visible = (value: number | null) =>
    value ? Math.max(value, (maxValue * MIN_BAR_HEIGHT) / BAR_AREA_HEIGHT) : 0;

  const data: barDataItem[] = groups.flatMap((g) => [
    { value: visible(g.income), frontColor: colors.ok, spacing: PAIR_GAP },
    { value: visible(g.expense), frontColor: colors.danger, spacing: columnGap + inset * 2 },
  ]);

  const handleLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const selected = selectedIndex === null ? null : groups[selectedIndex];
  const tooltipLeft =
    selectedIndex === null
      ? 0
      : Math.min(
          Math.max(selectedIndex * (columnWidth + columnGap) + columnWidth / 2 - TOOLTIP_WIDTH / 2, 0),
          width - TOOLTIP_WIDTH,
        );

  return (
    <View style={styles.root} onLayout={handleLayout} testID="trend-chart">
      {width > 0 && (
        <>
          <View style={[styles.columns, { gap: columnGap }]} pointerEvents="none">
            {groups.map((g, k) => {
              const isFuture = g.income === null && g.expense === null;
              const isZero = !isFuture && !g.income && !g.expense;
              const isDimmed = selectedIndex !== null && selectedIndex !== k;

              return (
                <View
                  key={k}
                  style={[styles.column, selectedIndex === k && styles.columnSelected, isDimmed && styles.dimmed]}
                >
                  <View style={styles.barArea}>
                    {isZero && <View style={[styles.zeroMark, { width: barWidth * 2 + PAIR_GAP + 2 }]} />}
                  </View>
                  <Text style={[styles.label, g.isCurrent && styles.labelCurrent, isFuture && styles.future]}>
                    {g.label}
                  </Text>
                  <Text style={[styles.sub, isFuture && styles.future]} numberOfLines={1}>
                    {g.sub}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.chart} pointerEvents="none">
            <BarChart
              data={data}
              width={width}
              parentWidth={width}
              height={BAR_AREA_HEIGHT}
              maxValue={maxValue}
              noOfSections={1}
              barWidth={barWidth}
              initialSpacing={inset}
              endSpacing={0}
              barBorderTopLeftRadius={3}
              barBorderTopRightRadius={3}
              barBorderBottomLeftRadius={1}
              barBorderBottomRightRadius={1}
              highlightEnabled
              highlightedBarIndex={selectedIndex === null ? -1 : [selectedIndex * 2, selectedIndex * 2 + 1]}
              lowlightOpacity={0.3}
              hideRules
              hideYAxisText
              yAxisLabelWidth={0}
              yAxisThickness={0}
              xAxisThickness={0}
              xAxisLabelsHeight={0}
              labelsExtraHeight={0}
              disableScroll
              disablePress
              isAnimated
              animationDuration={600}
            />
          </View>

          <View style={[styles.columns, { gap: columnGap }]}>
            {groups.map((_, k) => (
              <Pressable
                key={k}
                style={styles.hitArea}
                testID="trend-column"
                onPress={() => onSelect(selectedIndex === k ? null : k)}
                accessibilityRole="button"
              />
            ))}
          </View>

          {selected && (
            <View style={[styles.tooltip, { left: tooltipLeft }]} pointerEvents="none">
              <Text style={styles.tooltipTitle}>{selected.dates}</Text>
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipSwatch, { backgroundColor: colors.ok }]} />
                <Text style={styles.tooltipLabel}>Income</Text>
                <Text style={styles.tooltipValue}>+{formatAmount(selected.income ?? 0)}</Text>
              </View>
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipSwatch, { backgroundColor: colors.danger }]} />
                <Text style={styles.tooltipLabel}>Expense</Text>
                <Text style={styles.tooltipValue}>−{formatAmount(selected.expense ?? 0)}</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default TrendChart;
