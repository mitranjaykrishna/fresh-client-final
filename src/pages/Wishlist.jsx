import React, { useEffect, useState } from "react";
import dairydumm from "../assets/dairy-dum.png";
import login from "../assets/login1.png";
import empty from "../assets/emptyWishlist.jpg";
import ButtonPrimary from "../components/Buttons/ButtonPrimary";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { StaticRoutes } from "../utils/StaticRoutes";
import { useSelector, useDispatch } from "react-redux";
import { fetchCartItems } from "../redux/slices/cartSlice";

export default function Wishlist() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const { isLoggedIn } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items) || [];
  const cartproductCodes = cartItems.map((item) => item.productCode);

  const getAllWishlist = async () => {
    setLoading(true);

    try {
      const res = await services.get(`${StaticApi.getUserWishlist}`);
      const wishlist = res?.data || [];

      const enrichedData = await Promise.all(
        wishlist.map(async (item) => {
          try {
            const response = await services.get(
              `${StaticApi.getProductByProductCode}/${item.productCode}`
            );
            return { ...item, ...response.data.data };
          } catch {
            return { ...item };
          }
        })
      );

      setWishlistItems(enrichedData);
    } catch {
    } finally {
      setLoading(false);
    }
  };



  const handleAddToCart = (item, quantity = 1, shouldNavigate) => {
    services
      .post(
        `${StaticApi.addToCart}?productCode=${item.productCode}&quantity=${quantity}&weightValue=${item.weightValue}&weightUnit=${item.weightUnit}`
      )
      .then(() => {
        dispatch(fetchCartItems());
        if (shouldNavigate) {
          navigate(StaticRoutes.checkout);
        }
      })
      .catch(() => { });
  };

  const handleRemoveFromCart = (productCode) => {
    const item = cartItems.find((i) => i.productCode === productCode);
    services
      .delete(
        `${StaticApi.removeProductFromCart}?productCode=${productCode}&weightValue=${item.variantWeightValue}&weightUnit=${item.variantWeightUnit}`
      )
      .then(() => {
        dispatch(fetchCartItems());
      })
      .catch(() => { });
  };

  const handleBuyNow = async (item) => {
    try {
      const quantity = 1;

      // price calculations
      const discountAmount = (item.price * item.discount) / 100;
      const afterDiscountAmount = item.price - discountAmount;
      const payingAmount = afterDiscountAmount * quantity;
      const isAlreadyInCart = cartItems?.some(
        (cartItem) =>
          cartItem.productCode === item.productCode &&
          cartItem.variantWeightValue === item.weightValue &&
          cartItem.variantWeightUnit === item.weightUnit
      );

      if (!isAlreadyInCart) {
        await services.post(
          `${StaticApi.addToCart}?productCode=${item.productCode}&quantity=${quantity}&weightValue=${item.weightValue}&weightUnit=${item.weightUnit}`
        );
      }
      const checkoutItem = {
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,

        variantId: item.variantId,
        variantWeightValue: item.weightValue,
        variantWeightUnit: item.weightUnit,

        variantPrice: item.price,
        variantDiscount: item.discount,

        quantity,

        totalQtyPrice: item.price * quantity,
        discountPrice: discountAmount,
        afterDiscountAmount,
        payingAmount,

        gst: 0,
        shippingCharge: 0,

        variantImages: item.variantImages?.[0]?.url || "",
        addedDate: new Date().toISOString(),
      };

      localStorage.setItem(
        "selectedCheckoutItems",
        JSON.stringify([checkoutItem])
      );

      await dispatch(fetchCartItems());
      navigate(StaticRoutes.checkout);
    } catch (error) {
      console.error(error);
      toast.error("Unable to proceed with Buy Now");
    }
  };

  const handleRemoveFromWishlist = (item) => {
    services
      .delete(
        `${StaticApi.removeFromWishlist}?productCode=${item.productCode}&weightValue=${item.weightValue}&weightUnit=${item.weightUnit}`
      )
      .then(() => {
        toast.success("Removed from wishlist");

        setWishlistItems((prev) =>
          prev.filter(
            (wishlistItem) =>
              !(
                wishlistItem.productCode === item.productCode &&
                wishlistItem.weightValue === item.weightValue &&
                wishlistItem.weightUnit === item.weightUnit
              )
          )
        );
      })
      .catch(() => { });
  };

  const totalSummary = wishlistItems.reduce(
    (sum, item) => {
      const price = Number(item.price || 0);
      const discount = Number(item.discount || 0);
      const discountedPrice = discount > 0 && discount <= 100 ? price - (price * discount) / 100 : price;
      return sum + discountedPrice;
    },
    0
  );

  useEffect(() => {
    if (isLoggedIn) {
      getAllWishlist();
      dispatch(fetchCartItems());
    }
  }, [isLoggedIn, dispatch]);

  return (
    <div className="py-5  sm:px-6 lg:px-10 xl:px-20 2xl:px-[220px]">
      <div className="w-full h-full p-5 flex flex-col gap-6 rounded-2xl bg-white">
        {!isLoggedIn ? (
          <div className="text-center  text-primary text-lg font-medium">
            Please log in to view your wishlist.{" "}
            <div className="w-max flex self-center justify-self-center mt-4">
              {" "}
              <ButtonPrimary
                label="Login "
                handleOnClick={() => navigate(StaticRoutes.signin)}
              />{" "}
            </div>{" "}
            <img src={login} alt="login" className="w-full object-cover" />
          </div>
        ) : (
          <>
            <span className="text-xl font-semibold text-primary">
              Your Wishlist
            </span>

            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-10 text-gray-500 flex flex-col justify-center items-center">
                <img
                  src={empty}
                  alt="empty wishlist"
                  className="w-48 h-48 sm:w-64 sm:h-64 object-contain mix-blend-multiply opacity-80 mb-6"
                />
                <div className="w-max gap-[20px] flex flex-col justify-center items-center">
                  <p className="text-centers text-gray-800 font-semibold text-lg">
                    Your wishlist is empty
                  </p>
                  <div className="mt-2 text-sm text-gray-500 mb-6">Explore products and add them to your wishlist.</div>
                  <ButtonPrimary
                    label="Explore Products"
                    handleOnClick={() => navigate("/")}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mt-4">
                  {wishlistItems.map((item) => {
                    const price = Number(item?.price || 0);
                    const discount = Number(item?.discount || 0);
                    const hasDiscount = price > 0 && discount > 0 && discount <= 100;
                    const discountedPrice = hasDiscount
                      ? price - (price * discount) / 100
                      : price;

                    return (
                      <div
                        key={item.productCode}
                        className="flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
                        onClick={() => navigate(`/product/${item.productCode}`)}
                      >
                        {/* Image */}
                        <div className="w-full aspect-square bg-gray-50 p-4 relative">
                          <img
                            src={item.productImages?.url}
                            alt={item.name}
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromWishlist(item);
                            }}
                            className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-red-50 hover:text-red-500 text-gray-400 backdrop-blur-sm transition-colors shadow-sm"
                            title="Remove from Wishlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col p-4 flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 min-h-[40px]">
                            {item.name}
                          </h3>

                          <div className="mt-2 flex items-center gap-2 flex-wrap min-h-[24px]">
                            <span className="text-primary font-bold">
                              ₹{discountedPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span className="line-through text-xs text-gray-400">
                                ₹{price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                            {cartproductCodes.includes(item.productCode) ? (
                              <button
                                className="w-full py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromCart(item.productCode);
                                }}
                              >
                                Remove cart
                              </button>
                            ) : (
                              <button
                                className="w-full py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-secondary transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(item);
                                }}
                              >
                                Add to Cart
                              </button>
                            )}

                            <button
                              className="w-full py-2 border border-primary text-primary text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyNow(item);
                              }}
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Wishlist Summary */}
                <div className="mt-6 border-t pt-4 text-right">
                  <span className="text-base sm:text-lg font-medium text-gray-700">
                    Total ({wishlistItems.length} items):{" "}
                    <span className="text-primary font-semibold">
                      ₹{totalSummary.toFixed(2)}
                    </span>
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
