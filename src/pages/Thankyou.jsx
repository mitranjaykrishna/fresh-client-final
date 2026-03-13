import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Lottie from "lottie-react";
import { Check } from "lucide-react";

import successAnimation from "../assets/successAnimation.json";
import { StaticRoutes } from "../utils/StaticRoutes";
import { StaticApi } from "../utils/StaticApi";
import { services } from "../utils/services";
import ReviewModal from "../components/ReviewModal";

/* -------------------- ORDER STEPS -------------------- */
const steps = [
  "Order Placed",
  "Packaging",
  "Picked Up",
  "Out for Delivery",
  "Delivered",
];

/* -------------------- BACKEND → UI MAP -------------------- */
const statusMap = {
  Confirmed: 1,
  Packaging: 2,
  "Picked Up": 3,
  Out_for_Delivery: 4,
  Delivered: 5,
};

const ThankYouPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [showReview, setShowReview] = useState(false);

  const orderId = location.state?.orderId || searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const intervalRef = useRef(null);

  /* -------------------- FETCH ORDER -------------------- */
  const fetchOrderStatus = async () => {
    if (!orderId) return;

    try {
      const res = await services.get(
        StaticApi.getOrderById.replace(":id", orderId)
      );

      const data = res?.data;
      if (!data) return;

      setOrder(data);
      setCurrentStep(statusMap[data.orderStatus] || 1);

      // ✅ Stop polling once delivered
      if (data.orderStatus === "Delivered" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      console.error("Order fetch failed", err);
    }
  };

  /* -------------------- POLLING -------------------- */
  useEffect(() => {
    if (!orderId) return;

    fetchOrderStatus(); // initial call

    intervalRef.current = setInterval(fetchOrderStatus, 30000); // ✅ 30 sec

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId]);

  /* -------------------- SAFE DATA -------------------- */
  const items = order?.orderItems || [];

  const subtotal = order?.totalAmount || 0;
  const discount = order?.discountPrice || 0;
  const delivery = order?.shippingCharge || 0;
  const total = order?.payingAmount || 0;

  const handleReorder = async () => {
    if (!order?.orderItems?.length) return;

    const transformedItems = order.orderItems.map((item) => {
      const variantPrice =
        item.totalAmount && item.quantity
          ? item.totalAmount / item.quantity
          : 0;

      const discountPrice = item.discountPrice ?? 0;

      const afterDiscountAmount = item.afterDiscountAmount ?? 0;

      return {
        cartItemId: null, // new cart item
        productName: item.productName,
        productCode: item.productCode,
        productId: item.productId,
        variantId: null,

        variantWeightValue: item.variantWeightValue,
        variantWeightUnit: item.variantWeightUnit,

        variantPrice: variantPrice,
        variantDiscount: item.discountPercentage ?? 0,

        quantity: item.quantity,

        totalQtyPrice: variantPrice * item.quantity,
        discountPrice: discountPrice,
        afterDiscountAmount: afterDiscountAmount,
        payingAmount: afterDiscountAmount,

        gst: 0,
        shippingCharge: order.shippingCharge ?? 0,

        addedDate: new Date().toISOString(),

        variantImages: item.variantImages ?? [],
      };
    });

    localStorage.setItem(
      "selectedCheckoutItems",
      JSON.stringify(transformedItems)
    );

    navigate("/checkout");
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-3 py-6">
      <div className="w-full max-w-lg">
        {/* SUCCESS ANIMATION */}
        <div className="w-48 h-48 mx-auto mb-4">
          <Lottie animationData={successAnimation} loop={false} autoplay />
        </div>

        {/* HEADER */}
        <h1 className="text-2xl font-bold text-green-600 text-center mb-1">
          Thank You for Your Order!
        </h1>

        <p className="text-center text-sm text-gray-600 mb-1">
          Order ID: <b>#{orderId}</b>
        </p>

        {order?.paymentStatus && (
          <p className="text-center text-sm text-orange-600 mb-5">
            Payment Status: <b>{order.paymentStatus}</b>
          </p>
        )}

        {/* ORDER STATUS */}
        <div className="bg-white border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Order Status</h3>

          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10" />

            {steps.map((label, i) => {
              const completed = i < currentStep;

              return (
                <div key={label} className="flex flex-col items-center w-full">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                      completed
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {completed ? <Check size={16} /> : i + 1}
                  </div>

                  <p
                    className={`mt-2 text-xs text-center ${
                      completed ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ITEMS */}
        <div className="bg-white border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Items Ordered</h3>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity} • {item.variantWeightValue}{" "}
                    {item.variantWeightUnit}
                  </p>
                </div>

                <p className="font-semibold text-green-600">
                  ₹{item.afterDiscountAmount}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PRICE SUMMARY */}
        <div className="bg-white border rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Price Summary</h3>

          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₹{delivery.toFixed(2)}</span>
            </div>

            <div className="border-t pt-3 flex justify-between font-bold text-green-700 text-lg">
              <span>Total Paid</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* RATINGS (ONLY AFTER DELIVERY) */}
        {/* {order?.orderStatus === "Delivered" && ( */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowReview(true)}
            className="bg-green-600 cursor-pointer text-white py-3 rounded-lg w-full"
          >
            Rate Order
          </button>

          <button
            onClick={handleReorder}
            className="border cursor-pointer border-green-600 text-green-600 py-3 rounded-lg w-full"
          >
            Reorder
          </button>
        </div>
        {/* )} */}

        {/* CONTINUE */}
        <button
          onClick={() => navigate(StaticRoutes.home)}
          className="bg-green-600 text-white py-3 rounded-lg w-full"
        >
          Continue Shopping
        </button>

        {/* SUPPORT */}
        <p className="text-xs text-center text-gray-500 mt-4">
          Need help?{" "}
          <span
            onClick={() => navigate(StaticRoutes.contact)}
            className="text-green-600 cursor-pointer underline"
          >
            Contact support
          </span>
        </p>

        {showReview && (
          <ReviewModal orderId={orderId} onClose={() => setShowReview(false)} />
        )}
      </div>
    </div>
  );
};

export default ThankYouPage;
