import { View } from 'react-native';
import { G, Mask } from 'react-native-svg';
import { render, screen } from '@testing-library/react-native';

import BrandMark from './BrandMark';

it('gives every mark its own masks, each referenced by that mark only', () => {
  render(
    <View>
      <BrandMark height={30} />
      <BrandMark height={60} />
    </View>,
  );

  const maskIds = screen.UNSAFE_getAllByType(Mask).map((mask) => mask.props.id);
  const references = screen
    .UNSAFE_getAllByType(G)
    .map((group) => group.props.mask)
    .filter(Boolean);

  expect(new Set(maskIds).size).toBe(4);
  expect(references).toEqual(maskIds.map((id) => `url(#${id})`));
  maskIds.forEach((id) => expect(id).toMatch(/^[a-zA-Z0-9]+$/));
});
