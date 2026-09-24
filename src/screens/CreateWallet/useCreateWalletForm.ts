import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { requireSpaceId } from '@redux/api/baseApi';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { AppColor } from '@shared/enums';
import { useCreateWalletMutation, useUpdateWalletMutation } from '@redux/state/wallet/api';
import { useFormSubmitHandler } from '@hooks';
import { amountSchema } from '@shared/utils';

interface CreateWalletFormData {
  walletName: string;
  initialBalance: string;
  design: AppColor;
}

const schema = yup.object().shape({
  walletName: yup.string().required(),
  initialBalance: amountSchema,
  design: yup.mixed<AppColor>().oneOf(Object.values(AppColor)).required(),
});

interface UseCreateWalletFormProps extends RootStackScreenProps<ScreenNames.ADD_WALLET_SCREEN> {}

const useCreateWalletForm = ({ navigation, route }: UseCreateWalletFormProps) => {
  const isNewWallet = route.params.id === 'new';

  const spaceCurrencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const [createWallet] = useCreateWalletMutation();
  const [updateWallet] = useUpdateWalletMutation();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      walletName: isNewWallet ? '' : route.params.walletName,
      initialBalance: isNewWallet ? '' : route.params.balance,
      design: isNewWallet ? AppColor.SLATE : route.params.design,
    },
  });

  const { onSubmit, isSubmitDisabled } = useFormSubmitHandler<CreateWalletFormData>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: async (formData) =>
      isNewWallet
        ? createWallet({
            spaceId: requireSpaceId(spaceId),
            data: {
              wallet_name: formData.walletName,
              initial_balance: formData.initialBalance,
              design: formData.design,
            },
          }).unwrap()
        : updateWallet({
            spaceId: requireSpaceId(spaceId),
            walletId: route.params.id,
            data: { wallet_name: formData.walletName, design: formData.design },
          }).unwrap(),
    onSuccess: () => navigation.goBack(),
    getInvalidMessage: (errors) =>
      [errors.walletName && 'Enter a wallet name', errors.initialBalance && 'Enter an initial balance']
        .filter(Boolean)
        .join('\n'),
  });

  return {
    spaceCurrencyCode,
    isNewWallet,
    control,
    onSubmit,
    watch,
    isSubmitDisabled,
  };
};

export default useCreateWalletForm;
