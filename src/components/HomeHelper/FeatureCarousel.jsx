import { useNavigate } from "react-router";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export default function FeatureCarousel({ heading, data }) {
  const navigate = useNavigate();

  const handleNavigate = (link) => {
    navigate(`/product/${link}`);
  };

  return (
    data?.length && (
      <div className="w-full border border-quaternary p-4 sm:p-6 rounded-lg relative">
        <span className="text-lg sm:text-2xl font-semibold text-center block mb-4">
          {heading}
        </span>

        {/* Swiper Carousel */}
        <Swiper
          modules={[Autoplay, Navigation]}
          navigation={true}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={true}
          spaceBetween={20}
          breakpoints={{
            0: {
              slidesPerView: 1,
            },
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="w-full category-swiper"
        >
          {data?.map((item, index) => {
            const discount =
              parseFloat(item?.productVariantBeans?.[0]?.discount) || 0;
            const price = parseFloat(item?.productVariantBeans?.[0]?.price);
            const discountedPrice = Math.round(
              price - (price * discount) / 100
            );

            return (
              <SwiperSlide key={index} className="pb-6 pt-2 px-2">
                <div
                  onClick={() => handleNavigate(item.productCode)}
                  className="group flex flex-col items-center justify-between h-auto min-h-[400px] p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden relative"
                >
                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <span className="bg-primary text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-sm shadow-sm uppercase tracking-wider w-max">
                      {heading === "New Products"
                        ? "New"
                        : heading === "Featured Products"
                          ? "Featured"
                          : "Best Seller"}
                    </span>
                    {Number(item?.discount) > 0 && (
                      <span className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-sm shadow-sm w-max">
                        {item.discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Image container with Quick Add overlay */}
                  <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4">
                    <img
                      src={item?.productImages?.url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-contain mix-blend-multiply transform transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Quick Add overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <button
                        className="bg-white text-primary font-semibold py-2 px-6 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          // In a real app this would trigger the actual cart addition
                          // For now, it just navigates to the product page since handleAddToCart isn't passed down here easily
                          handleNavigate(item.productCode);
                        }}
                      >
                        Quick Look
                      </button>
                    </div>
                  </div>

                  {/* Name & Price */}
                  <div className="w-full flex justify-between items-start gap-2 mt-auto">
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 font-semibold text-sm sm:text-base leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                      {item?.productVariantBeans?.[0] && (
                        <p className="text-gray-500 text-xs mt-1">
                          {item.productVariantBeans[0].weightValue} {item.productVariantBeans[0].weightUnit}
                        </p>
                      )}
                    </div>

                    {item?.productVariantBeans?.[0] ? (
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-primary font-bold text-lg sm:text-xl">
                          ₹{discountedPrice}
                        </span>
                        {Number(item?.discount) > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{price}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    )
  );
}
