import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import empty from "../assets/emptyCart.jpg";
import login from "../assets/login1.png";
import ButtonPrimary from "../components/Buttons/ButtonPrimary";
import { useSelector, useDispatch } from "react-redux";
import { fetchCartItems } from "../redux/slices/cartSlice";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import { StaticRoutes } from "../utils/StaticRoutes";

const getVariantKey = (item) =>
  `${item.productCode}_${item.variantWeightValue}_${item.variantWeightUnit}`;
export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [data, setData] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const { items: reduxCartItems, cartData: reduxCartData, loading: reduxLoading } = useSelector(state => state.cart);

  /* ---------------- FETCH CART ---------------- */
  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      dispatch(fetchCartItems()).finally(() => setLoading(false));
    }
  }, [isLoggedIn, dispatch]);

  useEffect(() => {
    setCartItems(reduxCartItems);
    setData(reduxCartData);

    // Auto-select everything initially if nothing is selected
    if (selectedItems.length === 0 && reduxCartItems.length > 0) {
      setSelectedItems(reduxCartItems.map(getVariantKey));
    }
  }, [reduxCartItems, reduxCartData]);

  /* ---------------- OPTIMISTIC QUANTITY CHANGE ---------------- */
  const handleQuantityChange = (variantKey, change) => {
    const item = cartItems.find((i) => getVariantKey(i) === variantKey);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty <= 0) return;

    setCartItems((prev) =>
      prev.map((i) => {
        if (getVariantKey(i) !== variantKey) return i;

        const unitPrice = i.variantPrice;
        const unitDiscount = i.discountPrice / i.quantity;
        const unitGst = (i.gst || 0) / i.quantity;

        return {
          ...i,
          quantity: newQty,
          totalPrice: unitPrice * newQty,
          discountPrice: unitDiscount * newQty,
          afterDiscountAmount: unitPrice * newQty - unitDiscount * newQty,
          gst: unitGst * newQty,
        };
      })
    );

    if (change === 1) {
      services.post(
        `${StaticApi.addToCart}?productCode=${item.productCode}&quantity=1&weightValue=${item.variantWeightValue}&weightUnit=${item.variantWeightUnit}`
      ).then(() => dispatch(fetchCartItems()));
    } else {
      services.delete(
        `${StaticApi.removeSingleItemCart}?productCode=${item.productCode}&quantity=1&weightValue=${item.variantWeightValue}&weightUnit=${item.variantWeightUnit}`
      ).then(() => dispatch(fetchCartItems()));
    }
  };

  /* ---------------- REMOVE ITEM ---------------- */
  const handleRemove = (variantKey) => {
    const item = cartItems.find((i) => getVariantKey(i) === variantKey);
    if (!item) return;

    services
      .delete(
        `${StaticApi.removeProductFromCart}?productCode=${item.productCode}&weightValue=${item.variantWeightValue}&weightUnit=${item.variantWeightUnit}`
      )
      .then(() => {
        setCartItems((prev) =>
          prev.filter((i) => getVariantKey(i) !== variantKey)
        );
        setSelectedItems((prev) => prev.filter((k) => k !== variantKey));
        dispatch(fetchCartItems());
      });
  };

  /* ---------------- SELECTION ---------------- */
  const toggleSelectAll = () => {
    const allSelected = cartItems.every((item) =>
      selectedItems.includes(getVariantKey(item))
    );

    setSelectedItems(allSelected ? [] : cartItems.map(getVariantKey));
  };
  const toggleItemSelect = (variantKey) => {
    setSelectedItems((prev) =>
      prev.includes(variantKey)
        ? prev.filter((k) => k !== variantKey)
        : [...prev, variantKey]
    );

  };

  /* ---------------- TOTAL ---------------- */

  const priceSummary = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => {
        if (!selectedItems.includes(getVariantKey(item))) return acc;

        acc.subTotal += item.variantPrice * item.quantity;
        acc.discount += item.discountPrice || 0;
        acc.gst += item.gst || 0;

        acc.payable +=
          item.variantPrice * item.quantity -
          (item.discountPrice || 0) +
          (item.gst || 0);

        return acc;
      },
      {
        subTotal: 0,
        discount: 0,
        gst: 0,
        payable: 0,
        shippingCharge: 0,
      }
    );
  }, [cartItems, selectedItems]);

  /* ---------------- UI (UNCHANGED) ---------------- */
  return (
    <div className="px-4 h-full sm:px-6 lg:px-10 xl:px-20 2xl:px-[220px] py-5 flex flex-col lg:flex-row gap-6 bg-[oklch(0.9_0_0)]">
      <div className="flex-1 flex flex-col gap-5">
        <div className="p-5 bg-white rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-primary">Shopping Cart</h1>

            {cartItems.length > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    cartItems.length > 0 &&
                    cartItems.every((item) =>
                      selectedItems.includes(getVariantKey(item))
                    )
                  }
                  onChange={toggleSelectAll}
                  className="w-5 h-5"
                />
                Select All
              </label>
            )}
          </div>

          {!isLoggedIn ? (
            <div className="text-center text-primary text-lg font-medium">
              Please log in to view your cart.
              <div className="w-max flex self-center justify-self-center mt-4">
                <ButtonPrimary
                  label="Login"
                  handleOnClick={() => navigate(StaticRoutes.signin)}
                />
              </div>
              <img src={login} className="w-full object-cover" />
            </div>
          ) : loading ? (
            <p className="text-center py-10 text-gray-500">Loading...</p>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500 flex flex-col justify-center items-center">
              {" "}
              <div className="w-max gap-[20px] flex flex-col justify-center items-center">
                {" "}
                <p className="text-centers text-primary font-semibold text-lg">
                  Your cart is empty
                </p>{" "}
                <ButtonPrimary
                  label="Explore Products"
                  handleOnClick={() => navigate("/")}
                />{" "}
              </div>{" "}
              <img src={empty} alt="empty" className="w-full object-cover" />{" "}
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={getVariantKey(item)}
                className="flex flex-col sm:flex-row items-center gap-4 border-b py-4"
              >
                <div className="relative w-full flex-shrink-0 sm:hidden">
                  <input
                    type="checkbox"
                    className="absolute top-1 left-1 w-4 h-4 cursor-pointer"
                    checked={selectedItems.includes(getVariantKey(item))}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleItemSelect(getVariantKey(item));
                    }}
                  />
                  <img
                    src={item.variantImages?.[0]?.url}
                    alt={item.productName}
                    className="w-full h-full object-cover rounded-md"
                    onClick={() => {
                      navigate(`/product/${item.productCode}`);
                    }}
                  />
                </div>

                <div className="hidden sm:flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 cursor-pointer"
                    checked={selectedItems.includes(getVariantKey(item))}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleItemSelect(getVariantKey(item));
                    }}
                  />
                  <div className="w-[100px] h-[100px] flex-shrink-0">
                    <img
                      src={item.variantImages?.[0]?.url}
                      alt={item.productName}
                      className="w-full h-full object-cover rounded-md"
                      onClick={() => {
                        navigate(`/product/${item.productCode}`);
                      }}
                    />
                  </div>
                </div>

                <div
                  className="flex-1 w-full"
                  onClick={() => {
                    navigate(`/product/${item.productCode}`);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {item.productName}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item?.variantWeightValue} {item?.variantWeightUnit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 line-through">
                        ₹{item.variantPrice * item.quantity}
                      </p>

                      <p className="text-primary font-bold text-lg">
                        ₹{item.afterDiscountAmount}
                      </p>

                      {item.gst > 0 && (
                        <p className="text-xs text-gray-500">
                          GST: ₹{item.gst}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 flex-wrap">
                    <div className="flex items-center gap-2 bg-quaternary px-2 py-1 rounded-md">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(getVariantKey(item), -1);
                        }}
                        disabled={item.quantity === 1}
                        className={`p-1 rounded-md ${item.quantity === 1
                          ? "cursor-not-allowed text-gray-400"
                          : "hover:bg-gray-300"
                          }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold">{item.quantity}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(getVariantKey(item), 1);
                        }}
                        className="p-1 rounded-md hover:bg-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <span>|</span>

                    <button
                      className="text-red-500 flex items-center gap-1 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(getVariantKey(item));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {cartItems.length > 0 && (
        <div className="lg:w-[300px] xl:w-[340px] sticky top-[100px]">
          <div className="bg-white border p-5 rounded-2xl flex flex-col gap-4 max-h-[500px] overflow-y-auto">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <div className="flex justify-between text-sm">
              <span>Total Selected:</span>
              <span>{selectedItems.length}</span>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span>MRP:</span>
                <span>₹{priceSummary.subTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>−₹{priceSummary.discount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Discounted MRP:</span>
                <span>
                  ₹{(priceSummary.subTotal - priceSummary.discount).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>GST:</span>
                <span>₹{priceSummary.gst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span>₹{(data?.totalShippingCharge || 0).toFixed(2)}</span>
              </div>

              <hr />

              <div className="flex justify-between text-base font-semibold">
                <span>Total Payable:</span>
                <span className="text-primary">
                  ₹{(Number(priceSummary.payable) + Number(data?.totalShippingCharge || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              className={`mt-4 ${selectedItems.length === 0
                ? "bg-gray-300"
                : "bg-primary hover:bg-secondary"
                }  text-white py-2 rounded-md text-sm transition`}
              onClick={() => {
                const selected = cartItems.filter((item) =>
                  selectedItems.includes(getVariantKey(item))
                );

                localStorage.setItem(
                  "selectedCheckoutItems",
                  JSON.stringify(selected)
                );

                navigate("/checkout");
              }}
              disabled={selectedItems.length === 0}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
