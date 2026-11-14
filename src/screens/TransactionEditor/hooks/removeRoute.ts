import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';

// Takes exactly this route off the stack, wherever it sits: routes pushed over it by something else stay, with
// their focus.
const removeRoute = (navigation: Pick<NavigationProp<ParamListBase>, 'dispatch'>, key: string) =>
  navigation.dispatch((state) => ({ ...StackActions.pop(), source: key, target: state.key }));

export default removeRoute;
