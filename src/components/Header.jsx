import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import {
  AiOutlineHeart,
  AiOutlineShoppingCart,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineUser,
} from "react-icons/ai";
import { useLocation, useNavigate } from "react-router";
import { StaticRoutes } from "../utils/StaticRoutes";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import { cartEvents } from "../utils/commonFunctions";

export default function Header() {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const isProfileRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [cartLength, setCartLength] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleProfileToggle = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  const handleProfileNavigate = (path) => {
    navigate(path);
    setIsProfileMenuOpen(false);
  };

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleResultClick = (link) => {
    navigate(`/product/${link}`);
    setSearchResults([]);
    setSearchTerm("");
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
            setSearchResults([]);
          });
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleLogout = () => {
    localStorage.clear();
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };
  const getCartItems = () => {
    services
      .get(`${StaticApi.getUserCart}`)
      .then((res) => {
        const data = res?.data?.items?.length || 0;
        setCartLength(data);
      })
      .catch(() => { });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
        setSearchTerm("");
      }
      if (
        isProfileRef.current &&
        !isProfileRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    // document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const updateCart = () => getCartItems();

    document.addEventListener("cartUpdated", updateCart);
    cartEvents.refresh();

    return () => {
      document.removeEventListener("cartUpdated", updateCart);
    };
  }, []);
  return (
    <>
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-tertiary from-2% to-primary text-white shadow-md sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-[220px]">
          {/* Logo */}
          <div
            className="flex gap-2 items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img src={logo} alt="logo" className="w-10 h-10" />
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              Freshooter
            </span>
          </div>

          {/* Desktop Search & Icons */}
          <div className="hidden md:flex items-center space-x-4 ml-auto relative">
            {/* Search Bar */}
            <div className="w-[26rem] relative" ref={searchRef}>
              <input
                value={searchTerm}
                onChange={handleSearchInput}
                type="text"
                placeholder="Search products..."
                className="w-full px-3 py-1 rounded-md text-black border border-transparent ring-1 focus:outline-none focus:ring-2 focus:ring-primary"
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
                            src={product.productImages?.url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              {product.description}
                            </p>
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

            {/* Wishlist Icon */}
            <button
              onClick={() => navigate(StaticRoutes.wishlist)}
              className="text-white text-2xl hover:text-secondary"
            >
              <AiOutlineHeart />
            </button>

            {/* Cart Icon with Quantity Badge */}
            <div className="relative">
              <button
                onClick={() => navigate(StaticRoutes.cart)}
                className="text-white text-2xl hover:text-secondary"
              >
                <AiOutlineShoppingCart />
              </button>
              {cartLength > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartLength}
                </span>
              )}
            </div>

            {/* User Initial & Welcome */}
            <div className="relative" ref={isProfileRef}>
              {localStorage.getItem("userName") ? (
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={handleProfileToggle}
                >
                  <div className="bg-[#ff9933] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {localStorage.getItem("userName").charAt(0).toUpperCase()}
                  </div>
                  {/* <span className="hidden sm:block text-sm font-medium">
                    Welcome, {localStorage.getItem("userName").split(" ")[0]}
                  </span> */}
                </div>
              ) : (
                // If not logged in, show profile icon with dropdown
                <button
                  className="text-white text-2xl hover:text-secondary flex items-center"
                  onClick={handleProfileToggle}
                >
                  <AiOutlineUser />
                </button>
              )}

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg z-50 top-[30px]">
                  {localStorage.getItem("token") && (
                    <>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileNavigate(StaticRoutes.profile);
                        }}
                      >
                        Profile
                      </button>

                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileNavigate(StaticRoutes.orders);
                        }}
                      >
                        Orders
                      </button>
                    </>
                  )}

                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={
                      localStorage.getItem("token")
                        ? handleLogout
                        : () => {
                          navigate(StaticRoutes.signin);
                          setIsProfileMenuOpen(false);
                        }
                    }
                  >
                    {localStorage.getItem("token") ? "Logout" : "LogIn"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? (
                <AiOutlineClose className="text-2xl" />
              ) : (
                <AiOutlineMenu className="text-2xl" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Items */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-primary text-white px-4 py-4 space-y-2">
          <button
            onClick={() => {
              navigate(StaticRoutes.wishlist);
              setIsMobileMenuOpen(false);
            }}
            className="text-2xl block"
          >
            <AiOutlineHeart />
          </button>
          <button
            onClick={() => {
              navigate(StaticRoutes.cart);
              setIsMobileMenuOpen(false);
            }}
            className="text-2xl block"
          >
            <AiOutlineShoppingCart />
          </button>
          {localStorage.getItem("token") && (
            <>
              <button
                onClick={() => {
                  navigate(StaticRoutes.profile);
                  setIsMobileMenuOpen(false);
                }}
                className="text-2xl block"
              >
                <AiOutlineUser />
              </button>
              <button
                onClick={() => {
                  navigate(StaticRoutes.orders);
                  setIsMobileMenuOpen(false);
                }}
                className="hover:underline text-sm block"
              >
                Orders
              </button>
            </>
          )}
          <button
            onClick={
              localStorage.getItem("token")
                ? handleLogout
                : () => {
                  navigate(StaticRoutes.signin);
                  setIsMobileMenuOpen(false);
                }
            }
            className="hover:underline text-sm block"
          >
            {localStorage.getItem("token") ? "Logout" : "LogIn"}
          </button>
        </div>
      )}
    </>
  );
}
