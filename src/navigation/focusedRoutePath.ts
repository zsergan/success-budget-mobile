import type { NavigationState, PartialState } from '@react-navigation/native';

type State = NavigationState | PartialState<NavigationState>;

// The keys from the root route down to the focused one.
const focusedRoutePath = (root: State | undefined) => {
  const path: string[] = [];
  let state = root;

  while (state) {
    const route = state.routes[state.index ?? state.routes.length - 1];
    if (!route?.key) break;

    path.push(route.key);
    state = route.state;
  }

  return path;
};

export default focusedRoutePath;
