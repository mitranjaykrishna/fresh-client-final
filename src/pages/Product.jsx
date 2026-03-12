import React, { useState, useEffect } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import FeatureCarousel from "../components/HomeHelper/FeatureCarousel";
import { useNavigate, useParams } from "react-router-dom"; // For getting product code from URL
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/free-mode";
import { toast } from "react-toastify";
import LoginModal from "../components/Login/LoginModal";
import { cartEvents } from "../utils/commonFunctions";

const DEFAULT_REVIEWS = [
  {
    id: 1,
    userName: "Amit Sharma",
    rating: 5,
    comment:
      "Excellent quality and super fresh. Delivery was fast and packaging was neat.",
    createdAt: "2024-11-12",
  },
  {
    id: 2,
    userName: "Priya Verma",
    rating: 4,
    comment: "Good product overall. Value for money. Will definitely reorder.",
    createdAt: "2024-11-10",
  },
  {
    id: 3,
    userName: "Rahul Mehta",
    rating: 5,
    comment:
      "Very satisfied with the quality. Exactly as described on the app.",
    createdAt: "2024-11-08",
  },
  {
    id: 4,
    userName: "Sneha Kapoor",
    rating: 3,
    comment: "Product is good but delivery took slightly longer than expected.",
    createdAt: "2024-11-05",
  },
  {
    id: 5,
    userName: "Vikas Singh",
    rating: 4,
    comment: "Nice experience overall. Fresh stock and reasonable pricing.",
    createdAt: "2024-11-02",
  },
];

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const reviews = product?.reviews || DEFAULT_REVIEWS;
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [isInCart, setIsInCart] = useState(false);
  const [wishlistAnimation, setWishlistAnimation] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [cartData, setCartData] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const getProductDetails = () => {
    setLoading(true);
    setError(null);

    services
      .get(`${StaticApi.getProductByProductCode}/${id}`)
      .then((response) => {
        setProduct(response?.data?.data);
        getRelatedProducts(response?.data?.data);
        getUserCart(response?.data?.data);
      })
      .catch(() => {
        setError("Failed to load product. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleQuantityChange = (change) => {
    const maxQty =
      selectedVariant?.availableQty ??
      selectedVariant?.stockQuantity ??
      product?.stockQuantity ??
      1;

    const newQuantity = quantity + change;

    if (newQuantity >= 1 && newQuantity <= maxQty) {
      setQuantity(newQuantity);
    }
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!token;
  };

  const handleCart = async (goToCheckout = false) => {
    if (!isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }

    const productCodeToUse = selectedVariant?.productCode || id;
    const weightValueToUse = selectedVariant?.weightValue;
    const weightUnitToUse = selectedVariant?.weightUnit;

    //  Match cart item by productCode + weight variant
    const cartItem = cartData?.find(
      (item) =>
        item.productCode === productCodeToUse &&
        item.variantWeightValue === weightValueToUse &&
        item.variantWeightUnit === weightUnitToUse
    );

    const isVariantInCart = cartData.some(
      (item) =>
        item.productCode === (selectedVariant?.productCode || id) &&
        item.variantWeightValue === selectedVariant?.weightValue &&
        item.variantWeightUnit === selectedVariant?.weightUnit
    );

    if (!isVariantInCart) {
      // Add to cart
      services
        .post(
          `${StaticApi.addToCart}?productCode=${productCodeToUse}&quantity=${quantity}&weightValue=${weightValueToUse}&weightUnit=${weightUnitToUse}`
        )
        .then(async () => {
          setIsInCart(true);
          await getUserCart(product);
          if (goToCheckout) navigate("/checkout");
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else if (!goToCheckout) {
      // Remove this exact variant
      const qty = cartItem?.quantity || 1;

      services
        .delete(
          `${StaticApi.removeFromCart}?productCode=${productCodeToUse}&quantity=${qty}&weightValue=${weightValueToUse}&weightUnit=${weightUnitToUse}`
        )
        .then(async () => {
          setIsInCart(false);
          await getUserCart(product);
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else if (isVariantInCart && goToCheckout) {
      navigate("/checkout");
    }
  };

  const toggleWishlist = () => {
    if (!isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }

    setWishlistAnimation(true);
    setTimeout(() => setWishlistAnimation(false), 400);

    const productCodeToUse = selectedVariant?.productCode || id;

    if (!isWishlisted) {
      services
        .post(
          `${StaticApi.addWishlist}?productCode=${productCodeToUse}&weightValue=${selectedVariant?.weightValue}&weightUnit=${selectedVariant?.weightUnit}`
        )
        .then(() => {
          setIsWishlisted(true);
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else {
      services
        .delete(
          `${StaticApi.removeFromWishlist}?productCode=${productCodeToUse}&weightValue=${selectedVariant?.weightValue}&weightUnit=${selectedVariant?.weightUnit}`
        )
        .then(() => {
          setIsWishlisted(false);
        })
        .catch(() => { })
        .finally(() => setLoading(false));
    }
  };

  const getUserCart = async (data) => {
    try {
      const res = await services.get(StaticApi.getUserCart);

      const cartItems = Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.data)
          ? res.data
          : [];

      setCartData(cartItems);

      // FIX: variant-aware cart detection
      const isPresent = cartItems.some(
        (item) =>
          item.productCode ===
          (selectedVariant?.productCode || data?.productCode || id) &&
          item.variantWeightValue === selectedVariant?.weightValue &&
          item.variantWeightUnit === selectedVariant?.weightUnit
      );

      setIsInCart(isPresent);
      cartEvents.refresh();
    } catch (error) { }
  };

  const checkIfWishlisted = async () => {
    try {
      const res = await services.get(StaticApi.getUserWishlist);
      const wishlist = res?.data || [];
      const isPresent = wishlist.some(
        (item) => item.productCode === (selectedVariant?.productCode || id)
      );
      setIsWishlisted(isPresent);
    } catch {
      console.error("Failed to fetch wishlist");
    }
  };

  const getRelatedProducts = async (data) => {
    try {
      const response = await services.get(
        `${StaticApi.getRelatedProduct}?productName=${data?.name}&productCode=${data?.productCode}` // Assuming product has name and category
      );
      setRelatedProducts(response?.data || []);
    } catch (error) {
      console.error("Failed to fetch related products", error);
    }
  };

  const normalizedImages = React.useMemo(() => {
    // 1. Variant images
    if (selectedVariant?.images?.length) {
      return selectedVariant.images.map((img) => img.url);
    }

    // 2. Product main image
    if (product?.productImages?.url) {
      return [product.productImages.url];
    }

    // 3. Fallback
    return [];
  }, [selectedVariant, product]);

  useEffect(() => {
    if (!selectedVariant) return;

    const maxQty =
      selectedVariant?.availableQty ??
      selectedVariant?.stockQuantity ??
      product?.stockQuantity ??
      1;

    // Reset quantity safely when variant changes
    setQuantity((prev) => (prev > maxQty ? 1 : 1));
  }, [selectedVariant]);

  useEffect(() => {
    if (selectedVariant && cartData.length) {
      const present = cartData.some(
        (item) =>
          item.productCode === selectedVariant.productCode &&
          item.variantWeightValue === selectedVariant.weightValue &&
          item.variantWeightUnit === selectedVariant.weightUnit
      );
      setIsInCart(present);
    }
  }, [selectedVariant, cartData]);

  // Load product & variants
  useEffect(() => {
    getProductDetails();
    cartEvents.refresh();
    checkIfWishlisted();
  }, [id]);

  // When product loads, set default variant
  useEffect(() => {
    if (product?.productVariantBeans?.length > 0) {
      setSelectedVariant(product.productVariantBeans[0]);
    }
  }, [product]);

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedVariant]);

  if (loading) {
    return (
      <div className="px-[220px] py-5 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[220px] py-5 flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-[220px] py-5 flex justify-center items-center h-64">
        <div>Product not found</div>
      </div>
    );
  }

  // Price & discount from variant
  const price = Number(selectedVariant?.price || 0);
  const discount = Number(selectedVariant?.discount || 0);
  const hasValidPrice = price > 0;
  const hasDiscount = hasValidPrice && discount > 0 && discount <= 100;
  const discountedPrice = hasDiscount
    ? price - (price * discount) / 100
    : price;

  const buyNow = () => {
    if (!isAuthenticated()) {
      setShowLoginModal(true);
      return;
    }

    const variantPrice = Number(selectedVariant?.price || discountedPrice || 0);

    const quantityValue = Number(quantity || 1);
    const discountPercent = Number(selectedVariant?.discount || 0);

    // discount calculations
    const discountPrice = (variantPrice * discountPercent) / 100;
    const afterDiscountAmount = variantPrice - discountPrice;

    // shipping charge (from variant)
    const shippingCharge = Number(selectedVariant?.shippingCharge || 0);

    const payingAmount = afterDiscountAmount * quantityValue + shippingCharge;

    const buyNowItem = {
      /* ---------------- PRODUCT ---------------- */
      productId: product?.productId,
      productName: product?.name,
      productCode: selectedVariant?.productCode || product?.productCode,

      /* ---------------- VARIANT ---------------- */
      variantId: selectedVariant?.variantId ?? null,
      variantWeightValue: selectedVariant?.weightValue,
      variantWeightUnit: selectedVariant?.weightUnit,

      /* ---------------- PRICING ---------------- */
      variantPrice,
      variantDiscount: discountPercent,
      quantity: quantityValue,

      totalQtyPrice: variantPrice * quantityValue,
      discountPrice,
      afterDiscountAmount,
      payingAmount,

      /* ---------------- TAX & SHIPPING ---------------- */
      gst: Number(selectedVariant?.gst || 0),
      shippingCharge,

      /* ---------------- MEDIA ---------------- */
      variantImages:
        product?.productImages?.url || selectedVariant?.variantImages || "",

      addedDate: new Date().toISOString(),
    };

    localStorage.setItem("selectedCheckoutItems", JSON.stringify([buyNowItem]));

    handleCart(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      <div className="relative flex flex-col md:flex-row gap-5 rounded-2xl p-5 bg-white h-max-content">
        <div className="w-full md:w-[50%]">
          {/* Sticky container */}
          <div className="sticky top-[80px] flex gap-5">
            {/* Desktop Thumbnails (hidden on mobile) */}
            <div className="hidden md:flex flex-col gap-3">
              {normalizedImages.map((img, index) => (
                <div
                  key={index}
                  className={`w-[75px] h-[80px] cursor-pointer ${selectedImage === index ? "ring-2 ring-primary" : ""
                    }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>

            {/* Mobile Carousel (hidden on desktop) */}
            <div className="md:hidden w-full">
              <Swiper
                spaceBetween={10}
                slidesPerView={1}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                modules={[FreeMode, Thumbs]}
                className="main-swiper mt-2"
              >
                {normalizedImages.map((img, index) => (
                  <SwiperSlide key={index}>
                    <img
                      src={img}
                      className="w-full h-[300px] object-cover rounded-lg"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              {/* Thumbnail Carousel */}
              <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={10}
                slidesPerView={4}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[FreeMode, Thumbs]}
                className="thumb-swiper mt-2"
              >
                {normalizedImages.map((img, index) => (
                  <SwiperSlide key={index} className="!w-[80px] !h-[80px]">
                    <img
                      src={img}
                      className="w-full h-full object-cover rounded-lg cursor-pointer"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>{" "}
            </div>

            {/* Desktop Main Image (hidden on mobile) */}
            <div className="flex-1 hidden md:block">
              <img
                src={normalizedImages[selectedImage] || product?.productImages?.url}
                alt={product?.name}
                className="w-full max-h-[600px] object-cover rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[20px] md:w-[50%] justify-between w-full">
          <div className="flex flex-col gap-[20px]">
            <h1 className="text-2xl font-bold">{product?.name}</h1>

            <div className="flex flex-col gap-2">
              <p className="text-gray-700">{product?.description}</p>
            </div>

            <div className="text-sm">
              {selectedVariant?.availableQty > 0 ? null : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>
            {product?.reviews?.length
              ? reviews.map((review, index) => (
                <div
                  key={index}
                  className="p-4 border border-quaternary rounded-lg bg-white"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">
                      {"⭐".repeat(review.rating)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {review.userName}
                    </span>
                  </div>
                </div>
              ))
              : null}
          </div>

          {/* Weight Variant Buttons */}
          {product?.productVariantBeans?.length > 0 && (
            <div className="flex gap-2 mt-2">
              {product.productVariantBeans.map((variant) => (
                <button
                  key={variant.variantId}
                  className={`px-3 py-1 rounded-lg border ${selectedVariant?.variantId === variant.variantId
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white text-gray-700"
                    }`}
                  onClick={() => setSelectedVariant(variant)}
                >
                  {variant.weightValue} {variant.weightUnit}
                </button>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-2">
            {hasValidPrice && (
              <span className="text-[24px] font-semibold text-primary">
                ₹{discountedPrice.toFixed(2)}
              </span>
            )}
            {hasDiscount && (
              <>
                <span className="line-through text-gray-500 text-sm">
                  ₹{price.toFixed(2)}
                </span>
                <span className="text-sm text-green-600 font-medium">
                  ({discount}% OFF)
                </span>
              </>
            )}
          </div>

          {/* quantity increase and decrease*/}
          <div className="inline-flex items-center border border-gray-300 rounded-full overflow-hidden shadow-sm w-max">
            <button
              className={`px-4 py-1 text-lg font-semibold transition-all ${quantity <= 1
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-primary hover:bg-gray-200"
                }`}
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              –
            </button>

            <span className="px-5 py-1 text-base font-medium text-gray-700 bg-white select-none">
              {quantity}
            </span>

            <button
              className={`px-4 py-1 text-lg font-semibold transition-all ${quantity >= product?.stockQuantity
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-primary hover:bg-gray-200"
                }`}
              onClick={() => handleQuantityChange(1)}
              disabled={
                quantity >=
                (selectedVariant?.availableQty ??
                  selectedVariant?.stockQuantity ??
                  product?.stockQuantity ??
                  1)
              }
            >
              +
            </button>
          </div>

          {/* total price */}
          <div className="text-lg font-semibold text-primary">
            Total: ₹{(discountedPrice * quantity).toFixed(2)}
          </div>

          <div className="flex items-center gap-3">
            <button
              className={`${product?.stockQuantity <= 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-primary hover:bg-secondary"
                } text-white px-4 py-2 rounded-lg transition-colors h-[42px] flex items-center`}
              // disabled={product?.stockQuantity <= 0}
              onClick={() => handleCart(false)}
            >
              {cartData?.some(
                (item) =>
                  item.productCode === (selectedVariant?.productCode || id) &&
                  item.variantWeightValue === selectedVariant?.weightValue &&
                  item.variantWeightUnit === selectedVariant?.weightUnit
              )
                ? "Remove from Cart"
                : "Add to Cart"}
            </button>

            {/* Buy Now – now looks SECONDARY */}
            <button
              className={`px-4 py-2 rounded-lg transition-colors h-[42px] border flex items-center ${product?.stockQuantity <= 0
                ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-white text-primary border-primary hover:bg-primary hover:text-white"
                }`}
              // disabled={product?.stockQuantity <= 0}
              onClick={buyNow}
            >
              Buy Now
            </button>

            <div
              className={`text-red-500 cursor-pointer text-2xl transition-transform ${wishlistAnimation ? "wishlist-bounce" : ""
                }`}
              onClick={toggleWishlist}
            >
              {isWishlisted ? <FaHeart /> : <FaRegHeart />}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col  w-full h-full border-t border-quaternary border-b bg-white">
        {/* Vertical divider - hidden on mobile */}
        <div className="hidden lg:block flex-grow w-[1px] bg-quaternary"></div>



        {/* Main content area */}
        <div className="w-full h-full px-4 py-5 lg:px-5 lg:pb-6 flex flex-col gap-4 lg:gap-5">
          {/* Related Products Carousel */}
          <div className="overflow-x-hidden">
            <FeatureCarousel
              heading="Related Products"
              data={relatedProducts}
            />
          </div>
        </div>
        {/* Customer Reviews */}
        <div className="w-full h-full flex flex-col gap-4 lg:gap-5 px-4 py-5">
          <h2 className="text-lg lg:text-xl font-semibold">
            Customer Reviews
            {reviews.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({reviews.length})
              </span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews yet</p>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {visibleReviews.map((review, index) => {
                  const initials = review.userName
                    ? review.userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                    : "U";

                  return (
                    <div
                      key={index}
                      className="p-4 border border-quaternary rounded-xl bg-white flex gap-4"
                    >
                      {/* USER AVATAR */}
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white text-sm font-semibold shrink-0">
                        {initials}
                      </div>

                      {/* REVIEW CONTENT */}
                      <div className="flex flex-col gap-1 w-full">
                        {/* RATING */}
                        <div className="text-yellow-500 text-sm leading-none">
                          {"⭐".repeat(review.rating || 5)}
                        </div>

                        {/* USER NAME */}
                        <span className="text-sm font-medium text-gray-800">
                          {review.userName || "Anonymous"}
                        </span>

                        {/* COMMENT */}
                        <p className="text-sm lg:text-base text-gray-700 mt-1 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TOGGLE BUTTON */}
              {reviews.length > 2 && (
                <button
                  onClick={() => setShowAllReviews((prev) => !prev)}
                  className="self-start text-primary cursor-pointer text-sm lg:text-base font-medium hover:underline mt-2"
                >
                  {showAllReviews ? "Collapse reviews" : "View all reviews"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
