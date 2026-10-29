import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch } from '@redux/hooks';
import { acceptInviteAndSelect } from '@redux/state/space/thunks';
import type { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import { useFormSubmitHandler } from '@hooks';

interface AcceptInviteFormData {
  code: string;
}

const schema = yup.object().shape({
  code: yup.string().required('Enter the 6-character code').length(6, 'Enter the 6-character code'),
});

type UseAcceptInviteFormProps = Pick<RootStackScreenProps<ScreenNames.ACCEPT_INVITE_SCREEN>, 'navigation'>;

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

  const { onSubmit, isSubmitDisabled, submitError } = useFormSubmitHandler<AcceptInviteFormData>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: (formData) => dispatch(acceptInviteAndSelect(formData.code)),
    onSuccess: () => navigation.goBack(),
  });

  return {
    control,
    onSubmit,
    isSubmitDisabled,
    submitError,
  };
};

export default useAcceptInviteForm;
