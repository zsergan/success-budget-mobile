import { Text, View } from 'react-native';

import type { PersonModel } from '@api/models';
import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { memberAppColor } from '@shared/utils';

import createStyles from './style';

// Who a row is about: a person as the space knows them now, the whole space, nobody, or an author filled in when
// wallets were retired.
export type AvatarSubject =
  ({ kind: 'member' } & PersonModel) | { kind: 'space' } | { kind: 'unassigned' } | { kind: 'imported' };

interface Props {
  subject: AvatarSubject;
  selfId?: number;
  size?: number;
}

const initialOf = (name: string | null) => [...(name?.trim() ?? '')][0]?.toUpperCase() ?? '?';

// A person still in the space shows their initial in their colour; anyone else, nobody and an import are drawn
// apart, outlined or grey, so they never read as a current member.
const AssignmentAvatar = ({ subject, selfId, size = 28 }: Props) => {
  const { colors, categories } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const box = { width: size, height: size, borderRadius: size / 2 };
  const iconSize = Math.round(size * 0.5);

  if (subject.kind === 'member' && subject.status === 'member' && subject.userId !== null) {
    const { stroke, tint } = categories[memberAppColor(subject.userId, selfId)];

    return (
      <View style={[styles.root, box, { backgroundColor: tint }]}>
        <Text style={[styles.initial, { color: stroke, fontSize: Math.round(size * 0.42) }]} allowFontScaling={false}>
          {initialOf(subject.name)}
        </Text>
      </View>
    );
  }

  if (subject.kind === 'space') {
    return (
      <View style={[styles.root, box, styles.space]}>
        <Icon name="users" size={iconSize} color={colors.text} strokeWidth={2} />
      </View>
    );
  }

  if (subject.kind === 'imported') {
    return (
      <View style={[styles.root, box, styles.imported]}>
        <Icon name="archive" size={iconSize} color={colors.muted} strokeWidth={2} />
      </View>
    );
  }

  return (
    <View style={[styles.root, box, styles.outlined]}>
      <Icon
        name={subject.kind === 'unassigned' ? 'minus' : 'user-x'}
        size={iconSize}
        color={colors.muted}
        strokeWidth={2}
      />
    </View>
  );
};

export default AssignmentAvatar;
