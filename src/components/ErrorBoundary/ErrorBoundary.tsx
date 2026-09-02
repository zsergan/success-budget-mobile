import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import Button from '../Buttons/Button/Button';
import { palette } from '@shared/theme';

import styles from './style';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

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
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <MaterialIcons name="error-outline" size={60} color={palette.greyDark} />

          <Text style={styles.message}>Something went wrong. Please try again.</Text>

          <Button title="Try again" onPress={this.handleReset} style={styles.button} />
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
