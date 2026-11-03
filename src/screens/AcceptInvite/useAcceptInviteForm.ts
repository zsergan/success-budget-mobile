import { useState } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useAppDispatch } from '@redux/hooks';
import { acceptInviteAndSelect } from '@redux/state/space/thunks';
import { useFormSubmitHandler, useSecondsUntil } from '@hooks';
import { describeAcceptProblem } from './acceptProblem';

interface AcceptInviteFormData {
  code: string;
}

// The backend's codes are six digits, leading zeros included.
const schema = yup.object().shape({
  code: yup
    .string()
    .required('Enter the 6-digit code')
    .matches(/^\d{6}$/, 'Enter the 6-digit code'),
});

interface UseAcceptInviteFormProps {
  onJoined: () => void;
}

const useAcceptInviteForm = ({ onJoined }: UseAcceptInviteFormProps) => {
  const dispatch = useAppDispatch();
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const waitSeconds = useSecondsUntil(retryAt);

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
    onSubmit: async ({ code }) => {
      try {
        return await dispatch(acceptInviteAndSelect({ code }));
      } catch (error) {
        const problem = describeAcceptProblem(error);
        if (problem.retryAfterMs !== undefined) setRetryAt(Date.now() + problem.retryAfterMs);

        throw new Error(problem.message, { cause: error });
      }
    },
    onSuccess: onJoined,
  });

  return {
    control,
    onSubmit,
    isSubmitDisabled: isSubmitDisabled || waitSeconds > 0,
    waitSeconds,
    submitError,
  };
};

export default useAcceptInviteForm;
