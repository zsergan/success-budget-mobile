import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { getLayout } from '@shared/layout';

const useLayout = () => {
  const { width, height, fontScale } = useWindowDimensions();

  return useMemo(() => getLayout({ width, height, fontScale }), [width, height, fontScale]);
};

export default useLayout;
