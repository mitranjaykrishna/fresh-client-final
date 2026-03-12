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
            delay: 1000,
            disableOnInteraction: false,
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
          className="w-full"
        >
          {data?.map((item, index) => {
            const discount =
              parseFloat(item?.productVariantBeans?.[0]?.discount) || 0;
            const price = parseFloat(item?.productVariantBeans?.[0]?.price);
            const discountedPrice = Math.round(
              price - (price * discount) / 100
            );

            return (
              <SwiperSlide key={index} className="pb-[20px]">
                <div
                  onClick={() => handleNavigate(item.productCode)}
                  className="group p-3 bg-white shadow-md rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border hover:border-primary cursor-pointer hover:bg-gradient-to-r from-tertiary to-primary"
                >
                  {/* Image */}
                  <div className="relative w-full h-[300px] object-contain overflow-hidden rounded-lg">
                    <img
                      src={item?.productImages?.url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-lg transform group-hover:scale-105 transition duration-300"
                    />

                    {/* Badge */}
                    <span className="absolute top-2 left-2 bg-gradient-to-r from-primary to-tertiary text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full shadow-sm">
                      {heading === "New Products"
                        ? "New"
                        : heading === "Featured Products"
                          ? "Featured"
                          : "Best Seller"}
                    </span>
                  </div>

                  {/* Name & Price */}
                  <div className="mt-2 flex justify-between items-center text-xs sm:text-sm font-medium group-hover:text-white text-gray-800">
                    <span className="line-clamp-1">{item.name}</span>
                    {item?.productVariantBeans?.[0] ? (
                      <div className="text-right">
                        <span className="text-primary font-semibold group-hover:text-white">
                          ₹{discountedPrice}
                        </span>

                        {Number(item?.discount) > 0 && (
                          <span className="text-xs text-gray-500 group-hover:text-gray-200 line-through ml-2">
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
