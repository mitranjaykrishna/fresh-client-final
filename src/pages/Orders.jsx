import React, { useEffect, useState } from "react";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import { toast } from "react-toastify";
import dairydumm from "../assets/dairy-dum.png";
import empty from "../assets/emptyOrders.webp";
import { useNavigate } from "react-router";
import ButtonPrimary from "../components/Buttons/ButtonPrimary";
import login from "../assets/login1.png";
import { StaticRoutes } from "../utils/StaticRoutes";

export default function Orders() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnImages, setReturnImages] = useState([]);
  const [returnVideo, setReturnVideo] = useState(null);
  const [returnMessage, setReturnMessage] = useState("");
  const [returnOrderSelected, setReturnOrderSelected] = useState(null);
  const [isReturning, setIsReturning] = useState(false);
  const getOrders = async () => {
    setLoading(true);
    try {
      const res = await services.get(`${StaticApi.getMyOrders}`);
      const formattedOrders = (res?.data || [])
        .map((order) => ({
          ...order,
          orderDateObj: new Date(order.orderDate),
          orderDate: new Date(order.orderDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          deliveryDate: order.deliveryDate
            ? new Date(order.deliveryDate).toLocaleDateString("en-IN")
            : null,
        }))
        .sort((a, b) => b.orderDateObj - a.orderDateObj);

      setOrders(formattedOrders);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (order) => {
    setSelectedOrder(order);
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setCancelReason("");
    setSelectedOrder(null);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }

    setIsCancelling(true);
    try {
      const payload = {
        orderId: selectedOrder.orderId,
        cancellationReason: cancelReason,
      };

      await services.post(`${StaticApi.cancelOrder}`, payload);
      toast.success("Order cancelled successfully");
      closeCancelModal();
      getOrders(); // Refresh orders list
    } catch (error) {
      toast.error("Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("₹", "₹");
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      Confirmed: { color: "bg-blue-100 text-blue-800", text: "Confirmed" },
      Processing: {
        color: "bg-purple-100 text-purple-800",
        text: "Processing",
      },
      Shipped: { color: "bg-yellow-100 text-yellow-800", text: "Shipped" },
      "Out for Delivery": {
        color: "bg-orange-100 text-orange-800",
        text: "Out for Delivery",
      },
      Delivered: { color: "bg-green-100 text-green-800", text: "Delivered" },
      Cancelled: { color: "bg-red-100 text-red-800", text: "Cancelled" },
    };

    const statusInfo = statusMap[status] || {
      color: "bg-gray-100 text-gray-800",
      text: status,
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
      >
        {statusInfo.text}
      </span>
    );
  };

  const buyNow = async (orderItems) => {
    if (!orderItems || orderItems.length === 0) return;

    try {
      const buyNowItems = [];

      await Promise.all(
        orderItems.map(async (item) => {
          // 1. Add to cart
          await services.post(
            `${StaticApi.addToCart}?productCode=${item.productCode}&quantity=${item.quantity || 1
            }&weightValue=${item.variantWeightValue}&weightUnit=${item.variantWeightUnit
            }`
          );

          const quantityValue = Number(item.quantity || 1);
          const discountPercent = Number(item.discountPercentage || 0);

          // derive variant price from total
          const variantPrice =
            quantityValue > 0 ? Number(item.totalAmount) / quantityValue : 0;

          const discountPrice = Number(
            item.discountPrice || (variantPrice * discountPercent) / 100
          );

          const afterDiscountAmount = Number(
            item.afterDiscountAmount || variantPrice - discountPrice
          );

          const shippingCharge = 0; // not present in orderItems
          const gst = 0; // not present in orderItems

          const payingAmount =
            afterDiscountAmount * quantityValue + shippingCharge;

          buyNowItems.push({
            /* ---------------- PRODUCT ---------------- */
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode,

            /* ---------------- VARIANT ---------------- */
            variantId: null,
            variantWeightValue: item.variantWeightValue,
            variantWeightUnit: item.variantWeightUnit,

            /* ---------------- PRICING ---------------- */
            variantPrice,
            variantDiscount: discountPercent,
            quantity: quantityValue,

            totalQtyPrice: variantPrice * quantityValue,
            discountPrice,
            afterDiscountAmount,
            payingAmount,

            /* ---------------- TAX & SHIPPING ---------------- */
            gst,
            shippingCharge,

            /* ---------------- MEDIA ---------------- */
            variantImages: item.variantImages?.[0]?.url || "",

            addedDate: new Date().toISOString(),
          });
        })
      );

      // 2. Store EXACT SAME STRUCTURE used by checkout
      localStorage.setItem(
        "selectedCheckoutItems",
        JSON.stringify(buyNowItems)
      );

      // 3. Continue normal flow
      navigate("/checkout");
    } catch (error) {
      console.error("Error during buy again:", error);
      toast.error("Failed to reorder items");
    }
  };

  const openReturnModal = (order) => {
    setReturnOrderSelected(order);
    setIsReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    setIsReturnModalOpen(false);
    setReturnReason("");
    setReturnImages([]);
    setReturnVideo(null);
    setReturnMessage("");
    setReturnOrderSelected(null);
  };

  const returnReasons = [
    "Product was spoiled",
    "Leaked or damaged packaging",
    "Quantity mismatch",
    "Wrong product delivered",
    "Expired or near expiry",
  ];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (returnImages.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 images");
      return;
    }

    setReturnImages([...returnImages, ...files]);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    setReturnVideo(file);
  };

  const removeImage = (index) => {
    setReturnImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setReturnVideo(null);
  };

  const submitReturnRequest = async () => {
    if (!returnReason) {
      toast.error("Please select a reason");
      return;
    }

    if (!returnMessage.trim()) {
      toast.error("Please enter issue description");
      return;
    }

    const formData = new FormData();
    formData.append("orderId", returnOrderSelected.orderId);
    formData.append("reason", returnReason);
    formData.append("message", returnMessage);

    returnImages.forEach((img) => {
      formData.append("images", img);
    });

    if (returnVideo) {
      formData.append("video", returnVideo);
    }

    setIsReturning(true);

    try {
      await services.post(StaticApi.returnOrder, formData);
      toast.success("Return request submitted");
      closeReturnModal();
      getOrders();
    } catch (err) {
      toast.error("Failed to submit return");
    } finally {
      setIsReturning(false);
    }
  };

  const trackOrder = (orderId) => {
    window.open(
      `/thankYou?orderId=${orderId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  useEffect(() => {
    if (isLoggedIn) {
      getOrders();
    }
  }, [isLoggedIn]);

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-primary">Your Orders</h1>

      {!isLoggedIn ? (
        <div className="text-center text-primary text-lg font-medium">
          Please log in to view your orders.
          <div className="w-max flex self-center justify-self-center mt-4">
            <ButtonPrimary
              label="Login"
              handleOnClick={() => navigate(StaticRoutes.signin)}
            />
          </div>
          <img src={login} alt="login" className="w-full object-cover" />
        </div>
      ) : loading ? (
        <p className="text-center py-10 text-gray-500">Loading...</p>
      ) : orders?.length === 0 ? (
        <div className="text-center py-10 text-gray-500 flex flex-col justify-center items-center">
          <div className="w-max gap-[20px] flex flex-col justify-center items-center">
            <p className="text-centers text-primary font-semibold text-lg">
              No Orders Found
            </p>
            <ButtonPrimary
              label="Explore Products"
              handleOnClick={() => navigate("/")}
            />
          </div>
          <img src={empty} alt="empty" className="w-full object-cover" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders?.map((order) => (
            <div
              key={order.orderId}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              {/* Top Summary Bar */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b pb-4 text-sm text-gray-600">
                <div className="flex gap-4 flex-wrap mb-2 md:mb-0">
                  <span>
                    <strong>ORDER PLACED</strong>: {order.orderDate}
                  </span>
                  <span>
                    <strong>TOTAL</strong>:{" "}
                    {formatCurrency(order.afterDiscountAmount)}
                  </span>
                  {order.shippingAddress ? (
                    <span>
                      <strong>SHIP TO</strong>: {order.shippingAddress.name || order.shippingAddress.userName || "N/A"}
                    </span>
                  ) : (
                    <span>
                      <strong>SHIP TO</strong>: N/A
                    </span>
                  )}
                </div>
                <div className="text-sm text-right">
                  <span className="block">
                    <strong>ORDER #</strong> {order?.publicOrderId}
                  </span>
                  <div className="mt-1">
                    {getStatusBadge(order?.orderStatus)}
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div className="mt-4 text-sm">
                {order?.orderStatus === "Delivered" && (
                  <>
                    <p className="text-green-600 font-semibold">
                      Delivered on {order?.deliveryDate}
                    </p>
                    <p className="text-gray-600">
                      Your item has been delivered
                    </p>
                  </>
                )}
                {order?.orderStatus === "Cancelled" && (
                  <p className="text-red-600 font-semibold">
                    Order was cancelled
                  </p>
                )}
                {["Processing", "Shipped", "Out for Delivery"].includes(
                  order?.orderStatus
                ) && (
                    <p className="text-blue-600 font-semibold">
                      {order?.orderStatus === "Processing" &&
                        "Your order is being prepared"}
                      {order?.orderStatus === "Shipped" &&
                        "Your order has been shipped"}
                      {order?.orderStatus === "Out for Delivery" &&
                        "Your order is out for delivery"}
                    </p>
                  )}
              </div>

              {/* Product Info */}
              {order?.orderItems?.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 py-4 border-b last:border-none"
                >
                  <img
                    src={item?.variantImages?.[0]?.url}
                    alt="Product"
                    className="w-[100px] h-[100px] object-contain rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-primary">
                      {item?.productName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Qty: {item?.quantity}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Price:{" "}
                      {formatCurrency(item?.afterDiscountAmount / item?.quantity)}{" "}
                      each
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Weight: {item?.variantWeightValue} {item?.variantWeightUnit}
                    </p>
                    {order?.orderStatus === "Delivered" && (
                      <p className="text-xs text-gray-400 mt-1">
                        Return window closes on{" "}
                        {/* {order?.deliveryDate
                          ? new Date(order?.deliveryDate)
                              .setDate(
                                new Date(order?.deliveryDate).getDate() + 7
                              )
                              ?.toLocaleDateString()
                          : "N/A"} */}
                      </p>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-green-700">
                    {formatCurrency(item?.afterDiscountAmount)}
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                <div
                  onClick={() => trackOrder(order?.orderId)}
                  className="bg-[#4296879a] text-black font-medium py-[10px] px-[10px] cursor-pointer flex items-center justify-center rounded-md text-sm hover:bg-yellow-300 max-h"
                >
                  Trach Order
                </div>
                <div
                  onClick={() => buyNow(order?.orderItems)}
                  className="bg-[#4296879a] text-black font-medium py-[10px] px-[10px] cursor-pointer flex items-center justify-center rounded-md text-sm hover:bg-yellow-300 max-h"
                >
                  Buy Again
                </div>
                {order?.orderStatus === "Delivered" && (
                  <>
                    <div
                      onClick={() => navigate(StaticRoutes.terms)}
                      className="bg-[#ff9933] text-black font-medium px-[10px] py-[10px] cursor-pointer rounded-md text-sm hover:bg-yellow-300 flex items-center justify-center max-h"
                    >
                      Get product support
                    </div>
                    <div
                      onClick={() => openReturnModal(order)}
                      className="bg-blue-500 text-white font-medium px-[10px] py-[10px] cursor-pointer rounded-md text-sm hover:bg-blue-600 flex items-center justify-center max-h"
                    >
                      Return
                    </div>
                    <div
                      onClick={() => exchangeOrder(order)}
                      className="bg-purple-500 text-white font-medium px-[10px] py-[10px] cursor-pointer rounded-md text-sm hover:bg-purple-600 flex items-center justify-center max-h"
                    >
                      Exchange
                    </div>
                  </>
                )}

                <div
                  onClick={() => openReturnModal(order)}
                  className="bg-blue-500 text-white font-medium px-[10px] py-[10px] cursor-pointer rounded-md text-sm hover:bg-blue-600 flex items-center justify-center max-h"
                >
                  Return
                </div>
                {!["Delivered", "Cancelled"].includes(order.orderStatus) && (
                  <>
                    <button
                      onClick={() => openCancelModal(order)}
                      className="border border-red-500 text-red-500 font-medium p-[5px] rounded-md text-sm hover:bg-red-50"
                    >
                      Cancel Order
                    </button>
                  </>
                )}
                {/* <button className="border px-4 py-1.5 rounded-md text-sm hover:bg-gray-100">
                  View Invoice
                </button> */}
                {order.orderStatus === "Shipped" && (
                  <button className="border px-4 py-1.5 rounded-md text-sm hover:bg-gray-100">
                    Track Package
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-gray-800/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Cancel Order #{selectedOrder?.orderId}
              </h3>
              <button
                onClick={closeCancelModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-2 font-medium">Items in this order:</p>
              <ul className="max-h-60 overflow-y-auto border rounded p-2 space-y-3">
                {selectedOrder?.orderItems?.map((item) => (
                  <li
                    key={item.id}
                    className="py-2 border-b last:border-b-0 flex gap-3"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={item?.variantImages?.[0]?.url}
                        alt={item.productName}
                        className="w-16 h-16 object-contain rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-gray-500">
                        Code: {item.productCode}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity} ×{" "}
                        {formatCurrency(
                          item.afterDiscountAmount / item.quantity
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Weight: {item.variantWeightValue}{" "}
                        {item.variantWeightUnit}
                      </p>
                      <p className="text-sm font-semibold mt-1">
                        Total: {formatCurrency(item.afterDiscountAmount)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-sm">
                <p className="font-medium">
                  Order Total:{" "}
                  {formatCurrency(selectedOrder?.afterDiscountAmount)}
                </p>
                {selectedOrder?.shippingCharge && (
                  <p className="text-gray-500">
                    Shipping: {formatCurrency(selectedOrder?.shippingCharge)}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Reason *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border rounded-md p-2 h-24"
                placeholder="Please specify why you're cancelling this order..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                disabled={isCancelling}
              >
                Back
              </button>
              <button
                onClick={handleCancelOrder}
                className={`px-4 py-2 rounded-md text-white ${isCancelling ? "bg-red-400" : "bg-red-500 hover:bg-red-600"
                  }`}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl max-h-[85vh] overflow-hidden">
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                Return Order #{returnOrderSelected?.orderId}
              </h2>
              <button
                onClick={closeReturnModal}
                className="text-gray-500 hover:text-black text-xl"
              >
                ✖
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {/* ORDER ITEMS */}
              <div>
                <p className="font-medium text-sm mb-3">Items in this order</p>

                <ul className="space-y-3">
                  {returnOrderSelected?.orderItems?.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <img
                        src={item?.variantImages?.[0]?.url}
                        alt={item.productName}
                        className="w-16 h-16 object-contain rounded border"
                      />

                      <div className="flex-1 text-sm">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-gray-500 text-xs">
                          Code: {item.productCode}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Qty: {item.quantity} ×{" "}
                          {formatCurrency(
                            item.afterDiscountAmount / item.quantity
                          )}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Weight: {item.variantWeightValue}{" "}
                          {item.variantWeightUnit}
                        </p>
                        <p className="font-semibold mt-1">
                          {formatCurrency(item.afterDiscountAmount)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 text-sm">
                  <p className="font-medium">
                    Order Total:{" "}
                    {formatCurrency(returnOrderSelected?.afterDiscountAmount)}
                  </p>
                  {returnOrderSelected?.shippingCharge && (
                    <p className="text-gray-500">
                      Shipping:{" "}
                      {formatCurrency(returnOrderSelected.shippingCharge)}
                    </p>
                  )}
                </div>
              </div>

              {/* REASON */}
              <div>
                <label className="font-medium text-sm">Select Issue *</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option value="">-- Select a reason --</option>
                  {returnReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* IMAGES */}
              <div>
                <label className="font-medium text-sm">
                  Upload Images <span className="text-gray-400">(Max 5)</span>
                </label>

                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {returnImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-lg border overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(img)}
                        alt="return"
                        className="w-full h-24 object-cover"
                      />

                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        ✖
                      </button>
                    </div>
                  ))}

                  {returnImages.length < 5 && (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer text-gray-400 hover:border-blue-500 hover:text-blue-500 transition">
                      <span className="text-xl">＋</span>
                      <span className="text-xs">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Upload clear images showing the issue
                </p>
              </div>

              {/* VIDEO */}
              <div>
                <label className="font-medium text-sm">
                  Upload Video <span className="text-gray-400">(Optional)</span>
                </label>

                {!returnVideo ? (
                  <label className="mt-3 flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer text-gray-400 hover:border-blue-500 hover:text-blue-500 transition">
                    <span className="text-2xl">🎥</span>
                    <span className="text-sm mt-1">Click to upload video</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="mt-3 relative rounded-lg border overflow-hidden">
                    <video
                      src={URL.createObjectURL(returnVideo)}
                      controls
                      className="w-full max-h-60 object-cover"
                    />

                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={removeVideo}
                        className="bg-red-500 text-white px-3 py-1 text-xs rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MESSAGE */}
              <div>
                <label className="font-medium text-sm">
                  Describe the Issue *
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 mt-1 h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={returnMessage}
                  onChange={(e) => setReturnMessage(e.target.value)}
                  placeholder="Explain what went wrong with the product..."
                />
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={closeReturnModal}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={submitReturnRequest}
                  disabled={isReturning}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isReturning ? "Submitting..." : "Submit Return"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
