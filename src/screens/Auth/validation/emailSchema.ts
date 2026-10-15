import * as yup from 'yup';

const FORMAT_MESSAGE = 'Enter a valid email, like you@example.com.';

// yup takes `anna@kovalenko` as an email; the backend's IsEmail also wants a top-level domain.
const emailSchema = yup
  .string()
  .trim()
  .required('Enter your email.')
  .email(FORMAT_MESSAGE)
  .matches(/\.(?:[a-z]{2,}|xn--[a-z0-9-]+)$/i, FORMAT_MESSAGE);

export default emailSchema;
