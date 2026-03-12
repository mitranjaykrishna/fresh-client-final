import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { services } from "../../utils/services";
import { StaticApi } from "../../utils/StaticApi";

// Async thunk to fetch cart
export const fetchCartItems = createAsyncThunk(
    "cart/fetchCartItems",
    async (_, { rejectWithValue }) => {
        try {
            const res = await services.get(StaticApi.getUserCart);
            return res?.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch cart");
        }
    }
);

const initialState = {
    items: [],
    cartLength: 0,
    cartData: {}, // metadata like totalShippingCharge etc.
    loading: false,
    error: null,
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        clearCart: (state) => {
            state.items = [];
            state.cartLength = 0;
            state.cartData = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCartItems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCartItems.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload?.items || [];
                state.items = data;
                state.cartLength = data.length;
                state.cartData = action.payload || {};
            })
            .addCase(fetchCartItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCart } = cartSlice.actions;

export default cartSlice.reducer;
