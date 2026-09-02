import { useEffect } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectProfile } from '@redux/state/profile/selectors';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { WalletDesign } from '@shared/enums';
import { addWallet, editWallet } from '@redux/state/wallet/thunks';
import { fetchCurrencies } from '@redux/state/currency/thunks';
import { selectCurrency } from '@redux/state/currency/selectors';
import { useFormSubmitHandler } from '@hooks';
import { amountSchema } from '@shared/utils';

interface CreateWalletFormData {
  walletName: string;
  initialBalance: string;
  currency: number;
  design: WalletDesign;
}

const schema = yup.object().shape({
  walletName: yup.string().required(),
  initialBalance: amountSchema,
  currency: yup.number().required(),
  design: yup.mixed<WalletDesign>().oneOf(Object.values(WalletDesign)).required(),
});

interface UseCreateWalletFormProps extends ScreenProps<ScreenNames.ADD_WALLET_SCREEN> {}

const useCreateWalletForm = ({ navigation, route }: UseCreateWalletFormProps) => {
  const isNewWallet = route.params.id === 'new';

  const { baseCurrency } = useAppSelector(selectProfile);
  const { currencies } = useAppSelector(selectCurrency);
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      walletName: isNewWallet ? '' : route.params.walletName,
      initialBalance: isNewWallet ? '' : route.params.balance,
      currency: isNewWallet ? baseCurrency?.id || 1 : route.params.currencyId,
      design: isNewWallet ? WalletDesign.GREEN : route.params.design,
    },
  });

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  const { onSubmit } = useFormSubmitHandler<CreateWalletFormData>({
    handleSubmit,
    onSubmit: (formData) =>
      isNewWallet
        ? dispatch(
            addWallet({
              wallet_name: formData.walletName,
              balance: Number(formData.initialBalance),
              currency_id: Number(formData.currency),
              design: formData.design,
            }),
          ).unwrap()
        : dispatch(
            editWallet({
              walletId: route.params.id,
              walletData: {
                wallet_name: formData.walletName,
                design: formData.design,
              },
            }),
          ).unwrap(),
    onSuccess: () => navigation.goBack(),
    getInvalidMessage: (errors) =>
      [errors.walletName && 'Enter a wallet name', errors.initialBalance && 'Enter an initial balance']
        .filter(Boolean)
        .join('\n'),
  });

  return {
    currencies: currencies.map((c) => ({ label: c.code, value: c.id })),
    isNewWallet,
    control,
    onSubmit,
    watch,
    isSubmitSuccessful,
  };
};

export default useCreateWalletForm;
