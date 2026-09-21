import { Text, TouchableOpacity, View } from 'react-native';

import type { SpaceMember } from '@api/dto';
import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  member: SpaceMember;
  isSelf: boolean;
  onActionPress: () => void;
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

const MemberRow = ({ member, isSelf, onActionPress }: Props) => {
  const isInvite = member.type === 'invite';
  const tag = isInvite
    ? 'Invited'
    : isSelf
      ? member.role === 'owner'
        ? 'Owner · you'
        : 'You'
      : member.role === 'owner'
        ? 'Owner'
        : null;

  return (
    <View style={styles.row}>
      <View style={[styles.rowAvatar, isSelf && styles.rowAvatarSelf]}>
        {member.name ? (
          <Text style={[styles.rowInitials, isSelf && styles.rowInitialsSelf]}>{getInitials(member.name)}</Text>
        ) : (
          <Icon name="mail" size={17} color={colors.muted} strokeWidth={1.9} />
        )}
      </View>

      <View style={styles.rowText}>
        <View style={styles.rowNameLine}>
          <Text style={styles.rowName} numberOfLines={1}>
            {member.name || member.email}
          </Text>

          {tag && (
            <View style={[styles.rowTag, isInvite && styles.rowTagInvite]}>
              <Text style={[styles.rowTagText, isInvite && styles.rowTagTextInvite]}>{tag}</Text>
            </View>
          )}
        </View>

        {member.name && (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {member.email}
          </Text>
        )}
      </View>

      {member.can_remove && (
        <TouchableOpacity style={styles.rowRemove} onPress={onActionPress} hitSlop={8}>
          <Icon name="close" size={14} color={colors.danger} strokeWidth={2.1} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MemberRow;
