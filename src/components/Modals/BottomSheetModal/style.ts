import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  // No flex: 1 here — a dynamically-sized sheet measures its content's
  // natural height, and flex: 1 would make it report "fill whatever space
  // is available" instead, defeating the sizing.
  contentContainerDynamic: {
    alignItems: 'center',
  },
  background: {
    borderRadius: 48,
  },
});

export default styles;
