import React, { useEffect, useState } from "react";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import dairydumm from "../assets/masala1.jpg";
import logo from "../assets/logo.png";
import HomeHeroCrausal from "../components/SwiperComp/HomeHeroCrausal";
import FeatureCarousel from "../components/HomeHelper/FeatureCarousel";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Autoplay, Navigation } from "swiper/modules";
import { useNavigate } from "react-router";

export default function Home() {
  const [productCat, setProductCat] = useState([]);
  const [products, setProducts] = useState([]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  // Fetch categories from API
  const getAllProductCategories = () => {
    services
      .get(StaticApi.getAllProductCategory)
      .then((response) => {
        if (Array.isArray(response?.data)) {
          const mapped = response.data.map((item) => ({
            ...item,
            id: item.categoryId,
            name: item.name,
            description: item.description,
            image: dairydumm,
          }));
          setProductCat(mapped);
          setBestSellingProducts(mapped.filter((i) => i.isBestSelling == true));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch product categories", err);
      });
  };

  const getAllActivateProducts = () => {
    services
      .get(StaticApi.getAllActivateProduct)
      .then((response) => {
        if (Array.isArray(response?.data)) {
          const mapped = response.data.map((item) => ({
            ...item,
            id: item.productCode,
            name: item.name,
            price: item?.price,
            description: item.description,
            images: item.productImages,
            link: item.productCode,
          }));
          setProducts(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch product categories", err);
      });
  };
  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleResultClick = (link) => {
    navigate(`/product/${link}`);
  };

  // Debounced search logic
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim() !== "") {
        services
          .get(
            `${StaticApi.searchProducts}?name=${encodeURIComponent(searchTerm)}`
          )
          .then((response) => {
            setSearchResults(response?.data || []);
          })
          .catch((err) => {
            console.error("Failed to fetch product categories", err);
            // setSearchResults([]);
          });
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);
  useEffect(() => {
    getAllProductCategories();
    getAllActivateProducts();
  }, []);
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hero Carousel */}
      <HomeHeroCrausal />

      <div className="block md:hidden px-4 py-2 bg-white shadow-sm relative">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full px-4 py-2.5 rounded-full text-black border-none ring-1 ring-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50"
          value={searchTerm}
          onChange={handleSearchInput}
        />

        {searchTerm && (
          <div className="absolute top-full left-0 right-0 bg-white text-black rounded-b-md shadow-lg z-50 max-h-80 overflow-y-auto mx-4">
            {searchResults.length > 0 ? (
              searchResults.map((product) => (
                <div
                  key={product.productCode}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                  onClick={() => handleResultClick(product.productCode)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.productImages?.url || logo}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">₹{product.price}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No results found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Carousel */}
      <div className="w-full px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-[50px]">
        <Swiper
          slidesPerView={2}
          spaceBetween={20}
          breakpoints={{
            480: { slidesPerView: 3 },
            640: { slidesPerView: 4 },
            768: { slidesPerView: 5 },
            1024: { slidesPerView: 6 },
          }}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={true}
          navigation={true}
          modules={[Autoplay, Navigation]}
          className="w-full category-swiper py-2 px-10"
        >
          {productCat.map((item) => (
            <SwiperSlide key={item.id} className="pb-4">
              <div
                onClick={() => navigate(`/category/${item.name}`)}
                className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <span className="text-white font-bold text-sm md:text-base lg:text-lg drop-shadow-md translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {item.name}
                  </span>
                  <span className="text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1 uppercase tracking-wider">
                    Explore Now →
                  </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Promotional Banners Section */}
      <div className="w-full px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-[220px] grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-2">
        {/* Promo Banner 1 */}
        <div className="relative rounded-2xl overflow-hidden h-40 md:h-56 lg:h-64 shadow-sm group cursor-pointer bg-green-50">
          <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-center w-2/3 z-10 transition-transform duration-300 group-hover:translate-x-2">
            <span className="text-green-600 font-bold text-xs md:text-sm uppercase tracking-wider mb-2">Weekend Special</span>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">Authentic Indian<br />Masala & Spices</h3>
            <span className="text-gray-600 text-sm md:text-base mb-4">Up to 30% OFF</span>
            <span
              onClick={(e) => { e.stopPropagation(); navigate('/explore'); }}
              className="inline-block bg-primary text-white text-xs md:text-sm px-4 py-2 rounded-full font-medium w-max shadow-md hover:bg-secondary transition-colors cursor-pointer"
            >
              Shop Now
            </span>
          </div>
          <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-90 mix-blend-multiply bg-gradient-to-l from-green-100 to-transparent">
            {/* Using a placeholder for the illustration, in a real app this would be a real image */}
            <div className="w-full h-full bg-green-200/50 rounded-l-full transform translate-x-10 scale-150"></div>
          </div>
        </div>

        {/* Promo Banner 2 */}
        <div className="relative rounded-2xl overflow-hidden h-40 md:h-56 lg:h-64 shadow-sm group cursor-pointer bg-orange-50">
          <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-center w-2/3 z-10 transition-transform duration-300 group-hover:translate-x-2">
            <span className="text-orange-600 font-bold text-xs md:text-sm uppercase tracking-wider mb-2">New Arrivals</span>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">Daily Staples<br />Rice, Flour & Ghee</h3>
            <span className="text-gray-600 text-sm md:text-base mb-4">Stock up your pantry</span>
            <span
              onClick={(e) => { e.stopPropagation(); navigate('/explore'); }}
              className="inline-block bg-white text-orange-600 border border-orange-200 text-xs md:text-sm px-4 py-2 rounded-full font-medium w-max shadow-sm hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
            >
              Explore
            </span>
          </div>
          <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-90 mix-blend-multiply bg-gradient-to-l from-orange-100 to-transparent">
            <div className="w-full h-full bg-orange-200/50 rounded-tl-full transform translate-x-5 translate-y-10 scale-125"></div>
          </div>
        </div>
      </div>

      {/* Product Sections */}
      <div className="w-full flex flex-col gap-5">
        <FeatureCarousel heading={"New Products"} data={products} />
        {/* <FeatureCarousel heading={"Featured Products"} data={products} /> */}
        {bestSellingProducts?.length > 0 && (
          <FeatureCarousel
            heading={"Best Selling"}
            data={bestSellingProducts}
          />
        )}
      </div>

      {/* Trust Badges Footer Area */}
      <div className="w-full px-4 sm:px-6 md:px-10 xl:px-16 2xl:px-[220px] pb-10 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 text-2xl mb-3">
              🌱
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">100% Organic</h4>
            <p className="text-xs text-gray-500">Farm fresh daily</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-2xl mb-3">
              🚚
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Fast Delivery</h4>
            <p className="text-xs text-gray-500">Same day available</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 text-2xl mb-3">
              💳
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Secure Payment</h4>
            <p className="text-xs text-gray-500">100% safe checkout</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 text-2xl mb-3">
              🎧
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">24/7 Support</h4>
            <p className="text-xs text-gray-500">Dedicated help center</p>
          </div>
        </div>
      </div>
    </div>
  );
}
