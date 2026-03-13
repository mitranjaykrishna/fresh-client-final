import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import { useDispatch, useSelector } from "react-redux";
import { fetchCartItems } from "../redux/slices/cartSlice";

const getDefaultVariant = (variants = []) => {
  if (!variants.length) return null;
  return [...variants].sort((a, b) => a.price - b.price)[0];
};

export default function ExploreAll() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [isLoading, setIsLoading] = useState(true);

  const { category: routeCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = routeCategory || searchParams.get("category") || "All";
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Sync active category if the URL changes
  useEffect(() => {
    const currentParam = routeCategory || searchParams.get("category") || "All";
    if (currentParam !== activeCategory) {
      // Find case-insensitive match from available categories if it's not "All"
      if (currentParam.toLowerCase() !== "all") {
        const exactMatch = categories.find(c => c.toLowerCase() === currentParam.toLowerCase());
        setActiveCategory(exactMatch || "All");
      } else {
        setActiveCategory("All");
      }
    }
  }, [routeCategory, searchParams, categories]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    // Update the URL without full reload so the link is shareable
    setSearchParams({ category: cat });
  };

  const cartItems = useSelector((state) => state.cart.items) || [];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const productRes = await services.get(StaticApi.getAllActivateProduct);
        if (Array.isArray(productRes?.data)) {
          // Extract unique categories from products
          const uniqueCats = new Set(["All"]);
          
          const mappedProducts = productRes.data.map((product) => {
            if (product.category) {
              uniqueCats.add(product.category);
            }
            
            const variant = getDefaultVariant(product.productVariantBeans);
            return {
              productCode: product.productCode,
              name: product.name,
              category: product.category || "Uncategorized",
              image: variant?.images?.[0]?.url || product?.productImages?.url || "",
              price: variant?.price || 0,
              discount: variant?.discount || 0,
              weightValue: variant?.weightValue,
              weightUnit: variant?.weightUnit,
            };
          });

          setCategories(Array.from(uniqueCats));
          setAllProducts(mappedProducts);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    dispatch(fetchCartItems());
  }, [dispatch]);

  const handleQuickAdd = (e, productCode) => {
    e.stopPropagation();
    navigate(`/product/${productCode}`);
  };

  const filteredProducts = activeCategory === "All" 
    ? allProducts 
    : allProducts.filter(p => p.category === activeCategory);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pt-8 pb-16 px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-[220px]">
      
      {/* Header Area */}
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Explore All</h1>
        <p className="text-gray-500">Discover our full range of fresh, premium products.</p>
      </div>

      {/* Categories Filter Bar */}
      <div className="flex overflow-x-auto scrollbar-hide gap-3 mb-8 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-sm ${
              activeCategory === cat
                ? "bg-primary text-white scale-105 shadow-md"
                : "bg-white text-gray-700 hover:bg-green-50 hover:text-primary border border-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="w-full flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <span className="text-4xl mb-4">🛒</span>
          <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
          <p className="text-gray-500 mt-1">Try selecting a different category.</p>
          <button 
            onClick={() => handleCategoryChange("All")}
            className="mt-6 text-primary font-medium hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredProducts.map((item) => {
            const finalPrice = item.discount > 0
                ? item.price - (item.price * item.discount) / 100
                : item.price;
            
            const hasDiscount = item.price > 0 && item.discount > 0 && item.discount <= 100;

            return (
              <div
                key={item.productCode}
                onClick={() => navigate(`/product/${item.productCode}`)}
                className="group flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden relative"
              >
                {/* Badge */}
                {hasDiscount && (
                  <div className="absolute top-4 left-4 z-10 hidden md:block">
                    <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-sm shadow-sm">
                      {item.discount}% OFF
                    </span>
                  </div>
                )}

                {/* Image Container */}
                <div className="relative w-full aspect-square bg-gray-50 p-4 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-contain mix-blend-multiply transform transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Quick Add overlay */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <button 
                      className="bg-white text-primary font-semibold py-2 px-6 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white text-sm"
                      onClick={(e) => handleQuickAdd(e, item.productCode)}
                    >
                      Quick Look
                    </button>
                  </div>
                </div>

                {/* Details Container */}
                <div className="flex flex-col flex-1 p-4 pt-3">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 min-h-[40px]">
                      {item.name}
                    </h3>
                    {item.weightValue && (
                       <p className="text-gray-500 text-xs mt-1">
                         {item.weightValue} {item.weightUnit}
                       </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-50">
                    <span className="text-primary font-bold text-base sm:text-lg">
                      ₹{finalPrice.toFixed(0)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{item.price.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
