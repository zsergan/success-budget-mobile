import { View } from 'react-native';

import { EmptyState } from '@components';
import type { CategorySegment } from '../../hooks/useCategoryList';

import styles from './style';

interface Props {
  segment: CategorySegment;
  isSearching: boolean;
}

const CategoriesEmptyState = ({ segment, isSearching }: Props) => (
  <View style={styles.container}>
    {segment === 'archived' ? (
      <EmptyState
        icon="trash"
        title="Nothing archived"
        description="Delete a category that already has transactions and it lands here instead of disappearing. History stays intact, and you can bring it back with one tap."
      />
    ) : (
      <EmptyState
        icon="search"
        title={isSearching ? 'No matches' : 'No categories yet'}
        description={isSearching ? 'Try a different search term.' : 'Add your first category to get started.'}
      />
    )}
  </View>
);

export default CategoriesEmptyState;
