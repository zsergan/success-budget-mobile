import { render, screen } from '@testing-library/react-native';

import Icon from '@components/Icon/Icon';
import Banner from './Banner';

const iconNames = () => screen.UNSAFE_getAllByType(Icon).map((icon) => icon.props.name);

describe.each(['inline', 'card'] as const)('a %s banner', (variant) => {
  it('shows the icon it is given', () => {
    render(<Banner variant={variant} tone="warn" text="Offline." icon="offline" />);

    expect(iconNames()).toEqual(['offline']);
  });

  it('shows an alert when it is given no icon', () => {
    render(<Banner variant={variant} tone="danger" text="Couldn’t save." />);

    expect(iconNames()).toEqual(['alert']);
  });
});
