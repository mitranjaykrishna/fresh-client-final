import {
  AiOutlineFacebook,
  AiOutlineTwitter,
  AiOutlineInstagram,
  AiOutlineYoutube,
} from "react-icons/ai";
import amex from "../assets/amex.png";
import mastercard from "../assets/mastercard.png";
import rupay from "../assets/rupay.png";
import visa from "../assets/visa.png";

export default function Footer() {
  return (
    <footer className="bg-primary text-black text-sm animate-fadeIn">
      {/* Top policies row */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-center border-b border-gray-300 py-5 px-4">
        {[
          { icon: "📄", label: "Terms & Conditions", link: "/terms#terms" },
          { icon: "👥", label: "About Us", link: "/terms#about" },
          { icon: "📱", label: "Contact Us", link: "/terms#contact" },
          { icon: "↩️", label: "Return Policy", link: "/terms#return" },
          { icon: "🛟", label: "Support Policy", link: "/terms#support" },
          { icon: "❗", label: "Privacy Policy", link: "/terms#privacy" },
        ].map((item, i) => (
          <a
            key={i}
            href={item.link}
            className="flex flex-col items-center gap-1 hover:text-orange-600 transition-all duration-300 transform hover:scale-110"
          >
            <span className="text-orange-600 text-2xl animate-pulse">
              {item.icon}
            </span>
            <span className="text-sm font-medium">{item.label}</span>
          </a>
        ))}
      </div> */}

      {/* Middle content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 py-8 px-4 sm:px-8 animate-fadeUp">
        {/* Column 1: Logo + Subscribe + App links */}
        <div className=" flex flex-col items-center ">
          <h2 className="text-4xl font-bold mb-3">Freshotter</h2>
          {/* <div className="flex flex-col sm:flex-row mb-4 animate-fadeIn">
            <input
              type="email"
              placeholder="Your Email Address"
              className="w-full sm:w-auto flex-1 p-2 rounded-l sm:rounded-l border border-gray-300 outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button className="bg-orange-600 text-white px-4 py-2 rounded sm:rounded-r mt-2 sm:mt-0 hover:scale-105 transition-all duration-300">
              Subscribe
            </button>
          </div>
          <div className="flex space-x-2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/512px-Google_Play_Store_badge_EN.svg.png"
              alt="Google Play"
              className="h-10 transition-transform duration-300 hover:scale-105"
            />
            <img
              src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
              alt="App Store"
              className="h-10 transition-transform duration-300 hover:scale-105"
            />
          </div> */}
        </div>

        {/* Column 2: Contact Info */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Contact Info</h2>
          <p className="mb-1">📞 Phone: +91 985463215</p>
          <p>📧 Email: info@Freshotter.com</p>
        </div>

        {/* Column 3: Store Locations + Payment Logos */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Our Stores</h2>
          <ul className="mb-4 space-y-1">
            <li>📍 Addanki</li>
            <li>📍 Eluru</li>
            <li>📍 Guntur</li>
            <li>📍 Hyderabad</li>
            <li>📍 Vijayawada</li>
          </ul>
          <div className="flex flex-wrap gap-3 items-center">
            {[
              ["Visa", visa],
              ["Mastercard", mastercard],
              ["RuPay", rupay],
              ["Amex", amex],
            ].map(([name, src], i) => (
              <img
                key={i}
                src={src}
                alt={name}
                className="h-6 transition-transform duration-300 hover:scale-110"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-primary border-t border-gray-300 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-center gap-3">
          <p className="text-xs">
            © {new Date().getFullYear()} <strong>Freshotter</strong>. All Rights
            Reserved.
          </p>
          <div className="flex space-x-4 text-xl text-black">
            {[
              AiOutlineFacebook,
              AiOutlineTwitter,
              AiOutlineInstagram,
              AiOutlineYoutube,
            ].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="hover:text-orange-600 transform hover:scale-125 transition-all duration-300 w-[30px] h-[30px]"
              >
                <Icon size={30} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
