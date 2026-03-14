import { useEffect, useState } from "react";
import { LogOut, Package, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ButtonPrimary from "../components/Buttons/ButtonPrimary";
import { services } from "../utils/services";
import { StaticApi } from "../utils/StaticApi";
import AddressDrawer from "../components/AddressDrawer";

export default function Profile() {
  const [user, setUser] = useState({
    name: localStorage.getItem("userName"),
    email: localStorage.getItem("email"),
    avatar: "https://i.pravatar.cc/150?img=32",
  });

  const [confirmAction, setConfirmAction] = useState({
    open: false,
    type: null, // "delete" | "default"
    addressId: null,
  });

  const [addressList, setAddressList] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const navigate = useNavigate();



  const getAllAddress = () => {
    services
      .get(StaticApi.getAllAddressesOfUser)
      .then((res) => {
        const data = res?.data || [];
        setAddressList(data);
      })
      .catch(() => {});
  };

  const handleSaveAddress = (addressData) => {
    const payload = { ...addressData };
    const apiCall =
      isEditing
        ? services.put(
            `${StaticApi.updateAddress}/${payload.addressId}`,
            payload
          )
        : services.post(StaticApi.createAddress, payload);

    apiCall
      .then((response) => {
        getAllAddress();

        if (payload?.default && !isEditing)
          handleSetDefaultAddress(response.data?.addressId);
        
        setShowAddAddress(false);
        setIsEditing(false);
        setEditIndex(null);
      })
      .catch(() => {});
  };

  const handleDeleteAddress = (addressId) => {
    services.delete(`${StaticApi.deleteAddress}/${addressId}`).then(() => {
      getAllAddress();
    });
  };

  const handleSetDefaultAddress = (addressId) => {
    services.post(`${StaticApi.setDefaultAddress}/${addressId}`).then(() => {
      getAllAddress();
    });
  };

  useEffect(() => {
    getAllAddress();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const goToOrders = () => {
    navigate("/orders");
  };

  return (
    <div className="mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-primary">My Profile</h1>

      {/* User Info */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-white shadow rounded-2xl p-6 mb-8">
        <div className="w-24 h-24 rounded-full bg-[#429686] flex items-center justify-center text-3xl font-bold text-white">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-white shadow rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Saved Addresses</h3>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditIndex(null);
              setShowAddAddress(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded text-sm"
          >
            + Add Address
          </button>
        </div>

        {addressList.length === 0 && (
          <p className="text-gray-600">No address added yet.</p>
        )}

        <div className="grid gap-4">
          {addressList.map((addr, index) => (
            <div
              key={addr.addressId}
              className="border rounded-lg p-4 flex justify-between items-start"
            >
              <div>
                <p className="font-semibold">{addr.userName}</p>
                <p>
                  {addr.addressLine1}, {addr.addressLine2}
                </p>
                <p>
                  {addr.city}, {addr.state} - {addr.postalCode}
                </p>
                <p>{addr.country}</p>
                <p className="text-sm text-gray-500">{addr.userNumber}</p>
                {addr.default && (
                  <span className="text-green-600 text-sm font-medium mt-2 inline-block">
                    ★ Default
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-1 sm:mt-0">
                {!addr.default && (
                  <button
                    onClick={() =>
                      setConfirmAction({
                        open: true,
                        type: "default",
                        addressId: addr.addressId,
                      })
                    }
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Set Default
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditIndex(index);
                    setIsEditing(true);
                    setShowAddAddress(true);
                  }}
                  className="text-gray-600 hover:text-primary"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() =>
                    setConfirmAction({
                      open: true,
                      type: "delete",
                      addressId: addr.addressId,
                    })
                  }
                  className="text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Orders Card */}
      <div className="mt-6">
        <div
          onClick={goToOrders}
          className="flex items-center gap-4 bg-white shadow hover:shadow-lg hover:scale-[1.02] transition-transform duration-200 ease-in-out rounded-2xl p-6 cursor-pointer"
        >
          <div className="bg-primary/10 p-3 rounded-full">
            <Package className="text-primary w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">My Orders</h3>
            <p className="text-sm text-gray-600">
              View all your past and current orders
            </p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-8 text-center">
        <div
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white flex items-center p-3 w-max rounded gap-2"
        >
          <LogOut size={16} /> Logout
        </div>
      </div>

      {/* Address Drawer Component */}
      <AddressDrawer 
        isOpen={showAddAddress}
        onClose={() => {
          setShowAddAddress(false);
          setIsEditing(false);
          setEditIndex(null);
        }}
        isEditing={isEditing}
        initialAddress={isEditing && editIndex !== null ? addressList[editIndex] : null}
        onSave={handleSaveAddress}
      />

      {confirmAction.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">
              {confirmAction.type === "delete"
                ? "Delete Address"
                : "Set Default Address"}
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              {confirmAction.type === "delete"
                ? "Are you sure you want to delete this address? This action cannot be undone."
                : "Are you sure you want to set this address as your default address?"}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setConfirmAction({
                    open: false,
                    type: null,
                    addressId: null,
                  })
                }
                className="px-4 py-2 border rounded-md text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (confirmAction.type === "delete") {
                    handleDeleteAddress(confirmAction.addressId);
                  }

                  if (confirmAction.type === "default") {
                    handleSetDefaultAddress(confirmAction.addressId);
                  }

                  setConfirmAction({
                    open: false,
                    type: null,
                    addressId: null,
                  });
                }}
                className={`px-4 py-2 rounded-md text-sm text-white ${
                  confirmAction.type === "delete"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-primary hover:bg-secondary"
                }`}
              >
                {confirmAction.type === "delete" ? "Delete" : "Set Default"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
