import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch } from '@redux/hooks';
import { acceptInvite } from '@redux/state/member/thunks';
import type { ScreenNames } from '@shared/enums';
import type { ScreenProps } from '@shared/types';
import { useFormSubmitHandler } from '@hooks';

interface AcceptInviteFormData {
  code: string;
}

const schema = yup.object().shape({
  code: yup.string().required().length(6, 'Enter the 6-character code'),
});

type UseAcceptInviteFormProps = Pick<ScreenProps<ScreenNames.ACCEPT_INVITE_SCREEN>, 'navigation'>;

const useAcceptInviteForm = ({ navigation }: UseAcceptInviteFormProps) => {
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { code: '' },
  });

  const { onSubmit, isSubmitDisabled } = useFormSubmitHandler<AcceptInviteFormData>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: (formData) => dispatch(acceptInvite(formData.code)).unwrap(),
    onSuccess: () => navigation.goBack(),
    getInvalidMessage: () => 'Enter the 6-character code',
  });

  return {
    control,
    onSubmit,
    isSubmitDisabled,
  };
};

export default useAcceptInviteForm;
