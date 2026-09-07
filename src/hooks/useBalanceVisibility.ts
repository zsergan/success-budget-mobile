import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BALANCE_HIDDEN_KEY } from '@shared/constants';

const useBalanceVisibility = () => {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BALANCE_HIDDEN_KEY).then((value) => {
      if (value === 'true') {
        setIsHidden(true);
      }
    });
  }, []);

  const toggle = () => {
    const nextValue = !isHidden;

    setIsHidden(nextValue);
    AsyncStorage.setItem(BALANCE_HIDDEN_KEY, String(nextValue));
  };

  return { isHidden, toggle };
};

export default useBalanceVisibility;
