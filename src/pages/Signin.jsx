import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useFormik } from "formik";
import * as Yup from "yup";
import InpuField from "../components/InputFields/InpuField";
import ButtonPrimary from "../components/Buttons/ButtonPrimary";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import { toast } from "react-toastify";
import { StaticRoutes } from "../utils/StaticRoutes";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/slices/authSlice";

export default function Signin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      mobile: "",
      password: "",
    },
    validationSchema: Yup.object({
      mobile: Yup.string()
        .required("Mobile number is required")
        .matches(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
      password: Yup.string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    }),
    onSubmit: (values) => {
      setLoading(true);
      const payLoad = {
        number: values.mobile,
        password: values.password,
      };

      services
        .post(StaticApi.signin, payLoad)
        .then((response) => {
          setLoading(false);
          if (response.data.token) {
            localStorage.setItem("email", response.data.email);
            localStorage.setItem("role", response.data.role);

            dispatch(loginSuccess({
              token: response.data.token,
              userName: response.data.userName,
              userPhone: response.data.number
            }));

            navigate(StaticRoutes.home);
          } else {
          }
        })
        .catch((error) => {
          if (error.response.status === 400 && error.response.data.message === "Mobile number not registered") {
            toast.error("User ID or Password is incorrect");
          }
          else {
            toast.error("Something went wrong");
          }
          setLoading(false);
        });
    },
  });

  return (
    <div className="w-full max-w-md mx-auto md:mx-0">
      <div className="mb-8 text-center md:text-left">
        <h1
          className="text-2xl font-bold tracking-tight text-primary"
          onClick={() => navigate("/dashboard")}
        >
          Sign in to your account
        </h1>
        <p className="text-subText mt-2">
          Enter your credentials to access the admin dashboard
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <InpuField
          value={formik.values.mobile}
          label={"Mobile Number"}
          name={"mobile"}
          type={"text"}
          placeholder={"Enter your mobile number"}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.mobile && formik.errors.mobile
              ? formik.errors.mobile
              : ""
          }
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-subText"
            >
              Password
            </label>
            <a href="#" className="text-sm text-subText hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring ${formik.touched.password && formik.errors.password
                ? "border-red-500 focus:ring-red-300"
                : "focus:ring-primary"
                }`}
            />
            <button
              type="button"
              className="absolute right-3 top-2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="text-xs text-red-500 mt-1">
              {formik.errors.password}
            </p>
          )}
        </div>

        <ButtonPrimary
          label={"Sign in"}
          handleOnClick={() => {
            formik.handleSubmit();
          }}
          loading={loading}
        />

        <hr className="border-t border-subText" />
        <div className="text-center text-sm text-subText">
          Don't have an account?{" "}
          <span
            className="text-primary cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Create account
          </span>
        </div>
      </form>
    </div>
  );
}
