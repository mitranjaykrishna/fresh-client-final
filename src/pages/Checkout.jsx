// --- Imports ---
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import amex from "../assets/amex.png";
import mastercard from "../assets/mastercard.png";
import rupay from "../assets/rupay.png";
import visa from "../assets/visa.png";
import ButtonPrimary from "../components/Buttons/ButtonPrimary";
import { StaticApi } from "../utils/StaticApi";
import { services } from "../utils/services";
import { StaticRoutes } from "../utils/StaticRoutes";
import { useNavigate } from "react-router";
import StateCity from "../utils/StateCity.json";
import { useDispatch, useSelector } from "react-redux";
import { fetchCartItems } from "../redux/slices/cartSlice";

// --- Checkout Component ---
const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userName, userPhone } = useSelector((state) => state.auth);
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [addressList, setAddressList] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [checkoutProducts, setCheckoutProducts] = useState([]);
  const [wasLastItemDeleted, setWasLastItemDeleted] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [states, setStates] = useState(Object.keys(StateCity));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cities, setCities] = useState([]);
  const [newAddress, setNewAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    userNumber: "",
    userName: "",
    default: true,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (showAddAddress && !isEditing) {
      setNewAddress({
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        userNumber: userPhone || "",
        userName: userName || "",
        default: false,
      });
    }
  }, [showAddAddress, isEditing, userName, userPhone]);

  const isVariantInCart = (cartItems, item) => {
    return cartItems.some(
      (c) =>
        c.productCode === item.productCode &&
        c.variantWeightValue === item.variantWeightValue &&
        c.variantWeightUnit === item.variantWeightUnit
    );
  };

  const handleCart = async () => {
    try {
      // 1️ Get latest cart from backend
      const cartRes = await services.get(StaticApi.getUserCart);
      const cartItems = cartRes?.data?.items || [];

      // 2️ Loop checkout products
      for (const item of checkoutProducts) {
        const exists = isVariantInCart(cartItems, item);

        if (!exists) {
          await services.post(
            `${StaticApi.addToCart}?productCode=${item.productCode}&quantity=${item.quantity}&weightValue=${item.variantWeightValue}&weightUnit=${item.variantWeightUnit}`
          );
        }
      }
    } catch (err) {
      toast.error("Failed to sync cart");
      throw err;
    }
  };

  const getOrders = async () => {
    try {
      await services.get(`${StaticApi.getMyOrders}`);
    } catch (err) { }
  };

  const handlePayment = async () => {
    if (selectedAddress === null) {
      toast.error("Please select a delivery address");
      return;
    }

    const payload = {
      address: addressList[selectedAddress],
      selectedVariants: checkoutProducts.map((p) => ({
        productCode: p.productCode,
        weightValue: p.variantWeightValue,
        weightUnit: p.variantWeightUnit,
      })),
    };

    try {
      // Ensure cart is synced
      await handleCart();

      const res = await services.post(StaticApi.placeOrder, payload);

      localStorage.removeItem("selectedCheckoutItems");

      navigate(StaticRoutes.thankYou, {
        state: { orderId: res?.data?.data?.orderId },
      });

      dispatch(fetchCartItems());
      getOrders();
    } catch {
      toast.error("Failed to place order");
    }
  };



  const handleAddAddress = () => {
    const requiredFields = [
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
      "userName",
      "userNumber",
    ];
    let isValid = true;
    let newError = {};

    requiredFields.forEach((field) => {
      if (!newAddress[field]?.trim()) {
        newError[field] = `Enter valid ${field}`;
        isValid = false;
      }
    });

    if (!isValid) {
      setFormErrors(newError);
      return;
    }

    setFormErrors({});

    const apiCall =
      editIndex !== null
        ? services.put(
          `${StaticApi.updateAddress}/${newAddress.addressId}`,
          newAddress
        )
        : services.post(StaticApi.createAddress, newAddress);

    apiCall
      .then((response) => {
        if (editIndex === null && response.data?.addressId) {
          localStorage.setItem("recentlyAddedAddress", response.data.addressId);
        }
        if (newAddress.default && !isEditing)
          handleSetDefaultAddress(response.data?.addressId);

        setShowAddAddress(false);
        setIsEditing(false);
        setEditIndex(null);
        setNewAddress({
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India", // keep default country
          userNumber: "",
          userName: "",
          default: false,
        });
        getAllAddress();
      })
      .catch(() => { });
  };

  const handleDeleteAddress = (addressId) => {
    services
      .delete(`${StaticApi.deleteAddress}/${addressId}`)
      .then(() => {
        getAllAddress();
      })
      .catch(() => { });
  };

  const handleSetDefaultAddress = (addressId) => {
    services
      .post(`${StaticApi.setDefaultAddress}/${addressId}`)
      .then(() => {
        getAllAddress();
      })
      .catch(() => { });
  };

  const getAllAddress = () => {
    services
      .get(`${StaticApi.getAllAddressesOfUser}`)
      .then((res) => {
        const data = res?.data || [];

        // Filter out incomplete addresses
        const filteredAddresses = data.filter(
          (address) =>
            address.state?.trim() &&
            address.city?.trim() &&
            address.postalCode?.trim()
        );

        const recentlyAddedId = localStorage.getItem("recentlyAddedAddress");
        let selectedIndex = 0;

        // Decide selected address index
        if (recentlyAddedId) {
          selectedIndex = filteredAddresses.findIndex(
            (addr) => addr.addressId == recentlyAddedId
          );

          if (selectedIndex === -1) {
            selectedIndex = filteredAddresses.findIndex((addr) => addr.default);
          }

          // localStorage.removeItem("recentlyAddedAddress");
        } else {
          selectedIndex = filteredAddresses.findIndex((addr) => addr.default);
        }

        if (selectedIndex === -1) selectedIndex = 0;

        // Move selected address to the top
        const sortedAddresses = [
          filteredAddresses[selectedIndex],
          ...filteredAddresses.filter((_, idx) => idx !== selectedIndex),
        ];

        setAddressList(sortedAddresses);
        setSelectedAddress(0); // Always select the top one
      })
      .catch(() => { });
  };

  const handleDeleteCheckoutItem = (productId) => {
    const updatedItems = checkoutProducts.filter(
      (item) => item.productId !== productId
    );
    setCheckoutProducts(updatedItems);

    if (checkoutProducts.length === 1) {
      setWasLastItemDeleted(true);
    }
  };

  const calculatePrices = (item, newQty) => {
    const totalPrice = item.variantPrice * newQty;
    const discountPrice = (totalPrice * item.variantDiscount) / 100;
    const afterDiscountAmount = totalPrice - discountPrice;

    return {
      ...item,
      quantity: newQty,
      totalPrice,
      totalQtyPrice: totalPrice,
      discountPrice,
      afterDiscountAmount,
      payingAmount: afterDiscountAmount / 2, // adjust if needed
    };
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    getAllAddress();
    const stored = localStorage.getItem("selectedCheckoutItems");
    if (stored) {
      setCheckoutProducts(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (checkoutProducts.length === 0 && wasLastItemDeleted) {
      navigate(StaticRoutes.home);
      localStorage.setItem("selectedCheckoutItems", JSON.stringify([]));
    }
  }, [checkoutProducts, wasLastItemDeleted]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>

      {/* Address Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
        <div className="grid gap-4">
          {(addressList.length > 0 && addressList[0] !== undefined) &&
            (showMore ? addressList : addressList?.slice(0, 1))?.map(
              (addr, index) => (
                <AddressCard
                  key={addr?.addressId || index}
                  address={addr}
                  selected={selectedAddress === index}
                  onChange={() => setSelectedAddress(index)}
                  onEdit={(addr) => {
                    setIsEditing(true);
                    setEditIndex(index);
                    setNewAddress(addr);
                    setShowAddAddress(true);
                  }}
                  onDelete={() => handleDeleteAddress(addr.addressId)}
                  onSetDefault={() => handleSetDefaultAddress(addr.addressId)}
                />
              )
            )}

          {addressList.length > 1 && (
            <button
              className="mt-2 text-primary underline text-sm text-left"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? "Show Less" : "Show More"}
            </button>
          )}

          <div
            onClick={() => setShowAddAddress(true)}
            className="cursor-pointer w-max inline-flex items-center gap-2 text-primary font-semibold border p-3 rounded hover:bg-gray-50"
          >
            <span className="text-2xl">➕</span> Add Address
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Payment method</h2>
        <div className="grid gap-4">
          <CardPaymentOption
            setShowCardModal={setShowCardModal}
            selected={selectedPayment === "card"}
            onChange={() => setSelectedPayment("card")}
          />
          <UpiInputCard
            selected={selectedPayment === "upi"}
            onChange={() => setSelectedPayment("upi")}
            upiId={upiId}
            setUpiId={setUpiId}
            onVerify={() => console.log("Verifying", upiId)}
          />
          <PaymentMethodCard
            label="Cash on Delivery"
            selected={selectedPayment === "cod"}
            onChange={() => setSelectedPayment("cod")}
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        {checkoutProducts.map((item, idx) => (
          <OrderItem
            key={idx}
            item={item}
            onQuantityChange={(item, newQty) => {
              if (newQty < 1) return;

              const updated = checkoutProducts.map((i) =>
                i.productId === item.productId ? calculatePrices(i, newQty) : i
              );

              setCheckoutProducts(updated);
              localStorage.setItem(
                "selectedCheckoutItems",
                JSON.stringify(updated)
              );

              const change = newQty - item.quantity;

              if (change > 0) {
                services.post(
                  `${StaticApi.addToCart}?productCode=${item.productCode}&quantity=${change}&weightValue=${item.variantWeightValue}&weightUnit=${item.variantWeightUnit}`
                );
              } else {
                services.delete(
                  `${StaticApi.removeSingleItemCart}?productCode=${item.productCode
                  }&quantity=${-change}&weightValue=${item.variantWeightValue
                  }&weightUnit=${item.variantWeightUnit}`
                );
              }
            }}
            onRemove={(item) => handleDeleteCheckoutItem(item.productId)}
          />
        ))}

        <PriceSummary items={checkoutProducts} />
        <div className="mt-6 w-max">
          <ButtonPrimary label="Place Order" handleOnClick={handlePayment} />
        </div>
      </div>

      {/* Address Drawer */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${showAddAddress ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${showAddAddress ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => {
            setShowAddAddress(false);
            setIsEditing(false);
            setEditIndex(null);
            setFormErrors({});
          }}
        />
        <div
          className={`relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${showAddAddress ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {/* ---------- Header ---------- */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold">
              {isEditing ? "Edit Address" : "Add New Address"}
            </h3>

            <button
              onClick={() => {
                setShowAddAddress(false);
                setIsEditing(false);
                setEditIndex(null);
                setFormErrors({});
              }}
              className="text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>
          </div>

          {/* ---------- Body ---------- */}
          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
            {[
              ["Name", "userName", true],
              ["Phone", "userNumber", true],
              ["Address Line 1", "addressLine1", true],
              ["Address Line 2", "addressLine2", false],
              ["Postal Code", "postalCode", true],
            ].map(([label, key, isRequired]) => (
              <InputField
                key={key}
                label={label}
                required={isRequired}
                error={formErrors[key]}
                value={newAddress[key]}
                onChange={(e) => {
                  setNewAddress((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }));
                  if (formErrors[key]) {
                    setFormErrors(prev => ({ ...prev, [key]: null }));
                  }
                }}
              />
            ))}

            {/* ---------- State Dropdown ---------- */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1">State <span className="text-red-500">*</span></label>
              <div
                className={`w-full border rounded px-3 py-2 text-left bg-white cursor-pointer ${
                  formErrors.state ? "border-red-500" : "border-gray-300"
                }`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {selectedState || <span className={formErrors.state ? "text-red-500" : "text-gray-500"}>{formErrors.state ? "Required field" : "Select State"}</span>}
              </div>

              {dropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow">
                  <div className="p-2 border-b sticky top-0 bg-white">
                    <input
                      type="text"
                      placeholder="Search state..."
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm outline-none"
                      autoFocus
                    />
                  </div>
                  <ul className="max-h-48 overflow-y-auto">
                    {states
                      .filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))
                      .map((state) => (
                        <li
                          key={state}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedState(state);
                            setNewAddress((prev) => ({
                              ...prev,
                              state,
                              city: "",
                            }));
                            setCities(StateCity[state] || []);
                            setDropdownOpen(false);
                            setStateSearch("");
                            if (formErrors.state) {
                              setFormErrors(prev => ({ ...prev, state: null }));
                            }
                          }}
                        >
                          {state}
                        </li>
                      ))}
                    {states.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
                      <li className="px-4 py-2 text-gray-500 text-sm">No state found</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* ---------- City Dropdown ---------- */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1">City <span className="text-red-500">*</span></label>
              <div
                className={`w-full border rounded px-3 py-2 text-left ${!selectedState ? "bg-gray-100 cursor-not-allowed" : "bg-white cursor-pointer"} ${
                  formErrors.city ? "border-red-500" : "border-gray-300"
                }`}
                onClick={() => selectedState && setCityDropdownOpen(!cityDropdownOpen)}
              >
                {newAddress.city || <span className={formErrors.city ? "text-red-500" : "text-gray-500"}>{formErrors.city ? "Required field" : "Select City"}</span>}
              </div>

              {cityDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow">
                  <div className="p-2 border-b sticky top-0 bg-white">
                    <input
                      type="text"
                      placeholder="Search city..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm outline-none"
                      autoFocus
                    />
                  </div>
                  <ul className="max-h-48 overflow-y-auto">
                    {cities
                      .filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
                      .map((city) => (
                        <li
                          key={city}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setNewAddress((prev) => ({ ...prev, city }));
                            setCityDropdownOpen(false);
                            setCitySearch("");
                            if (formErrors.city) {
                              setFormErrors(prev => ({ ...prev, city: null }));
                            }
                          }}
                        >
                          {city}
                        </li>
                      ))}
                    {cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && (
                      <li className="px-4 py-2 text-gray-500 text-sm">No city found</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* ---------- Country ---------- */}
            <InputField label="Country" value={newAddress.country} disabled required />

            {/* ---------- Default Checkbox ---------- */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="defaultAddr"
                checked={newAddress.default}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    default: e.target.checked,
                  }))
                }
                className="w-4 h-4"
              />
              <label htmlFor="defaultAddr" className="text-sm">
                Set as default address
              </label>
            </div>
          </div>

          {/* ---------- Footer ---------- */}
          <div className="px-6 py-4 border-t">
            <ButtonPrimary
              label={isEditing ? "Update Address" : "Save Address"}
              handleOnClick={handleAddAddress}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Card Modal */}
      {showCardModal && (
        <AddCardModal
          onClose={() => {
            setNewAddress({
              addressLine1: "",
              addressLine2: "",
              city: "",
              state: "",
              postalCode: "",
              country: "India", // keep default country
              userNumber: "",
              userName: "",
              default: false,
            });
            setShowCardModal(false);
          }}
          onSubmit={(cardData) => {
            setShowCardModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Checkout;

// --- Reusable Components ---
const AddressCard = ({
  address,
  selected,
  onChange,
  onEdit,
  onDelete,
  onSetDefault,
}) => (
  <label
    className={`block border flex justify-between items-start rounded-lg p-4 transition cursor-pointer ${selected ? "border-primary bg-green-50" : "hover:border-primary"
      }`}
  >
    <div className="flex items-start gap-3">
      <input
        type="radio"
        name="address"
        checked={selected}
        onChange={onChange}
        className="mt-1"
      />
      <div>
        <p className="font-semibold">
          {address?.userName ? address?.userName : "N/A"} -{" "}
          {address?.userNumber}
        </p>
        <p>{address?.addressLine1}</p>
        <p>
          {address?.city}, {address?.state} - {address?.postalCode}
        </p>
        <p className="text-sm text-gray-600">{address?.userNumber}</p>

        {address?.default ? (
          <span className="text-sm font-semibold text-green-600 mt-2 inline-block">
            ★ Default Address
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault(address);
            }}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            Set as Default
          </button>
        )}
      </div>
    </div>

    <div className="flex items-end gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(address);
        }}
        className="text-gray-500 hover:text-primary transition text-sm cursor-pointer"
        title="Edit address"
      >
        ✏️
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(address);
        }}
        className="text-red-500 hover:text-red-700 transition text-sm cursor-pointer"
        title="Delete address"
      >
        🗑️
      </button>
    </div>
  </label>
);

const PaymentMethodCard = ({ label, selected, onChange }) => (
  <label
    className={`block border rounded-lg p-4 cursor-pointer transition ${selected ? "bg-green-50 border-green-400" : ""
      }`}
  >
    <div className="flex items-center">
      <input
        type="radio"
        name="payment"
        checked={selected}
        onChange={onChange}
        className="mr-3"
      />
      <span className="font-medium">{label}</span>
    </div>
  </label>
);

const OrderItem = ({ item, onQuantityChange, onRemove }) => {
  const getImageSrc = (item) => {
    if (typeof item?.variantImages === "string") {
      return item.variantImages;
    }

    if (Array.isArray(item?.variantImages) && item.variantImages.length > 0) {
      return item.variantImages[0]?.url;
    }

    if (item?.imageUrl) {
      return item.imageUrl;
    }

    return "";
  };
  return (
    <div className="flex gap-4 border rounded p-4 mb-4 shadow-sm w-max">
      {/* Image */}
      <img
        src={getImageSrc(item)}
        alt={item?.productName}
        loading="lazy"
        className="w-[100px] h-[100px]"
      />
      {/* Details */}
      <div className="flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-lg font-semibold">
            {item.name || item?.productName}
          </h3>

          <p className="text-sm text-gray-600 mt-1">
            Size: {item.variantWeightValue || "N/A"} {item.variantWeightUnit}
          </p>

          {/* PRICE */}
          <div className="mt-2 flex items-center gap-2">
            {/* Final price */}
            <span className="text-xl font-bold text-primary">
              ₹{item.afterDiscountAmount ?? item.variantPrice}
            </span>

            {/* Cut price */}
            {item.variantDiscount > 0 && (
              <span className="text-sm text-gray-400 line-through">
                ₹{item.variantPrice}
              </span>
            )}

            {/* Discount badge */}
            {item.variantDiscount > 0 && (
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                {item.variantDiscount}% OFF
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          {/* Quantity controls */}

          <div className="inline-flex items-center border border-gray-300 rounded-full overflow-hidden shadow-sm w-max">
            <button
              className={`px-4 py-1 text-lg font-semibold transition-all ${item.quantity <= 1
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-primary hover:bg-gray-200"
                }`}
              onClick={() => onQuantityChange(item, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              –
            </button>

            <span className="px-5 py-1 text-base font-medium text-gray-700 bg-white select-none">
              {item.quantity}
            </span>

            <button
              className={`px-4 py-1 text-lg font-semibold transition-all ${item.quantity >= item?.stockQuantity
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-primary hover:bg-gray-200"
                }`}
              onClick={() => onQuantityChange(item, item.quantity + 1)}
            >
              +
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={() => onRemove(item)}
            className="ml-4 text-red-600 text-xl hover:text-red-800"
            title="Remove item"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
};

const PriceSummary = ({ items = [] }) => {
  const shipping = items?.[0]?.shippingCharge;
  const summary = items.reduce(
    (acc, item) => {
      acc.subtotal +=
        item.variantPrice * item.quantity || item?.price * item.quantity;
      acc.discount += item.discountPrice || 0;
      acc.gst += item.gst || 0;
      acc.afterDiscount += item.afterDiscountAmount || 0;
      acc.payable += item.payingAmount || 0;
      return acc;
    },
    {
      subtotal: 0,
      discount: 0,
      gst: 0,
      afterDiscount: 0,
      payable: 0,
    }
  );

  const grandTotal = summary.payable + shipping;

  return (
    <div className="mt-4 bg-white rounded-xl border border-quaternary p-4 space-y-3 text-sm">
      {/* Subtotal */}
      <div className="flex justify-between text-gray-700">
        <span>MRP</span>
        <span className="font-medium">₹{summary.subtotal.toFixed(2)}</span>
      </div>

      {/* Discount */}
      {summary.discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount</span>
          <span className="font-medium">− ₹{summary.discount.toFixed(2)}</span>
        </div>
      )}

      {/* After Discount */}
      <div className="flex justify-between text-gray-800">
        <span>Discounted MRP</span>
        <span className="font-medium">₹{summary.afterDiscount.toFixed(2)}</span>
      </div>

      {/* GST */}
      <div className="flex justify-between text-gray-600">
        <span>GST</span>
        <span>₹{summary.gst.toFixed(2)}</span>
      </div>

      {/* Shipping */}
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Delivery Charges</span>
        {shipping === 0 ? (
          <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full">
            FREE
          </span>
        ) : (
          <span className="font-medium">₹{shipping?.toFixed(2)}</span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed pt-3 mt-2" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-base font-semibold">Total Payable</p>
          <p className="text-xs text-gray-500">Inclusive of all taxes</p>
        </div>
        <span className="text-xl font-bold text-primary">
          ₹{grandTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

const InputField = ({ label, type = "text", value, onChange, error, disabled, required }) => (
  <div>
    <label className="block mb-1 font-medium">{label} {required && <span className="text-red-500">*</span>}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full border rounded p-2 ${error ? "border-red-500 placeholder-red-400" : "border-gray-300"
        } ${disabled ? "bg-gray-100" : ""}`}
      placeholder={error ? "Required field" : label}
    />
  </div>
);

const CardPaymentOption = ({ selected, onChange, setShowCardModal }) => {
  return (
    <label
      className={`block border rounded-lg p-4 w-full cursor-pointer transition ${selected ? "bg-green-50 border-green-400" : ""
        }`}
    >
      <div className="flex items-center mb-1">
        <input
          type="radio"
          name="payment"
          checked={selected}
          // onChange={onChange}
          className="mr-2"
          readOnly
          disabled
        />
        <span className="font-medium text-lg text-gray-400">
          Credit or debit card
        </span>
      </div>

      {selected && (
        <>
          <div className="flex flex-wrap gap-2 mt-3 mb-3">
            {[visa, mastercard, amex, rupay].map((img, i) => (
              <img key={i} src={img} alt="Card" className="w-10 h-auto" />
            ))}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-blue-600 font-medium hover:underline cursor-pointer"
              onClick={() => setShowCardModal(true)}
            >
              Add a new credit or debit card
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-1">
            We accept all major credit & debit cards
          </p>
        </>
      )}
    </label>
  );
};

const AddCardModal = ({ onClose, onSubmit }) => {
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    nickname: "",
    expiryMonth: "01",
    expiryYear: "2025",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setCardDetails((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!/^\d{16}$/.test(cardDetails.cardNumber)) {
      newErrors.cardNumber = "Card number must be 16 digits";
    }
    if (!cardDetails.nickname.trim()) {
      newErrors.nickname = "Nickname is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(cardDetails);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 bg-opacity-40 backdrop-blur-sm flex items-center justify-center px-2">
      <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6 relative flex flex-col sm:flex-row gap-6">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-xl text-gray-700 hover:text-black border border-gray-300 rounded-lg px-2"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Left Form */}
        <div className="flex-1">
          <h2 className="font-bold text-lg mb-4">
            Add a new credit or debit card
          </h2>
          <div className="space-y-4">
            {/* Card number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="font-medium col-span-1">Card number</label>
              <div className="col-span-3">
                <input
                  type="text"
                  value={cardDetails.cardNumber}
                  onChange={(e) => handleChange("cardNumber", e.target.value)}
                  placeholder="Enter card number"
                  className="border w-full p-2 rounded"
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.cardNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Nickname */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="font-medium col-span-1">Nickname</label>
              <div className="col-span-3">
                <input
                  type="text"
                  value={cardDetails.nickname}
                  onChange={(e) => handleChange("nickname", e.target.value)}
                  placeholder="Eg. Vaishnavi"
                  className="border w-full p-2 rounded"
                />
                {errors.nickname && (
                  <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>
                )}
              </div>
            </div>

            {/* Expiry */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="font-medium col-span-1">Expiry date</label>
              <div className="col-span-3 flex gap-3">
                <select
                  value={cardDetails.expiryMonth}
                  onChange={(e) => handleChange("expiryMonth", e.target.value)}
                  className="border rounded p-2 w-24"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, "0");
                    return (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    );
                  })}
                </select>
                <select
                  value={cardDetails.expiryYear}
                  onChange={(e) => handleChange("expiryYear", e.target.value)}
                  className="border rounded p-2 w-28"
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = (new Date().getFullYear() + i).toString();
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-start gap-3 mt-4">
              <button
                className="border rounded px-4 py-2 text-gray-700"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="bg-yellow-400 text-black font-semibold px-5 py-2 rounded hover:bg-yellow-500"
                onClick={handleSubmit}
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        {/* Right Info */}
        <div className="w-full sm:w-1/3 border-t sm:border-t-0 sm:border-l sm:pl-6 pt-4 sm:pt-0 flex flex-col items-center justify-start">
          <p className="text-sm mb-4">
            Please ensure that you enable your card for online payments from
            your bank’s app.
          </p>
          <div className="flex flex-wrap gap-2">
            {[visa, mastercard, amex, rupay].map((img, i) => (
              <img key={i} src={img} alt="Card" className="w-10 h-auto" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UpiInputCard = ({ selected, onChange, upiId, setUpiId, onVerify }) => {
  return (
    <label
      className={`block border rounded-lg p-4 transition ${selected ? "bg-green-50 border-green-400" : ""
        }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <input
          type="radio"
          name="payment"
          checked={selected}
          // onChange={onChange}
          className="accent-primary"
          readOnly
          disabled
        />
        <span className="font-semibold text-lg text-gray-400">
          Other UPI Apps
        </span>
      </div>

      {selected && (
        <>
          <p className="mb-2 text-sm font-medium">Please enter your UPI ID</p>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="Enter UPI ID"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="border rounded px-3 py-2 w-60"
            />
            <button
              onClick={onVerify}
              className="bg-yellow-100 text-yellow-700 font-medium px-4 py-2 rounded border border-yellow-300 hover:bg-yellow-200"
            >
              Verify
            </button>
          </div>
          <p className="text-sm text-gray-700">
            The UPI ID is in the format of{" "}
            <span className="font-medium">name/phone@bank</span>
          </p>
        </>
      )}
    </label>
  );
};
