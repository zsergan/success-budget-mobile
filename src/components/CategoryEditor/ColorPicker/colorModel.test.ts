import { cleanHexInput, hexToHsv, hsvToHex, HUE_STOPS, parseHexInput } from './colorModel';

describe('colorModel', () => {
  it.each(['#0F8F8A', '#C2416B', '#F4F1EA', '#000000', '#FFFFFF', '#3A7BD5', '#808080', '#FF0000', '#00FF00'])(
    'turns %s into HSV and back unchanged',
    (hex) => {
      expect(hsvToHex(hexToHsv(hex as `#${string}`))).toBe(hex);
    },
  );

  it('reads hue, saturation and value', () => {
    expect(hexToHsv('#FF0000')).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv('#808080')).toMatchObject({ h: 0, s: 0 });
    expect(hexToHsv('#0000FF').h).toBe(240);
  });

  it('spans the whole hue circle', () => {
    expect(HUE_STOPS).toEqual(['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']);
  });

  it('keeps a typed value to a # and six hex digits', () => {
    expect(cleanHexInput('0f8f')).toBe('#0F8F');
    expect(cleanHexInput('#0f8f8a99')).toBe('#0F8F8A');
    expect(cleanHexInput('#zz12 g3')).toBe('#123');
    expect(cleanHexInput('')).toBe('#');
  });

  it('takes only a complete opaque colour, upper-case as the server stores it', () => {
    expect(parseHexInput('#0f8f8a')).toBe('#0F8F8A');
    expect(parseHexInput('#0F8F')).toBeNull();
    expect(parseHexInput('#0F8F8A80')).toBeNull();
    expect(parseHexInput('slate')).toBeNull();
  });
});
