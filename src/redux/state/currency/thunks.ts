import { getCurrencies } from '@api/currency.api';
import { createAppAsyncThunk, getRejectValue } from '@redux/createAppAsyncThunk';

export const fetchCurrencies = createAppAsyncThunk('currency/fetchCurrencies', async (_: void, thunkAPI) => {
  try {
    return await getCurrencies();
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(getRejectValue(error));
  }
});
