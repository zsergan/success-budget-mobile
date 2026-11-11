import { useEffect, useRef, useState } from 'react';
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
  // Taken when the code is sent; the returned check says whether the join may still end the flow.
  captureFlow: () => () => boolean;
}

const useAcceptInviteForm = ({ onJoined, captureFlow }: UseAcceptInviteFormProps) => {
  const dispatch = useAppDispatch();
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const waitSeconds = useSecondsUntil(retryAt);
  const isResetDueRef = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { code: '' },
  });

  const { onSubmit, isSubmitDisabled, submitError } = useFormSubmitHandler<AcceptInviteFormData, () => boolean>({
    handleSubmit,
    formState: { isSubmitting, isSubmitSuccessful },
    onSubmit: async ({ code }) => {
      const isFlowCurrent = captureFlow();

      try {
        await dispatch(acceptInviteAndSelect({ code }));
        return isFlowCurrent;
      } catch (error) {
        const problem = describeAcceptProblem(error);
        if (problem.retryAfterMs !== undefined) setRetryAt(Date.now() + problem.retryAfterMs);

        throw new Error(problem.message, { cause: error });
      }
    },
    // The join itself stands either way; a newer invitation on screen gets an empty form if the user needs one.
    onSuccess: (isFlowCurrent) => {
      if (isFlowCurrent()) onJoined();
      else isResetDueRef.current = true;
    },
  });

  // Only once the form counts as submitted: a reset during the submit is undone when it completes.
  useEffect(() => {
    if (!isSubmitSuccessful || !isResetDueRef.current) return;

    isResetDueRef.current = false;
    reset();
  }, [isSubmitSuccessful, reset]);

  return {
    control,
    onSubmit,
    isSubmitDisabled: isSubmitDisabled || waitSeconds > 0,
    waitSeconds,
    submitError,
  };
};

export default useAcceptInviteForm;
