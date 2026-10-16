import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import type { Space } from '@api/dto';
import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { SpaceType } from '@shared/enums';
import theme from '@shared/theme';

import createStyles from './style';

interface Props {
  spaces: Space[];
  currentSpaceId: number | null;
  onSelect: (spaceId: number) => void;
  onCreateNew: () => void;
}

const spaceMeta = (space: Space) => {
  if (space.type === SpaceType.PERSONAL) return 'Only you';

  const members = `${space.member_count} member${space.member_count === 1 ? '' : 's'}`;

  return space.role === 'owner' ? `${members} · you're the owner` : members;
};

const SpacesSheet = ({ spaces, currentSpaceId, onSelect, onCreateNew }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
      <View style={styles.handle} />

      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Your spaces</Text>
        <Text style={styles.sheetSubtitle}>Each space keeps its own wallets, limits and currency.</Text>
      </View>

      <View style={styles.rows}>
        {spaces.map((space) => {
          const isCurrent = space.id === currentSpaceId;

          return (
            <TouchableOpacity
              key={space.id}
              style={[styles.row, isCurrent && styles.rowActive]}
              onPress={() => onSelect(space.id)}
              activeOpacity={0.7}
            >
              <View style={styles.rowIconBox}>
                <Icon
                  name={space.type === SpaceType.PERSONAL ? 'user' : 'users'}
                  size={20}
                  color={isCurrent ? colors.accent : colors.text}
                />
              </View>

              <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {space.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {spaceMeta(space)}
                </Text>
              </View>

              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>{space.currency.code}</Text>
              </View>

              {isCurrent && <Icon name="check" size={16} color={colors.accent} strokeWidth={2.6} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.createRow, { marginBottom: insets.bottom + theme.spacing.lg }]}
        onPress={onCreateNew}
        activeOpacity={0.7}
      >
        <Icon name="plus" size={16} />
        <Text style={styles.createRowText}>Create new space</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
};

export default SpacesSheet;
