import { useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import Icon from '@components/Icon/Icon';
import useCategoryAppearance from '@hooks/useCategoryAppearance';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { CategoryColor, CustomColor } from '@shared/categoryColors';
import { isCustomColor } from '@shared/categoryColors';
import { customGlyphRgb } from '@shared/categoryAppearance';
import type { IconType } from '@shared/types';
import type { Hsv } from './colorModel';
import { cleanHexInput, hexToHsv, hsvToHex, HUE_STOPS, parseHexInput } from './colorModel';

import createStyles from './style';

const WHITE = hsvToHex({ h: 0, s: 0, v: 1 });
const BLACK = hsvToHex({ h: 0, s: 0, v: 0 });
// A fully transparent end of the same tone, so the gradient fades instead of greying out.
const clear = (hex: string) => `${hex}00`;

interface Props {
  // Where the picker starts: the draft's custom colour, else a tone near its preset.
  initial: CustomColor;
  // The draft's colour and the category's saved one, for what the header says.
  draft: CategoryColor;
  saved?: CategoryColor;
  icon: IconType;
  onPreview: (color: CustomColor) => void;
  onApply: (color: CustomColor) => void;
  onCancel: () => void;
}

interface Area {
  width: number;
  height: number;
}

const fraction = (value: number, size: number) => (size > 0 ? Math.min(1, Math.max(0, value / size)) : 0);

// A drag area of its own: a touch that starts here stays here, so neither the sheet nor its scroll takes it over.
const dragHandlers = (onMove: (event: GestureResponderEvent) => void) => ({
  onStartShouldSetResponder: () => true,
  onMoveShouldSetResponder: () => true,
  onResponderTerminationRequest: () => false,
  onResponderGrant: onMove,
  onResponderMove: onMove,
});

// The custom colour of the draft, picked by saturation and brightness, hue, or six hex digits. Nothing reaches the
// draft until Apply; a partly typed HEX stays here, and the preview keeps the last complete colour.
const CustomColorPanel = ({ initial, draft, saved, icon, onPreview, onApply, onCancel }: Props) => {
  const { scheme, colorTheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const appearanceOf = useCategoryAppearance();
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(initial));
  const [input, setInput] = useState<string>(initial);
  const [lastValid, setLastValid] = useState<CustomColor>(initial);
  const [svArea, setSvArea] = useState<Area>({ width: 0, height: 0 });
  const [hueWidth, setHueWidth] = useState(0);

  const valid = parseHexInput(input);
  const shown = valid ?? lastValid;
  const look = appearanceOf(shown);
  // The glyph may be drawn darker or lighter than the colour saved, so it stands out; the note says which.
  const picked = [1, 3, 5].map((index) => parseInt(shown.slice(index, index + 2), 16));
  const glyph = customGlyphRgb(shown, colorTheme);
  const shift = glyph.reduce((sum, channel, index) => sum + channel - picked[index], 0);

  const take = (color: CustomColor, next: Hsv) => {
    setHsv(next);
    setInput(color);
    setLastValid(color);
    onPreview(color);
  };

  const pickSv = ({ nativeEvent }: GestureResponderEvent) => {
    const next = {
      ...hsv,
      s: fraction(nativeEvent.locationX, svArea.width),
      v: 1 - fraction(nativeEvent.locationY, svArea.height),
    };
    take(hsvToHex(next), next);
  };

  const pickHue = ({ nativeEvent }: GestureResponderEvent) => {
    const next = { ...hsv, h: fraction(nativeEvent.locationX, hueWidth) * 360 };
    take(hsvToHex(next), next);
  };

  const step = (change: Partial<Hsv>) => {
    const next = {
      h: Math.min(360, Math.max(0, change.h ?? hsv.h)),
      s: Math.min(1, Math.max(0, change.s ?? hsv.s)),
      v: Math.min(1, Math.max(0, change.v ?? hsv.v)),
    };
    take(hsvToHex(next), next);
  };

  const typeHex = (text: string) => {
    const cleaned = cleanHexInput(text);
    const color = parseHexInput(cleaned);

    setInput(cleaned);
    if (!color) return;

    // A grey has no hue of its own: the bar stays where it was.
    const next = hexToHsv(color);
    setHsv(next.s === 0 ? { ...next, h: hsv.h } : next);
    setLastValid(color);
    onPreview(color);
  };

  const status =
    saved !== undefined && isCustomColor(saved) && draft === saved
      ? `Saved: ${saved}`
      : isCustomColor(draft)
        ? `Current: ${draft}`
        : 'Not applied yet';
  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const percent = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Custom colour</Text>
        <Text style={styles.panelStatus}>{status}</Text>
      </View>

      <View
        style={[styles.svArea, { backgroundColor: hueColor }]}
        onLayout={({ nativeEvent }: LayoutChangeEvent) =>
          setSvArea({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })
        }
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Saturation and brightness"
        accessibilityValue={{ text: `Saturation ${percent(hsv.s)}, brightness ${percent(hsv.v)}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) =>
          step({ v: hsv.v + (nativeEvent.actionName === 'increment' ? 0.1 : -0.1) })
        }
        {...dragHandlers(pickSv)}
      >
        <LinearGradient
          style={styles.fill}
          colors={[WHITE, clear(WHITE)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
        />
        <LinearGradient
          style={styles.fill}
          colors={[clear(BLACK), BLACK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />
        <View
          pointerEvents="none"
          style={[styles.svThumb, { left: hsv.s * svArea.width - 10, top: (1 - hsv.v) * svArea.height - 10 }]}
        >
          <View style={[styles.thumbInner, { backgroundColor: shown }]} />
        </View>
      </View>

      <View
        style={styles.hueBar}
        onLayout={({ nativeEvent }: LayoutChangeEvent) => setHueWidth(nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Hue"
        accessibilityValue={{ min: 0, max: 360, now: Math.round(hsv.h) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={({ nativeEvent }) =>
          step({ h: hsv.h + (nativeEvent.actionName === 'increment' ? 10 : -10) })
        }
        {...dragHandlers(pickHue)}
      >
        <LinearGradient
          style={styles.hueTrack}
          colors={HUE_STOPS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
        />
        <View pointerEvents="none" style={[styles.hueThumbOuter, { left: (hsv.h / 360) * hueWidth - 11 }]}>
          <View style={[styles.thumbInner, { backgroundColor: hueColor }]} />
        </View>
      </View>

      <View style={styles.hexRow}>
        <View style={styles.hexColumn}>
          <Text style={styles.fieldLabel}>HEX</Text>
          <View style={[styles.hexField, valid ? styles.hexFieldValid : styles.hexFieldInvalid]}>
            <BottomSheetTextInput
              keyboardAppearance={scheme}
              style={styles.hexInput}
              value={input}
              onChangeText={typeHex}
              autoCapitalize="characters"
              autoCorrect={false}
              spellCheck={false}
              maxLength={7}
              returnKeyType="done"
              onSubmitEditing={() => valid && onApply(valid)}
              accessibilityLabel="Hex colour"
            />
          </View>
        </View>

        <View style={styles.previewColumn}>
          <Text style={styles.fieldLabel}>PREVIEW</Text>
          <View style={[styles.previewTile, { backgroundColor: look.tint }]}>
            <Icon name={icon} size={22} color={look.stroke} strokeWidth={1.9} />
          </View>
        </View>
      </View>

      {!valid && (
        <Text style={styles.hexError} accessibilityRole="alert">
          Enter 6 hex digits, like #0F8F8A.
        </Text>
      )}

      {valid && shift !== 0 && (
        <Text style={styles.panelNote}>
          {`Very ${shift < 0 ? 'light colours are darkened' : 'dark colours are lightened'} for the icon so it stays visible. The saved value is still ${valid}.`}
        </Text>
      )}

      <View style={styles.panelActions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyButton, !valid && styles.applyButtonDisabled]}
          onPress={() => valid && onApply(valid)}
          disabled={!valid}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: !valid }}
        >
          <Text style={[styles.applyText, !valid && styles.applyTextDisabled]}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomColorPanel;
