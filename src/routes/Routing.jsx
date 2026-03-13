import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import SignupLayout from "./layout/SignupLayout";
import Signin from "../pages/Signin";
import { StaticRoutes } from "../utils/StaticRoutes";
import Signup from "../pages/Signup";
import FeedLayout from "./layout/FeedLayout";
import Home from "../pages/Home";
import Wishlist from "../pages/Wishlist";
import Product from "../pages/Product";
import Cart from "../pages/Cart";
import Orders from "../pages/Orders";
import Profile from "../pages/Profile";
import Checkout from "../pages/Checkout";
import Terms from "../pages/Terms";
import ScrollToTop from "../components/ScrollToTop";
import ThankYouPage from "../pages/Thankyou";
import ExploreAll from "../pages/ExploreAll";

export default function Routing() {
  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<SignupLayout />}>
            <Route path={StaticRoutes?.signin} element={<Signin />} />
            <Route path={StaticRoutes?.signup} element={<Signup />} />
          </Route>
          <Route element={<FeedLayout />}>
            <Route path={StaticRoutes?.home} element={<Home />} />
            <Route path={StaticRoutes?.wishlist} element={<Wishlist />} />
            <Route path={StaticRoutes?.product} element={<Product />} />
            <Route path={StaticRoutes?.cart} element={<Cart />} />
            <Route path={StaticRoutes?.orders} element={<Orders />} />
            <Route path={StaticRoutes?.profile} element={<Profile />} />
            <Route path={StaticRoutes?.checkout} element={<Checkout />} />
            <Route path={StaticRoutes?.terms} element={<Terms />} />
            <Route path={StaticRoutes?.thankYou} element={<ThankYouPage />} />
            <Route path="/category/:category" element={<ExploreAll />} />
            <Route path="/category" element={<ExploreAll />} />
            <Route path={StaticRoutes?.explore} element={<ExploreAll />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
