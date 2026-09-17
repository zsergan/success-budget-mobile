import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppSelector, useAppDispatch } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { AppColor } from '@shared/enums';
import { addWallet, editWallet } from '@redux/state/wallet/thunks';
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

interface UseCreateWalletFormProps extends ScreenProps<ScreenNames.ADD_WALLET_SCREEN> {}

const useCreateWalletForm = ({ navigation, route }: UseCreateWalletFormProps) => {
  const isNewWallet = route.params.id === 'new';

  const spaceCurrencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const dispatch = useAppDispatch();

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
    onSubmit: (formData) =>
      isNewWallet
        ? dispatch(
            addWallet({
              wallet_name: formData.walletName,
              initial_balance: Number(formData.initialBalance),
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
    spaceCurrencyCode,
    isNewWallet,
    control,
    onSubmit,
    watch,
    isSubmitDisabled,
  };
};

export default useCreateWalletForm;
