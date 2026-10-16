import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';

import Button from '../Buttons/Button/Button';
import Icon from '../Icon/Icon';
import { ThemeFallback } from '../ThemeProvider/ThemeProvider';

import createStyles from './style';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

const ErrorFallback = ({ onReset }: { onReset: () => void }) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <Icon name="alert" size={60} color={colors.muted} />

      <Text style={styles.message}>Something went wrong. Please try again.</Text>

      <Button title="Try again" onPress={onReset} style={styles.button} />
    </View>
  );
};

// Class component: error boundaries only support
// getDerivedStateFromError/componentDidCatch, no hook equivalent exists.
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // No crash-reporting SDK is wired up yet; at least log it.
    console.error('Unhandled render error', error, errorInfo);
    // A crash before the first screen was ready would otherwise leave the native splash up for good.
    SplashScreen.hideAsync();
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ThemeFallback>
          <ErrorFallback onReset={this.handleReset} />
        </ThemeFallback>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
