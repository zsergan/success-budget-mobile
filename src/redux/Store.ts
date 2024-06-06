import { configureStore } from '@reduxjs/toolkit';

import authReducer from './state/auth/slice';
import categoryReducer from './state/category/slice';
import currencyReducer from './state/currency/slice';
import limitReducer from './state/limit/slice';
import profileReducer from './state/profile/slice';
import transactionReducer from './state/transaction/slice';
import walletReducer from './state/wallet/slice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    category: categoryReducer,
    currency: currencyReducer,
    limit: limitReducer,
    profile: profileReducer,
    transaction: transactionReducer,
    wallet: walletReducer,
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
