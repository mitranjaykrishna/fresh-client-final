import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import { Plus, Minus } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCartItems } from "../redux/slices/cartSlice";

const getDefaultVariant = (variants = []) => {
  if (!variants.length) return null;
  return [...variants].sort((a, b) => a.price - b.price)[0];
};

const getVariantKey = (item) =>
  `${item.productCode}_${item.weightValue}_${item.weightUnit}`;

export default function CategoryProducts() {
  const { category } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const cartItems = useSelector((state) => state.cart.items) || [];

  /* ---------------- FETCH PRODUCTS ---------------- */
  useEffect(() => {
    services.get(StaticApi.getAllActivateProduct).then((res) => {
      if (!Array.isArray(res?.data)) return;

      const filtered = res.data.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase()
      );

      const mapped = filtered.map((product) => {
        const variant = getDefaultVariant(product.productVariantBeans);

        return {
          productId: product.productId,
          productCode: product.productCode,
          name: product.name,
          image: variant?.images?.[0]?.url || product?.productImages?.url || "",
          price: variant?.price || 0,
          discount: variant?.discount || 0,
          weightValue: variant?.weightValue,
          weightUnit: variant?.weightUnit,
        };
      });

      setProducts(mapped);
    });
  }, [category]);

  useEffect(() => {
    dispatch(fetchCartItems());
  }, [dispatch]);

  /* ---------------- CART HELPERS ---------------- */
  const getCartQty = (item) => {
    const found = cartItems.find(
      (c) =>
        c.productCode === item.productCode &&
        c.variantWeightValue === item.weightValue &&
        c.variantWeightUnit === item.weightUnit
    );
    return found?.quantity || 0;
  };

  const addToCart = (item) => {
    services
      .post(
        `${StaticApi.addToCart}?productCode=${item.productCode}&quantity=1&weightValue=${item.weightValue}&weightUnit=${item.weightUnit}`
      )
      .then(() => dispatch(fetchCartItems()));
  };

  const removeFromCart = (item) => {
    services
      .delete(
        `${StaticApi.removeFromCart}?productCode=${item.productCode}&quantity=1&weightValue=${item.weightValue}&weightUnit=${item.weightUnit}`
      )
      .then(() => dispatch(fetchCartItems()));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="px-4 sm:px-6 lg:px-10 xl:px-20 py-6">
      <h1 className="text-2xl font-bold mb-6">{category}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((item) => {
          const qty = getCartQty(item);
          const finalPrice =
            item.discount > 0
              ? item.price - (item.price * item.discount) / 100
              : item.price;

          return (
            <div
              key={getVariantKey(item)}
              className="border rounded-lg p-3 bg-white"
            >
              {/* IMAGE */}
              <img
                onClick={() => navigate(`/product/${item.productCode}`)}
                src={item.image}
                alt={item.name}
                className="w-full h-36 object-cover rounded cursor-pointer"
              />

              {/* NAME */}
              <h3 className="mt-2 text-sm font-semibold">{item.name}</h3>

              {/* WEIGHT */}
              <p className="text-xs text-gray-500">
                {item.weightValue} {item.weightUnit}
              </p>

              {/* PRICE */}
              <div className="flex items-center gap-2 mt-1">
                {item.discount > 0 && (
                  <span className="text-xs line-through text-gray-400">
                    ₹{item.price}
                  </span>
                )}
                <span className="font-bold text-primary">
                  ₹{finalPrice.toFixed(2)}
                </span>
              </div>

              {/* CART CONTROLS */}
              <div className="mt-3">
                {qty === 0 ? (
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full border border-primary text-primary rounded py-1 text-sm font-semibold"
                  >
                    ADD
                  </button>
                ) : (
                  <div className="flex items-center justify-between border rounded">
                    <button
                      onClick={() => removeFromCart(item)}
                      className="px-3 py-1"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="font-semibold">{qty}</span>

                    <button
                      onClick={() => addToCart(item)}
                      className="px-3 py-1"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
