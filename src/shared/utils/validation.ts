import * as yup from 'yup';

const normalizeDecimalSeparator = (value: string) => value.replace(/,/g, '.');

// Shared by every amount/balance field so both , and . work as the decimal separator.
export const amountSchema = yup
  .string()
  .required('Enter an amount')
  .transform((value: string) => (typeof value === 'string' ? normalizeDecimalSeparator(value) : value))
  .test(
    'is-number',
    'Enter a valid number',
    // isFinite, not just !isNaN: Number("Infinity") is not NaN.
    (value) => value !== undefined && value.trim() !== '' && Number.isFinite(Number(value)),
  );
