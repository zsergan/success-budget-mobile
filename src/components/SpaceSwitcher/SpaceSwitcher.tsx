import { useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Text, TouchableOpacity, View } from 'react-native';

import BottomModal from '@components/Modals/BottomSheetModal/BottomSheetModal';
import Icon from '@components/Icon/Icon';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCurrentSpace, selectSpace } from '@redux/state/space/selectors';
import { activateSpace } from '@redux/state/space/thunks';
import { ScreenNames, SpaceType } from '@shared/enums';
import type { MainTabNavigationProp } from '@shared/types';
import { colors } from '@shared/theme';

import SpacesSheet from './SpacesSheet';
import styles from './style';

interface Props {
  navigation: MainTabNavigationProp<ScreenNames.HOME_TAB>;
}

const SpaceSwitcher = ({ navigation }: Props) => {
  const sheetRef = useRef<BottomSheetModal>(null);
  const dispatch = useAppDispatch();
  const { spaces, currentSpaceId } = useAppSelector(selectSpace);
  const currentSpace = useAppSelector(selectCurrentSpace);

  const handleSelect = (spaceId: number) => {
    dispatch(activateSpace(spaceId));
    sheetRef.current?.dismiss();
  };

  const handleCreateNew = () => {
    sheetRef.current?.dismiss();
    navigation.navigate(ScreenNames.CREATE_SPACE_SCREEN);
  };

  if (!currentSpace) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.pill} onPress={() => sheetRef.current?.present()} activeOpacity={0.7}>
        <View style={styles.iconBox}>
          <Icon name={currentSpace.type === SpaceType.PERSONAL ? 'user' : 'users'} size={16} />
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {currentSpace.name}
        </Text>

        <View style={styles.currencyBadge}>
          <Text style={styles.currencyBadgeText}>{currentSpace.currency.code}</Text>
        </View>

        <Icon name="chevron-down" size={14} color={colors.muted} strokeWidth={2.1} />
      </TouchableOpacity>

      <BottomModal ref={sheetRef} dynamicSizing>
        <SpacesSheet
          spaces={spaces}
          currentSpaceId={currentSpaceId}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
        />
      </BottomModal>
    </View>
  );
};

export default SpaceSwitcher;
