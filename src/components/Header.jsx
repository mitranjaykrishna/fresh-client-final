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
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { fetchCartItems } from "../redux/slices/cartSlice";

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchRef = useRef(null);
  const isProfileRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const { isLoggedIn, userName } = useSelector((state) => state.auth);
  const { cartLength } = useSelector((state) => state.cart);

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
    dispatch(logout());
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
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
    if (isLoggedIn) {
      dispatch(fetchCartItems());
    }
  }, [dispatch, isLoggedIn]);
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
              Freshotter
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
              {isLoggedIn && userName ? (
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={handleProfileToggle}
                >
                  <div className="bg-[#ff9933] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    {userName.charAt(0).toUpperCase()}
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
                  {isLoggedIn && (
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
                      isLoggedIn
                        ? handleLogout
                        : () => {
                          navigate(StaticRoutes.signin);
                          setIsProfileMenuOpen(false);
                        }
                    }
                  >
                    {isLoggedIn ? "Logout" : "LogIn"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(true)}>
              <AiOutlineMenu className="text-2xl" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Items */}
      {/* Mobile Slide-out Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Slide-out Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-72 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <span className="font-bold text-xl text-gray-900">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 -mr-2 text-gray-500 hover:text-red-500 transition-colors bg-white rounded-full shadow-sm"
          >
            <AiOutlineClose className="text-xl" />
          </button>
        </div>

        {/* Drawer User Info (if logged in) */}
        {isLoggedIn && userName && (
          <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-white">
            <div className="bg-[#ff9933] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Welcome back,</span>
              <span className="font-bold text-gray-900">{userName.split(" ")[0]}</span>
            </div>
          </div>
        )}

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2 bg-white">
          <button
            onClick={() => {
              navigate(StaticRoutes.wishlist);
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-4 w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium"
          >
            <AiOutlineHeart className="text-2xl text-gray-400" />
            <span>Wishlist</span>
          </button>

          <button
            onClick={() => {
              navigate(StaticRoutes.cart);
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-4 w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium border-b border-gray-50 pb-4 mb-2"
          >
            <div className="relative">
              <AiOutlineShoppingCart className="text-2xl text-gray-400" />
              {cartLength > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartLength}
                </span>
              )}
            </div>
            <span>Cart</span>
          </button>

          {isLoggedIn && (
            <>
              <button
                onClick={() => {
                  navigate(StaticRoutes.profile);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-4 w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium"
              >
                <AiOutlineUser className="text-2xl text-gray-400" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => {
                  navigate(StaticRoutes.orders);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-4 w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors font-medium"
              >
                <span className="text-2xl text-gray-400 w-6 text-center">📦</span>
                <span>My Orders</span>
              </button>
            </>
          )}
        </div>

        {/* Drawer Footer (Login/Logout) */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={
              isLoggedIn
                ? handleLogout
                : () => {
                  navigate(StaticRoutes.signin);
                  setIsMobileMenuOpen(false);
                }
            }
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors ${isLoggedIn
                ? "bg-white text-red-500 border border-red-100 hover:bg-red-50 hover:border-red-200"
                : "bg-primary text-white hover:bg-secondary"
              }`}
          >
            {isLoggedIn ? "Log Out" : "Log In / Sign Up"}
          </button>
        </div>
      </div>
    </>
  );
}
