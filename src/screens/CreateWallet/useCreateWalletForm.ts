import * as yup from 'yup';
import { useEffect } from 'react';
import type { CreateWalletResponse } from '@api/dto';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { requireSpaceId } from '@redux/api/baseApi';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import type { RootStackScreenProps } from '@shared/types';
import { AppColor, ScreenNames } from '@shared/enums';
import { awayEnded, walletCreated } from '@redux/state/transactionFlow/slice';
import { useCreateWalletMutation, useUpdateWalletMutation } from '@redux/state/wallet/api';
import { useFormSubmitHandler } from '@hooks';
import { amountSchema } from '@shared/utils';

interface CreateWalletFormData {
  walletName: string;
  initialBalance: string;
  design: AppColor;
}

const schema = yup.object().shape({
  walletName: yup.string().trim().required('Enter a wallet name'),
  initialBalance: amountSchema,
  design: yup.mixed<AppColor>().oneOf(Object.values(AppColor)).required(),
});

interface UseCreateWalletFormProps extends RootStackScreenProps<ScreenNames.ADD_WALLET_SCREEN> {}

const useCreateWalletForm = ({ navigation, route }: UseCreateWalletFormProps) => {
  const isNewWallet = route.params.id === 'new';
  const forDraft = route.params.id === 'new' ? route.params.forDraft : undefined;
  const dispatch = useAppDispatch();

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

  useEffect(
    () => () => {
      if (forDraft !== undefined) dispatch(awayEnded({ draftId: forDraft }));
    },
    [dispatch, forDraft],
  );

  // Kept only while this screen is open: leaving it any other way than a save drops the intent with it.
  const addTransaction = route.params.id === 'new' ? route.params.addTransaction : undefined;

  const continueToTransaction = (walletId: number) => {
    if (!addTransaction || addTransaction.spaceId !== spaceId) return false;

    navigation.popTo(ScreenNames.HOME_SCREEN, {
      screen: addTransaction.returnTo,
      params: { composeWith: { spaceId: addTransaction.spaceId, walletId } },
    });

    return true;
  };

  const { onSubmit, isSubmitDisabled, submitError } = useFormSubmitHandler<
    CreateWalletFormData,
    CreateWalletResponse | void
  >({
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
    onSuccess: (result) => {
      if (result && forDraft !== undefined) dispatch(walletCreated({ draftId: forDraft, walletId: result.wallet.id }));
      if (!result || !continueToTransaction(result.wallet.id)) navigation.goBack();
    },
  });

  return {
    spaceCurrencyCode,
    isNewWallet,
    control,
    onSubmit,
    watch,
    isSubmitDisabled,
    submitError,
  };
};

export default useCreateWalletForm;
