import { useFormik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { services } from "../../utils/services";
import { StaticApi } from "../../utils/StaticApi";
import ButtonPrimary from "../Buttons/ButtonPrimary";
import InpuField from "../InputFields/InpuField";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/slices/authSlice";

export default function LoginModal({ open, onClose, onLoginSuccess }) {
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

            if (onLoginSuccess) onLoginSuccess();
            onClose();
          } else {
          }
        })
        .catch((error) => {
          setLoading(false);
        });
    },
  });

  // ✅ Only render content conditionally — hooks are above
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-400/50 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">Login Required</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-lg"
          >
            ×
          </button>
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

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-subText"
              >
                Password
              </label>
              <span className="text-sm text-subText hover:underline cursor-pointer">
                Forgot password?
              </span>
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
            handleOnClick={formik.handleSubmit}
            loading={loading}
          />

          <hr className="border-t border-subText" />

          <div className="text-center text-sm text-subText">
            Don't have an account?{" "}
            <span
              className="text-primary cursor-pointer hover:underline"
              onClick={() => {
                navigate("/signup");
                onClose();
              }}
            >
              Create account
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
