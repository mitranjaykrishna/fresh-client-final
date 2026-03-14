import React, { useState, useEffect } from "react";
import ButtonPrimary from "./Buttons/ButtonPrimary";
import StateCity from "../utils/StateCity.json";

export default function AddressDrawer({
  isOpen,
  onClose,
  isEditing,
  initialAddress,
  onSave,
}) {
  const [newAddress, setNewAddress] = useState({
    userName: "",
    userNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    default: false,
  });

  const [formErrors, setFormErrors] = useState({});
  const [states] = useState(Object.keys(StateCity));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const startingAddress = initialAddress || {
        userName: "",
        userNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        default: false,
      };
      setNewAddress(startingAddress);
      setSelectedState(startingAddress.state || "");
      setCities(startingAddress.state ? StateCity[startingAddress.state] : []);
      setFormErrors({});
      setDropdownOpen(false);
      setCityDropdownOpen(false);
      setStateSearch("");
      setCitySearch("");
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen, initialAddress]);

  // Cleanup overflow on unmount just in case
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSave = () => {
    const requiredFields = [
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
      "userName",
      "userNumber",
    ];
    let isValid = true;
    let newError = {};

    requiredFields.forEach((field) => {
      if (!newAddress[field]?.valueOf()?.toString()?.trim()) {
        newError[field] = `Enter valid ${field}`;
        isValid = false;
      }
    });

    if (!isValid) {
      setFormErrors(newError);
      return;
    }

    setFormErrors({});
    onSave(newAddress);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ---------- Header ---------- */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">
            {isEditing ? "Edit Address" : "Add New Address"}
          </h3>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        {/* ---------- Body ---------- */}
        <div className="px-6 py-4 overflow-y-auto scrollbar-hide flex-1 space-y-4">
          {[
            ["Name", "userName", true],
            ["Phone", "userNumber", true],
            ["Address Line 1", "addressLine1", true],
            ["Address Line 2", "addressLine2", false],
            ["Postal Code", "postalCode", true],
          ].map(([label, key, isRequired]) => (
            <InputField
              key={key}
              label={label}
              required={isRequired}
              error={formErrors[key]}
              value={newAddress[key]}
              onChange={(e) => {
                setNewAddress((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }));
                if (formErrors[key]) {
                  setFormErrors((prev) => ({ ...prev, [key]: null }));
                }
              }}
            />
          ))}

          {/* ---------- State Dropdown ---------- */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <div
              className={`w-full border rounded px-3 py-2 text-left bg-white cursor-pointer ${
                formErrors.state ? "border-red-500" : "border-gray-300"
              }`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedState || (
                <span
                  className={
                    formErrors.state ? "text-red-500" : "text-gray-500"
                  }
                >
                  {formErrors.state ? "Required field" : "Select State"}
                </span>
              )}
            </div>

            {dropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow">
                <div className="p-2 border-b sticky top-0 bg-white">
                  <input
                    type="text"
                    placeholder="Search state..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm outline-none"
                    autoFocus
                  />
                </div>
                <ul className="max-h-48 overflow-y-auto">
                  {states
                    .filter((s) =>
                      s.toLowerCase().includes(stateSearch.toLowerCase())
                    )
                    .map((state) => (
                      <li
                        key={state}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedState(state);
                          setNewAddress((prev) => ({
                            ...prev,
                            state,
                            city: "",
                          }));
                          setCities(StateCity[state] || []);
                          setDropdownOpen(false);
                          setStateSearch("");
                          if (formErrors.state) {
                            setFormErrors((prev) => ({ ...prev, state: null }));
                          }
                        }}
                      >
                        {state}
                      </li>
                    ))}
                  {states.filter((s) =>
                    s.toLowerCase().includes(stateSearch.toLowerCase())
                  ).length === 0 && (
                    <li className="px-4 py-2 text-gray-500 text-sm">
                      No state found
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* ---------- City Dropdown ---------- */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <div
              className={`w-full border rounded px-3 py-2 text-left ${
                !selectedState
                  ? "bg-gray-100 cursor-not-allowed"
                  : "bg-white cursor-pointer"
              } ${formErrors.city ? "border-red-500" : "border-gray-300"}`}
              onClick={() =>
                selectedState && setCityDropdownOpen(!cityDropdownOpen)
              }
            >
              {newAddress.city || (
                <span
                  className={formErrors.city ? "text-red-500" : "text-gray-500"}
                >
                  {formErrors.city ? "Required field" : "Select City"}
                </span>
              )}
            </div>

            {cityDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow">
                <div className="p-2 border-b sticky top-0 bg-white">
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm outline-none"
                    autoFocus
                  />
                </div>
                <ul className="max-h-48 overflow-y-auto">
                  {cities
                    .filter((c) =>
                      c.toLowerCase().includes(citySearch.toLowerCase())
                    )
                    .map((city) => (
                      <li
                        key={city}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setNewAddress((prev) => ({ ...prev, city }));
                          setCityDropdownOpen(false);
                          setCitySearch("");
                          if (formErrors.city) {
                            setFormErrors((prev) => ({ ...prev, city: null }));
                          }
                        }}
                      >
                        {city}
                      </li>
                    ))}
                  {cities.filter((c) =>
                    c.toLowerCase().includes(citySearch.toLowerCase())
                  ).length === 0 && (
                    <li className="px-4 py-2 text-gray-500 text-sm">
                      No city found
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* ---------- Country ---------- */}
          <InputField
            label="Country"
            value={newAddress.country}
            disabled
            required
          />

          {/* ---------- Default Checkbox ---------- */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="defaultAddr"
              checked={newAddress.default}
              onChange={(e) =>
                setNewAddress((prev) => ({
                  ...prev,
                  default: e.target.checked,
                }))
              }
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="defaultAddr" className="text-sm cursor-pointer">
              Set as default address
            </label>
          </div>
        </div>

        {/* ---------- Footer ---------- */}
        <div className="px-6 py-4 border-t">
          <ButtonPrimary
            label={isEditing ? "Update Address" : "Save Address"}
            handleOnClick={handleSave}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  error,
  disabled,
  required,
}) => (
  <div>
    <label className="block mb-1 font-medium">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value === undefined || value === null ? "" : String(value)}
      onChange={onChange}
      disabled={disabled}
      className={`w-full border rounded p-2 ${
        error ? "border-red-500 placeholder-red-400" : "border-gray-300"
      } ${disabled ? "bg-gray-100" : ""}`}
      placeholder={error ? "Required field" : label}
    />
  </div>
);
