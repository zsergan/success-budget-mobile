import { FlatList, Text, View } from 'react-native';

import Card from '@components/Card';

import styles from './style';

const cardChildrenExamples = ['Test1', 'Test2', 'Test3', 'Test4', 'Test5', 'Test6', 'Test7'];

const HomeScreen = () => {
  return (
    <View>
      <FlatList
        data={cardChildrenExamples}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Card customStyle={styles.item}>
            <Text>{item}</Text>
          </Card>
        )}
      />
    </View>
  );
};

export default HomeScreen;
