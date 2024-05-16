import { configureStore } from '@reduxjs/toolkit';

import authReducer from './state/auth/slice';
import categoryReducer from './state/category/slice';
import profileReducer from './state/profile/slice';
import transactionReducer from './state/transaction/slice';
import holdingReducer from './state/holding/slice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    category: categoryReducer,
    profile: profileReducer,
    transaction: transactionReducer,
    holding: holdingReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
