import { useState } from 'react';

export type DeleteAccountStep = 'warning' | 'password' | 'confirm';

const useDeleteAccountFlow = () => {
  const [step, setStep] = useState<DeleteAccountStep>('warning');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const goToPassword = () => setStep('password');
  const goToWarning = () => setStep('warning');

  const continueFromPassword = () => {
    if (!password.trim()) {
      setPasswordError('Enter your password');
      return;
    }

    setPasswordError(undefined);
    setStep('confirm');
  };

  const reset = () => {
    setStep('warning');
    setPassword('');
    setPasswordError(undefined);
  };

  return { step, password, passwordError, goToPassword, goToWarning, setPassword, continueFromPassword, reset };
};

export default useDeleteAccountFlow;
