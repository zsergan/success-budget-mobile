import { useState } from 'react';

import type { InputProps } from '../Input/Input';
import Input from '../Input/Input';

interface Props extends InputProps {}

const PasswordInput = ({ ...props }: Props) => {
  const [hidePassword, setHidePassword] = useState(true);

  const togglePassword = () => setHidePassword((prev) => !prev);

  return (
    <Input
      {...props}
      iconRight={hidePassword ? 'eye' : 'eye-off'}
      autoCapitalize="none"
      autoCorrect={false}
      secureTextEntry={hidePassword}
      onIconRightPress={togglePassword}
    />
  );
};

export default PasswordInput;
