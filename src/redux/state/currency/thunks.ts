import { createAsyncThunk } from '@reduxjs/toolkit';

import { getCurrencies } from '@api/currency.api';

export const fetchCurrencies = createAsyncThunk('currency/fetchCurrencies', async () => {
  return await getCurrencies();
});
