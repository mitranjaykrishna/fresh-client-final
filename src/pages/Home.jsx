import React, { useEffect, useState } from "react";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import dairydumm from "../assets/masala1.jpg";
import HomeHeroCrausal from "../components/SwiperComp/HomeHeroCrausal";
import FeatureCarousel from "../components/HomeHelper/FeatureCarousel";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay } from "swiper/modules";
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
            setSearchResults(response?.data?.products || []);
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

      <div className="block md:hidden px-4 pt-2 bg-white shadow-sm relative">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full px-3 py-2 rounded-md text-black border ring-1 focus:outline-none focus:ring-2 focus:ring-primary"
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
                      src={product.image || logo}
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
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={true}
        modules={[Autoplay]}
        className="w-full px-2 sm:px-4 md:px-10 xl:px-16 2xl:px-[220px]"
      >
        {productCat.map((item) => (
          <SwiperSlide key={item.id}>
            <div
              onClick={() => navigate(`/category/${item.name}`)}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center rounded-full bg-white shadow-md p-2 cursor-pointer hover:bg-gradient-to-r from-tertiary to-primary hover:shadow-lg hover:text-white transition-all">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="mt-2 text-xs sm:text-sm font-semibold whitespace-nowrap">
                {item.name}
              </span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

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
    </div>
  );
}
