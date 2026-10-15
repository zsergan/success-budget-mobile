import emailSchema from './emailSchema';

const errorOf = (value: string) => {
  try {
    emailSchema.validateSync(value);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
};

it('asks for an email that is missing', () => {
  expect(errorOf('')).toBe('Enter your email.');
  expect(errorOf('   ')).toBe('Enter your email.');
});

it('wants a top-level domain, as the backend does', () => {
  expect(errorOf('anna@kovalenko')).toBe('Enter a valid email, like you@example.com.');
  expect(errorOf('anna@')).toBe('Enter a valid email, like you@example.com.');
  expect(errorOf('anna@kovalenko.co')).toBeNull();
});

it('ignores spaces around the address', () => {
  expect(emailSchema.validateSync(' anna@kovalenko.co ')).toBe('anna@kovalenko.co');
});
