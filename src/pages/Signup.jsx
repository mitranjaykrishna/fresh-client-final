import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import InpuField from "../components/InputFields/InpuField";
import ButtonPrimary from "../components/Buttons/ButtonPrimary";
import { IoMdArrowBack } from "react-icons/io";
import { StaticApi } from "../utils/StaticApi";
import { services } from "../utils/services";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { StaticRoutes } from "../utils/StaticRoutes";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const signupFormik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    validationSchema: Yup.object().shape({
      firstName: Yup.string().required("First name is required"),
      lastName: Yup.string().required("Last name is required"),
      phone: Yup.string()
        .required("Phone number is required")
        .matches(/^\d{10}$/, "Phone must be 10 digits"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Confirm your password"),
    }),
    onSubmit: (values) => {
      const payLoad = {
        // id: 0,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        number: values.phone,
        password: values.password,
        textFormatPassword: values.password,
        role: "ROLE_USER",
        activeStatus: 100, // Assuming 100 means active  and  200 means inactive
        address: [
          {
            addressId: 0,
            addressLine1: values.address1,
            addressLine2: values.address2,
            city: values.city,
            state: values.state,
            postalCode: values.zip,
            country: values.country,
          },
        ],
      };

      console.log("Payload to submit:", payLoad);
      // You can then POST this payload to your API using axios
      setLoading(true);
      services
        .post(StaticApi.signup, payLoad)
        .then((response) => {
          navigate(StaticRoutes.signin);
        })
        .catch((error) => {
          console.error("Error during signup:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    },
  });

  return (
    <div className="w-full max-w-md mx-auto md:mx-0">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Sign up for a new account
        </h1>
        <p className="text-subText mt-2">
          Create your account to access all features and services.
        </p>
      </div>

      <form onSubmit={signupFormik.handleSubmit} className="space-y-3">
        <>
          <div className="flex justify-between gap-2">
            <InpuField
              value={signupFormik.values.firstName}
              onChange={signupFormik.handleChange}
              onBlur={signupFormik.handleBlur}
              name="firstName"
              label="First Name"
              type="text"
              placeholder="Enter your first name"
              error={
                signupFormik.touched.firstName && signupFormik.errors.firstName
                  ? signupFormik.errors.firstName
                  : ""
              }
            />
            <InpuField
              value={signupFormik.values.lastName}
              onChange={signupFormik.handleChange}
              onBlur={signupFormik.handleBlur}
              name="lastName"
              label="Last Name"
              type="text"
              placeholder="Enter your last name"
              error={
                signupFormik.touched.lastName && signupFormik.errors.lastName
                  ? signupFormik.errors.lastName
                  : ""
              }
            />
          </div>
          <InpuField
            value={signupFormik.values.phone}
            onChange={signupFormik.handleChange}
            onBlur={signupFormik.handleBlur}
            name="phone"
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number"
            error={
              signupFormik.touched.phone && signupFormik.errors.phone
                ? signupFormik.errors.phone
                : ""
            }
          />
          <InpuField
            value={signupFormik.values.email}
            onChange={signupFormik.handleChange}
            onBlur={signupFormik.handleBlur}
            name="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            error={
              signupFormik.touched.email && signupFormik.errors.email
                ? signupFormik.errors.email
                : ""
            }
          />
          <InpuField
            value={signupFormik.values.password}
            onChange={signupFormik.handleChange}
            onBlur={signupFormik.handleBlur}
            name="password"
            label="Password"
            type="text"
            placeholder="Enter your password"
            error={
              signupFormik.touched.password && signupFormik.errors.password
                ? signupFormik.errors.password
                : ""
            }
          />
          <InpuField
            value={signupFormik.values.confirmPassword}
            onChange={signupFormik.handleChange}
            onBlur={signupFormik.handleBlur}
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            error={
              signupFormik.touched.confirmPassword &&
                signupFormik.errors.confirmPassword
                ? signupFormik.errors.confirmPassword
                : ""
            }
          />
        </>

        <ButtonPrimary
          label={"Submit"}
          handleOnClick={() => {
            signupFormik.handleSubmit();
          }}
          loading={loading}
        />
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-subText">
          Already have an account?{" "}
          <span
            onClick={() => navigate(StaticRoutes?.signin)}
            className="text-primary hover:underline cursor-pointer"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
