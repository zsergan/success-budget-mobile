import { useContext } from 'react';

import { AlertContext } from '@components/Alert/AlertProvider/AlertProvider';

const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default useAlert;
