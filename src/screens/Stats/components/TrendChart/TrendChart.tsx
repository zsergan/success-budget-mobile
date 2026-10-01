import { useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { colors } from '@shared/theme';
import { formatFlow } from '@screens/Stats/format';
import useChartMotion from '@screens/Stats/hooks/useChartMotion';
import { CHART_MAX_FONT_SCALE } from '@screens/Stats/chartText';

import styles, { CHART_HEIGHT, TOOLTIP_WIDTH } from './style';
import type { TrendGroup } from './trendAdapter';
import { BAR_AREA_HEIGHT, PAIR_GAP, getColumnCenter, getTrendGeometry, getTrendMax, toBarData } from './trendAdapter';

interface Props {
  groups: TrendGroup[];
  currency: string;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  // Fires for any touch that starts on the chart, so the screen can tell it from a tap outside.
  onTouchInside?: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

const TrendChart = ({ groups, currency, selectedKey, onSelect, onTouchInside }: Props) => {
  const { isAnimated, duration } = useChartMotion();
  // The live offset of the axis it was read on; state follows it only while a tooltip needs it.
  const liveScrollRef = useRef<{ axis: string; x: number } | null>(null);
  const [width, setWidth] = useState(0);
  const [scroll, setScroll] = useState<{ axis: string; x: number } | null>(null);

  const geometry = getTrendGeometry(groups, width);
  const maxValue = getTrendMax(groups)?.value || 1;
  const barData = toBarData(groups, geometry, maxValue);

  const selectedIndex = groups.findIndex((group) => group.key === selectedKey && !group.isFuture);
  const selected = selectedIndex < 0 ? null : groups[selectedIndex];

  // The axis stays put across refreshes; the bars regrow only when their figures change.
  const axisKey = `${width}:${groups.map((group) => group.key).join(',')}`;
  const dataKey = `${axisKey}:${groups.map((group) => `${group.income}/${group.expense}`).join(',')}`;

  // A scrolling chart opens on the current interval, or the last one that has passed.
  const current = groups.findIndex((group) => group.isCurrent);
  const focus = current >= 0 ? current : groups.findLastIndex((group) => !group.isFuture);
  const initialX = geometry.isScrollable
    ? clamp(getColumnCenter(Math.max(focus, 0), geometry) - width / 2, 0, geometry.contentWidth - width)
    : 0;

  const readScrollX = () => (liveScrollRef.current?.axis === axisKey ? liveScrollRef.current.x : initialX);
  const scrollX = scroll?.axis === axisKey ? scroll.x : initialX;

  const handleLayout = (event: LayoutChangeEvent) => setWidth(Math.round(event.nativeEvent.layout.width));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    liveScrollRef.current = { axis: axisKey, x: event.nativeEvent.contentOffset.x };
    if (selected) setScroll(liveScrollRef.current);
  };

  const handlePress = (group: TrendGroup) => {
    setScroll({ axis: axisKey, x: readScrollX() });
    onSelect(group.isFuture || group.key === selectedKey ? null : group.key);
  };

  const tooltipLeft = selected
    ? clamp(getColumnCenter(selectedIndex, geometry) - scrollX - TOOLTIP_WIDTH / 2, 0, width - TOOLTIP_WIDTH)
    : 0;

  const columnStyle = { width: geometry.columnWidth };
  const rowStyle = { gap: geometry.columnGap };

  return (
    <View style={styles.root} onLayout={handleLayout} onTouchStart={onTouchInside} testID="trend-chart">
      {width > 0 && (
        <>
          <ScrollView
            key={axisKey}
            horizontal
            contentOffset={{ x: initialX, y: 0 }}
            scrollEnabled={geometry.isScrollable}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={[styles.content, { width: geometry.contentWidth }]}>
              <View style={[styles.columns, rowStyle]} pointerEvents="none">
                {groups.map((group, index) => (
                  <View
                    key={group.key}
                    style={[
                      styles.column,
                      columnStyle,
                      index === selectedIndex && styles.columnSelected,
                      selected && index !== selectedIndex && styles.dimmed,
                    ]}
                  >
                    <View style={styles.barArea}>
                      {group.isZero && (
                        <View style={[styles.zeroMark, { width: geometry.barWidth * 2 + PAIR_GAP + 2 }]} />
                      )}
                    </View>
                    <Text
                      maxFontSizeMultiplier={CHART_MAX_FONT_SCALE}
                      style={[styles.label, group.isCurrent && styles.labelCurrent, group.isFuture && styles.future]}
                      numberOfLines={1}
                    >
                      {group.label}
                    </Text>
                    <Text
                      maxFontSizeMultiplier={CHART_MAX_FONT_SCALE}
                      style={[styles.sub, group.isFuture && styles.future]}
                      numberOfLines={1}
                    >
                      {group.sub}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.bars} pointerEvents="none">
                <BarChart
                  key={dataKey}
                  data={barData}
                  width={geometry.contentWidth}
                  parentWidth={geometry.contentWidth}
                  height={BAR_AREA_HEIGHT}
                  maxValue={maxValue}
                  noOfSections={1}
                  barWidth={geometry.barWidth}
                  initialSpacing={geometry.inset}
                  endSpacing={0}
                  minHeight={0}
                  barBorderTopLeftRadius={3}
                  barBorderTopRightRadius={3}
                  barBorderBottomLeftRadius={1}
                  barBorderBottomRightRadius={1}
                  highlightEnabled
                  highlightedBarIndex={selected ? [selectedIndex * 2, selectedIndex * 2 + 1] : -1}
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
                  isAnimated={isAnimated}
                  animationDuration={duration}
                />
              </View>

              <View style={[styles.columns, rowStyle]}>
                {groups.map((group, index) => (
                  <Pressable
                    key={group.key}
                    style={[styles.hitArea, columnStyle, { height: CHART_HEIGHT }]}
                    onPress={() => handlePress(group)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: index === selectedIndex, disabled: group.isFuture }}
                    accessibilityLabel={
                      group.isFuture
                        ? `${group.dates}, not started`
                        : `${group.dates}, income ${formatFlow(group.income, currency, 'income')}, expense ${formatFlow(group.expense, currency, 'expense')}`
                    }
                    testID={`trend-group-${group.key}`}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {selected && (
            <View style={[styles.tooltip, { left: tooltipLeft }]} pointerEvents="none" testID="trend-tooltip">
              <Text maxFontSizeMultiplier={CHART_MAX_FONT_SCALE} style={styles.tooltipTitle}>
                {selected.dates}
              </Text>
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipSwatch, { backgroundColor: colors.ok }]} />
                <Text maxFontSizeMultiplier={CHART_MAX_FONT_SCALE} style={styles.tooltipLabel} numberOfLines={1}>
                  Income
                </Text>
                <Text maxFontSizeMultiplier={CHART_MAX_FONT_SCALE} style={styles.tooltipValue}>
                  {formatFlow(selected.income, currency, 'income')}
                </Text>
              </View>
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipSwatch, { backgroundColor: colors.danger }]} />
                <Text maxFontSizeMultiplier={CHART_MAX_FONT_SCALE} style={styles.tooltipLabel} numberOfLines={1}>
                  Expense
                </Text>
                <Text maxFontSizeMultiplier={CHART_MAX_FONT_SCALE} style={styles.tooltipValue}>
                  {formatFlow(selected.expense, currency, 'expense')}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default TrendChart;
