import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isLoggedIn: !!localStorage.getItem("token"),
    token: localStorage.getItem("token") || null,
    userName: localStorage.getItem("userName") || null,
    userPhone: localStorage.getItem("userPhone") || null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            const { token, userName, userPhone } = action.payload;
            state.isLoggedIn = true;
            state.token = token;
            state.userName = userName;
            state.userPhone = userPhone;

            localStorage.setItem("token", token);
            if (userName) localStorage.setItem("userName", userName);
            if (userPhone) localStorage.setItem("userPhone", userPhone);
        },
        logout: (state) => {
            state.isLoggedIn = false;
            state.token = null;
            state.userName = null;
            state.userPhone = null;

            localStorage.clear();
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
