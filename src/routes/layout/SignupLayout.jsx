import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { Bounce, ToastContainer } from "react-toastify";

export default function SignupLayout() {

  return (
    <div className="flex flex-col lg:flex-row-reverse w-screen h-screen">
      {/* Left Panel */}
      <div className="relative w-full lg:w-[62%] h-[56%] lg:h-full">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-cover bg-center bg-[url('./assets/bg-signin.avif')] contrast-[1.1] brightness-[1.1]" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-yellow-500/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-green-600/50 to-black-600/60" />

        {/* Content */}
        <div className="relative h-full w-full p-12 flex flex-col justify-center items-center  custom-card">
          <div className="max-w-md bg-white/10 backdrop-blur-md p-[12px] shadow-none sm:p-8 sm:shadow-xl rounded-xl border border-white/20">

            <h2 className="text-3xl font-bold mb-4 text-white">
              Welcome to Freshotter
            </h2>
            <p className="text-white/90 text-lg mb-6">
              Discover the finest quality Masala, Dairy, and Oil products. Manage your orders,
              view analytics, and keep track of your cart from our powerful customer dashboard.
            </p>
            <div className="space-y-4">
              {/* Feature List */}
              {[
                {
                  title: "Extensive Catalog",
                  description: "Browse, filter, and order your favorite Masala, Dairy, and Oil products.",
                  iconPath: "M5 13l4 4L19 7",
                },
                {
                  title: "Order Tracking",
                  description:
                    "Track your order history, delivery times, and favorite products.",
                  iconPath:
                    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                },
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={feature.iconPath}
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel (Signup Form Outlet) */}
      <div className="relative flex flex-col flex-1 items-center justify-center h-full p-6 lg:w-1/2">
        <Outlet />
      </div>
    </div>
  );
}
