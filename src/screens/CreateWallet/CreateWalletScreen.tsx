import { useState } from 'react';

import { Input, RootLayout, Button } from '@components';
import { useAppDispatch } from '@redux/hooks';
import { addWallet } from '@redux/state/wallet/thunks';
import type { ScreenProps } from '@shared/types';

import styles from './style';

interface Props extends ScreenProps {}

const CreateWalletScreen = ({ navigation }: Props) => {
  const dispatch = useAppDispatch();
  const [walletName, setWalletName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  const onSubmit = () => {
    dispatch(
      addWallet({
        wallet_name: walletName,
        balance: parseInt(initialBalance, 10),
        currency_id: 11,
      }),
    ).then(() => navigation.goBack());
  };

  return (
    <RootLayout style={styles.root}>
      <Input label="Wallet name" placeholder="Cash" value={walletName} onChangeText={setWalletName} />

      <Input
        label="Initial balance"
        placeholder="0"
        value={initialBalance}
        onChangeText={setInitialBalance}
        keyboardType="numeric"
      />

      <Button title="Create" onPress={onSubmit} />
    </RootLayout>
  );
};

export default CreateWalletScreen;
