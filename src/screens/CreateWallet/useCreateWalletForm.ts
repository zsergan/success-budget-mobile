import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectProfile } from '@redux/state/profile/selectors';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { WalletDesign } from '@shared/enums';
import { addWallet, editWallet } from '@redux/state/wallet/thunks';
import { fetchCurrencies } from '@redux/state/currency/thunks';
import { selectCurrency } from '@redux/state/currency/selectors';

interface UseCreateWalletFormProps extends ScreenProps<ScreenNames.ADD_WALLET_SCREEN> {}

const useCreateWalletForm = ({ navigation, route }: UseCreateWalletFormProps) => {
  const isNewWallet = route.params.id === 'new';

  const { baseCurrency } = useAppSelector(selectProfile);
  const { currencies } = useAppSelector(selectCurrency);
  const dispatch = useAppDispatch();
  const [walletName, setWalletName] = useState(isNewWallet ? '' : route.params.walletName);
  const [initialBalance, setInitialBalance] = useState(isNewWallet ? '' : route.params.balance);
  const [currency, setCurrency] = useState(isNewWallet ? baseCurrency?.id || 1 : route.params.currencyId);
  const [design, setDesign] = useState(isNewWallet ? WalletDesign.GREEN : route.params.design);

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  const onSubmit = () => {
    const endPointCall = () =>
      isNewWallet
        ? dispatch(
            addWallet({
              wallet_name: walletName,
              balance: Number(initialBalance),
              currency_id: Number(currency),
              design,
            }),
          )
        : dispatch(
            editWallet({
              walletId: route.params.id,
              walletData: {
                wallet_name: walletName,
                design,
              },
            }),
          );

    endPointCall().then(() => navigation.goBack());
  };

  return {
    currencies: currencies.map((c) => ({ label: c.code, value: c.id })),
    isNewWallet,
    walletName,
    setWalletName,
    initialBalance,
    setInitialBalance,
    currency,
    setCurrency,
    design,
    setDesign,
    onSubmit,
  };
};

export default useCreateWalletForm;
