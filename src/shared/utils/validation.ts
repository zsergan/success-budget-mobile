import * as yup from 'yup';

const normalizeDecimalSeparator = (value: string) => value.replace(/,/g, '.');

// Shared by every amount/balance field: users may type either , or . as the
// decimal separator, and a non-numeric string must fail validation instead
// of silently turning into NaN (and then null in the request body).
export const amountSchema = yup
  .string()
  .required('Enter an amount')
  .transform((value: string) => (typeof value === 'string' ? normalizeDecimalSeparator(value) : value))
  .test(
    'is-number',
    'Enter a valid number',
    (value) => value !== undefined && value.trim() !== '' && !Number.isNaN(Number(value)),
  );
