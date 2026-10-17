import useTheme from './useTheme';

const useThemePreference = () => {
  const { preference, setPreference } = useTheme();

  return { preference, setThemePreference: setPreference };
};

export default useThemePreference;
