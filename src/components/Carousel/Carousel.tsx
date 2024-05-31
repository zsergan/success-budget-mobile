import type { ReactNode } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';

import theme from '@shared/theme';

import styles from './style';

interface Props<T> {
  itemsLength: number;
  items: T[];
  renderItem: (item: T, itemWidth: number) => ReactNode;
  itemScale: number;
  onScrollEnd?: (index: number) => void;
}

const Carousel = <T,>({ itemsLength, items, renderItem, itemScale, onScrollEnd }: Props<T>) => {
  const screenPadding = theme.spacing.xl;
  const { width: screenWidth } = Dimensions.get('window');
  const itemWidth =
    itemsLength > 1 ? Math.round((screenWidth - 2 * screenPadding) * itemScale) : screenWidth - 2 * screenPadding;

  return (
    <View style={styles.scroll}>
      <ScrollView
        snapToOffsets={items.map((_, index) => index * (itemWidth + screenPadding) - screenPadding)}
        snapToEnd={false}
        snapToStart={false}
        decelerationRate="fast"
        disableIntervalMomentum={true}
        horizontal
        scrollEnabled={itemsLength > 1}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const scrollPosition = event.nativeEvent.contentOffset.x;
          const index = Math.round(scrollPosition / (itemWidth + screenPadding));

          onScrollEnd?.(index);
        }}
      >
        <View style={styles.scrollContainer}>{items.map((item: T) => renderItem(item, itemWidth))}</View>
      </ScrollView>
    </View>
  );
};

export default Carousel;
