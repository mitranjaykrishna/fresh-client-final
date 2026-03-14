import React, { useState } from "react";
// Import your posters properly
import poster1 from "../../assets/cms1.jpg";
import poster2 from "../../assets/cms2.jpg";
import poster3 from "../../assets/cms3.jpg";
import poster4 from "../../assets/poster-4.jpg";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/navigation";
import { Autoplay, Navigation } from "swiper/modules";
import { useNavigate } from "react-router-dom";

export default function HomeHeroCrausal() {
  const navigate = useNavigate();
  const [swiperData, setSwiperData] = useState([
    { 
      id: 1, 
      content: poster1,
      title: "Fresh & Organic Daily",
      subtitle: "Farm to your doorstep in 24 hours.",
      buttonText: "Shop Fresh"
    },
    { 
      id: 2, 
      content: poster2,
      title: "Premium Groceries",
      subtitle: "Hand-picked for quality and taste.",
      buttonText: "Explore Now"
    },
    { 
      id: 3, 
      content: poster3,
      title: "Everyday Essentials",
      subtitle: "Stock up on pantry staples today.",
      buttonText: "Shop Essentials"
    },
    { 
      id: 4, 
      content: poster4,
      title: "Healthy Living Starts Here",
      subtitle: "Discover our range of organic produce.",
      buttonText: "Discover More"
    },
  ]);
  return (
    <div className="w-full ">
      <Swiper
        modules={[Autoplay]}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={true}
        className="mySwiper"
      >
        {swiperData.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="w-full h-[60vh] md:h-[75vh] lg:h-[85vh] xl:max-h-[100vh] overflow-hidden relative group cursor-pointer">
              {/* Image with subtle zoom on hover */}
              <img
                src={slide.content}
                alt={`Slide ${slide.title}`}
                className="w-full h-full object-cover transform transition-transform duration-[10s] group-hover:scale-110"
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center">
                {/* Content Box */}
                <div className="px-6 md:px-16 lg:px-24 w-full md:w-2/3 lg:w-1/2">
                  <div className="backdrop-blur-sm bg-black/20 border border-white/10 p-6 md:p-10 rounded-2xl md:rounded-[2rem] transform transition-all duration-700 translate-y-8 opacity-0 animate-[fadeUp_1s_ease-out_forwards]">
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-md">
                      {slide.title}
                    </h2>
                    <p className="text-base md:text-lg lg:text-xl text-gray-200 mb-8 font-medium drop-shadow-sm max-w-lg">
                      {slide.subtitle}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate('/explore'); }}
                      className="bg-primary hover:bg-secondary text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-primary/50 text-base md:text-lg"
                    >
                      {slide.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
