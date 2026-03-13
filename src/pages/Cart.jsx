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
    <div className="px-4 min-h-screen sm:px-6 lg:px-10 xl:px-20 2xl:px-[220px] py-5 flex flex-col lg:flex-row items-start gap-6 bg-gray-50">
      <div className="flex-1 flex flex-col gap-5 w-full">
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
              <div className="w-max flex self-center justify-self-center mt-6">
                <ButtonPrimary
                  label="Login"
                  handleOnClick={() => navigate(StaticRoutes.signin)}
                />
              </div>
              <img src={login} className="w-64 h-64 sm:w-80 sm:h-80 object-contain mx-auto mix-blend-multiply mt-8 opacity-90" />
            </div>
          ) : loading ? (
            <p className="text-center py-10 text-gray-500">Loading...</p>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500 flex flex-col justify-center items-center">
              <img src={empty} alt="Empty Cart" className="w-48 h-48 sm:w-64 sm:h-64 object-contain mix-blend-multiply opacity-80 mb-6" />
              <div className="w-max gap-[20px] flex flex-col justify-center items-center">
                <p className="text-centers text-gray-800 font-semibold text-lg">
                  Your cart is empty
                </p>
                <div className="mt-2 text-sm text-gray-500 mb-6">Looks like you haven't added anything yet.</div>
                <ButtonPrimary
                  label="Explore Products"
                  handleOnClick={() => navigate("/")}
                />
              </div>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={getVariantKey(item)}
                className="flex items-center gap-3 sm:gap-4 border-b pb-4 pt-2 last:border-0 hover:bg-gray-50 transition-colors rounded-lg px-2 sm:px-0"
              >
                {/* Checkbox & Image container */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer accent-primary"
                    checked={selectedItems.includes(getVariantKey(item))}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleItemSelect(getVariantKey(item));
                    }}
                  />
                  <div 
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-white border rounded-md overflow-hidden cursor-pointer flex-shrink-0 shadow-sm"
                    onClick={() => navigate(`/product/${item.productCode}`)}
                  >
                    <img
                      src={item.variantImages?.[0]?.url}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Details & Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2">
                  <div 
                    className="flex-1 cursor-pointer w-full"
                    onClick={() => navigate(`/product/${item.productCode}`)}
                  >
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight line-clamp-2">
                      {item.productName}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Size: {item?.variantWeightValue} {item?.variantWeightUnit}
                    </p>

                    {/* Pricing */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm font-bold text-primary">
                        ₹{item.afterDiscountAmount}
                      </span>
                      {item.variantPrice * item.quantity > item.afterDiscountAmount && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{item.variantPrice * item.quantity}
                        </span>
                      )}
                      {item.gst > 0 && (
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">
                          +₹{item.gst} GST
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Quantity + Delete) */}
                  <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto justify-end mt-1 sm:mt-0">
                    <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm h-8">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(getVariantKey(item), -1);
                        }}
                        disabled={item.quantity === 1}
                        className={`px-2.5 h-full text-lg flex items-center justify-center font-medium transition-colors ${item.quantity === 1
                          ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 flex justify-center text-sm font-medium text-gray-800 bg-white select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(getVariantKey(item), 1);
                        }}
                        className="px-2.5 h-full text-lg flex items-center justify-center font-medium transition-colors text-gray-700 hover:bg-gray-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      title="Remove item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(getVariantKey(item));
                      }}
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {cartItems.length > 0 && (
        <div className="lg:w-[320px] xl:w-[350px] sticky top-[90px] self-start w-full">
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
