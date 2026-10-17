import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { useThemedStyles } from '@hooks';
import { APP_FONTS } from '@shared/fonts';

import DonutChart from './components/DonutChart/DonutChart';
import TrendChart from './components/TrendChart/TrendChart';
import { DONUT_SCENARIOS, TREND_SCENARIOS } from './fixtures';
import createStyles from './style';

const formatUsd = (value: number) =>
  `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ChipsProps {
  titles: string[];
  active: number;
  onChange: (index: number) => void;
}

const Chips = ({ titles, active, onChange }: ChipsProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.chips}>
      {titles.map((title, k) => (
        <Pressable key={title} style={[styles.chip, k === active && styles.chipActive]} onPress={() => onChange(k)}>
          <Text style={[styles.chipText, k === active && styles.chipTextActive]}>{title}</Text>
        </Pressable>
      ))}
    </View>
  );
};

const ChartsPrototypeScreen = () => {
  const styles = useThemedStyles(createStyles);
  useFonts(APP_FONTS);
  const [trendScenario, setTrendScenario] = useState(0);
  const [donutScenario, setDonutScenario] = useState(0);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  const clearSelection = () => {
    setSelectedColumn(null);
    setSelectedSegment(null);
  };

  const trend = TREND_SCENARIOS[trendScenario];
  const donut = DONUT_SCENARIOS[donutScenario];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.content} onPress={clearSelection} testID="prototype-backdrop">
          <Text style={styles.title}>Charts prototype</Text>

          <Chips
            titles={TREND_SCENARIOS.map((s) => s.title)}
            active={trendScenario}
            onChange={(k) => {
              setTrendScenario(k);
              setSelectedColumn(null);
            }}
          />
          <View style={styles.card}>
            <TrendChart
              key={trendScenario}
              groups={trend.groups}
              selectedIndex={selectedColumn}
              onSelect={(index) => {
                setSelectedColumn(index);
                setSelectedSegment(null);
              }}
              formatAmount={formatUsd}
            />
          </View>

          <Chips
            titles={DONUT_SCENARIOS.map((s) => s.title)}
            active={donutScenario}
            onChange={(k) => {
              setDonutScenario(k);
              setSelectedSegment(null);
            }}
          />
          <View style={styles.card}>
            <DonutChart
              key={donutScenario}
              groups={donut.groups}
              selectedIndex={selectedSegment}
              onSelect={(index) => {
                setSelectedSegment(index);
                setSelectedColumn(null);
              }}
              formatAmount={formatUsd}
            />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChartsPrototypeScreen;
