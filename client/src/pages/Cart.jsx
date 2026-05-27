import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Edit2,
  Plus,
  Minus,
  ShoppingBag,
  Receipt,
  Check,
  CreditCard,
  Banknote,
  AlertCircle,
  TrendingUp,
  User,
  Truck,
  Zap,
  Headset,
  Phone,
  X,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Loader2,
  Mail,
  Building,
  Lock,
  Save,
} from "lucide-react";
import MockPaymentModal from "../components/MockPaymentModal";
import MapPicker from "../components/MapPicker";

// 🟢 1. Import Lottie and your JSON file
import Lottie from "lottie-react";
import emptyCartAnimation from "../assets/empty.json";

const MIN_ORDER_AMOUNT = 100;
const MAX_ORDER_AMOUNT = 10000;

const SERVICE_AREA = {
  zipcode: "237",
  country: "Cameroun",
};

const Cart = () => {
  const {
    systemSettings,
    products,
    currency,
    cartItems,
    getCartCount,
    updateQuantity,
    getCartAmount,
    axios,
    user,
    setCartItems,
    token,
    addToCart,
    t,
  } = useAppContext();
  const navigate = useNavigate();

  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🟢 NEW: Address Form State
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    ...SERVICE_AREA,
  });

  // 🟢 NEW: Handle Address Form Input
  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🟢 NEW: Handle Map Selection
  const handleMapSelect = (addressData) => {
    if (addressData.zipcode && addressData.zipcode !== SERVICE_AREA.zipcode) {
      toast.error(t.delivery.onlyDeliverMandvi, {
        icon: "📍",
        duration: 3000,
      });
    } else {
      toast.success(t.delivery.locationUpdatedSuccessfully);
    }

    setFormData((prev) => ({
      ...prev,
      street: addressData.street || prev.street || "",
      city: addressData.city || prev.city || "",
      state: addressData.state || prev.state || "",
      zipcode: addressData.zipcode || prev.zipcode || SERVICE_AREA.zipcode,
      country: SERVICE_AREA.country,
    }));
  };

  // 🟢 NEW: Get Current Location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation)
      return toast.error(t.delivery.geolocationNotSupported);

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();

          if (data?.address) {
            const detectedZip = data.address.postcode;
            if (detectedZip && detectedZip !== SERVICE_AREA.zipcode) {
              toast.error(t.delivery.detectedLocationOutside, {
                duration: 3000,
              });
            } else {
              toast.success(t.delivery.currentLocationDetected);
            }

            const street =
              data.address.road ||
              data.address.suburb ||
              data.address.neighbourhood ||
              "";
            const fullStreet = data.address.house_number
              ? `${data.address.house_number}, ${street}`
              : street;

            setFormData((prev) => ({
              ...prev,
              street: fullStreet || prev.street || "",
              city: data.address.city || data.address.town || prev.city || "",
              state:
                data.address.state || data.address.region || prev.state || "",
              zipcode:
                data.address.postcode || prev.zipcode || SERVICE_AREA.zipcode,
              country: SERVICE_AREA.country,
            }));
          }
        } catch {
          toast.error(t.delivery.errorFetchingLocation);
        } finally {
          setIsLoadingLocation(false);
        }
      },
      () => {
        setIsLoadingLocation(false);
        toast.error(t.delivery.allowLocationAccess);
      },
    );
  };

  // 🟢 NEW: Save Address (Add/Edit)
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (formData.zipcode !== SERVICE_AREA.zipcode) {
        return toast.error(
          t.delivery.deliveryRestrictedTo.replace(
            "{{zipcode}}",
            SERVICE_AREA.zipcode,
          ),
        );
      }

      if (!user || !token) {
        const localAddress = {
          ...formData,
          _id: `guest-${Date.now()}`,
        };

        setAddresses([localAddress]);
        setSelectedAddress(localAddress);
        setShowAddressForm(false);
        setEditingAddressId(null);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          street: "",
          city: "",
          state: "",
          ...SERVICE_AREA,
        });

        toast.success(
          "Adresse enregistrée pour cette commande en mode invité.",
        );
        return;
      }

      let response;
      if (editingAddressId) {
        response = await axios.post(
          "/api/address/update",
          {
            addressId: editingAddressId,
            address: formData,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        response = await axios.post(
          "/api/address/add",
          { address: formData },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }

      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh addresses list
        const { data } = await axios.get("/api/address/get", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success && data.addresses.length > 0) {
          setAddresses(data.addresses);
          setSelectedAddress(data.addresses[data.addresses.length - 1]);
        }

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          street: "",
          city: "",
          state: "",
          ...SERVICE_AREA,
        });
        setEditingAddressId(null);
        setShowAddressForm(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // 🟢 NEW: Open Form for Editing
  const handleEditAddress = (addr) => {
    setFormData(addr);
    setEditingAddressId(addr._id);
    setShowAddressForm(true);
    window.scrollTo(0, 0);
  };

  // 🟢 NEW: Close Address Form
  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      street: "",
      ...SERVICE_AREA,
    });
  };

  useEffect(() => {
    if (
      !user &&
      !localStorage.getItem("token") &&
      cartItems &&
      Object.keys(cartItems).length > 0
    ) {
      toast.success(
        "Vous pouvez commander en mode invité. Créez un compte après validation si vous le souhaitez.",
        {
          icon: "🛒",
          duration: 2500,
        },
      );
    }
  }, [user, cartItems]);

  useEffect(() => {
    if (products.length > 0 && cartItems) {
      let tempArray = [];
      for (const productId in cartItems) {
        const product = products.find((item) => item._id === productId);
        if (product) {
          const sizes = cartItems[productId];
          for (const size in sizes) {
            if (sizes[size] > 0)
              tempArray.push({ ...product, quantity: sizes[size], size: size });
          }
        }
      }
      setCartArray(tempArray);
    }
  }, [products, cartItems]);

  // Track if we're truly switching from logged-in to guest
  const prevUserRef = React.useRef(user);

  useEffect(() => {
    if (user) {
      prevUserRef.current = user; // Update ref
      const fetchAddress = async () => {
        try {
          const { data } = await axios.get("/api/address/get", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data.success && data.addresses.length > 0) {
            setAddresses(data.addresses);
            setSelectedAddress(data.addresses[0]);
          }
        } catch (error) {
          console.error("Error fetching addresses", error);
        }
      };
      fetchAddress();
    } else if (prevUserRef.current) {
      // User just logged out, clear guest addresses
      prevUserRef.current = null;
      setAddresses([]);
      setSelectedAddress(null);
    }
    // For first-time guests, don't clear anything (stay with default null state)
  }, [user, token]);

  const rawSubtotal = getCartAmount();
  const subtotal = Number(rawSubtotal) || 0;

  const deliveryCharge =
    subtotal > 0 && subtotal < systemSettings.freeDeliveryThreshold
      ? systemSettings.deliveryFee
      : 0;

  const totalAmount = subtotal + deliveryCharge;
  const amountShort = MIN_ORDER_AMOUNT - totalAmount;

  useEffect(() => {
    if (totalAmount > 2500000 && paymentMethod === "cod") {
      setPaymentMethod("online");
    }
  }, [paymentMethod, totalAmount]);

  // 🟢 FIX 1: Explicitly lock in the variant price so the backend gets the correct info!
  const getOrderData = () => {
    const orderItems = cartArray.map((item) => {
      const productData = structuredClone(item);
      if (!productData.sellerId) productData.sellerId = "admin";

      // Find the specific size the user selected
      const selectedVariant = productData.variants?.find(
        (v) => v.weight === item.size,
      );

      // If it's a variant, OVERRIDE the main product price so the database records the 1kg/500g price correctly
      if (selectedVariant) {
        productData.price = selectedVariant.price;
        productData.offerPrice = selectedVariant.offerPrice;
      }

      return {
        _id: item._id,
        itemId: item._id,
        product: productData,
        quantity: item.quantity,
        size: item.size,
        price: productData.offerPrice, // Extra safety to pass exact price
      };
    });
    return { items: orderItems, amount: totalAmount, address: selectedAddress };
  };

  const handlePlaceOrderClick = () => {
    if (!selectedAddress)
      return toast.error(
        "Veuillez ajouter une adresse de livraison avant de commander.",
      );
    if (getCartCount() === 0) return toast.error("panier vide");
    if (totalAmount <= 0 || isNaN(totalAmount))
      return toast.error("Invalid total amount. Please refresh.");

    if (totalAmount < MIN_ORDER_AMOUNT) {
      return toast.error(
        `Add items worth ${amountShort}${currency} more to place order!`,
      );
    }
    if (totalAmount > MAX_ORDER_AMOUNT) {
      return toast.error(
        `Order total cannot exceed ${MAX_ORDER_AMOUNT.toLocaleString()}${currency}`,
      );
    }

    if (totalAmount > 2500000 && paymentMethod === "cod") {
      return toast.error(`Orders require Online Payment`);
    }

    if (paymentMethod === "online") {
      setShowPaymentModal(true);
    } else {
      processOrder("COD");
    }
  };

  const processOrder = async (method) => {
    try {
      setIsProcessing(true);

      const orderData = getOrderData();
      const requestConfig = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined;

      let response;

      if (method === "online") {
        response = await axios.post(
          "/api/order/mock",
          orderData,
          requestConfig,
        );
      } else {
        response = await axios.post(
          "/api/order/place",
          orderData,
          requestConfig,
        );
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setCartItems({});
        localStorage.removeItem("guestCart");
        navigate("/order-confirmation", {
          state: {
            orderId: response.data.orderId || null,
            guestCheckout: !user,
          },
        });
        setIsProcessing(false);
      } else {
        setIsProcessing(false);
        toast.error(response.data.message);
      }
    } catch (error) {
      setIsProcessing(false);
      console.error(error);
      toast.error(error.message);
    }
  };

  const getSuggestions = () => {
    return products.filter((p) => !cartItems[p._id]).slice(0, 4);
  };

  if (getCartCount() === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] mt-10 text-gray-500 gap-2">
        <div className="w-64 h-64 md:w-80 md:h-90 -mb-8">
          <Lottie animationData={emptyCartAnimation} loop={true} />
        </div>
        <p className="text-3xl font-bold text-gray-800">
          Votre panier est vide!
        </p>
        <p className="text-gray-500 text-sm mb-4">
          Il semble que vous n'avez pas encore ajouté de produit au panier.
        </p>
        <button
          // 🟢 FIX 2: Seamlessly navigate to the shop page without refreshing
          onClick={() => {
            navigate("/products");
            window.scrollTo(0, 0);
          }}
          className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 transition-all"
        >
          Commencer les achats
        </button>
      </div>
    );
  }

  const isCodDisabled = totalAmount > 2500000;

  return (
    <div className="flex flex-col md:flex-row mt-16 gap-8 pb-16 px-4 md:px-16 font-outfit relative max-w-7xl mx-auto">
      {showPaymentModal && (
        <MockPaymentModal
          amount={totalAmount}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            processOrder("online");
          }}
        />
      )}

      {/* LEFT SIDE: Items & Address */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <ShoppingBag /> panier d'achat
        </h1>

        {cartArray.map((product, index) => {
          const price =
            product.variants?.find((v) => v.weight === product.size)
              ?.offerPrice || product.offerPrice;
          return (
            <div
              key={index}
              className="flex gap-4 border-b border-gray-200 py-6 items-start"
            >
              <img
                className="w-20 h-20 object-contain bg-gray-50 rounded-xl p-2"
                src={product.image[0]}
                alt=""
              />
              <div className="flex-1">
                <p className="font-bold text-lg text-gray-800">
                  {product.name}
                </p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <span className="bg-gray-100 px-2 rounded text-xs">
                    {product.size}
                  </span>{" "}
                  {price} x {product.quantity}
                  {currency}
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <p className="font-bold text-lg">
                  {price * product.quantity}
                  {currency}
                </p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={() =>
                      updateQuantity(
                        product._id,
                        product.size,
                        product.quantity - 1,
                      )
                    }
                    className="w-7 h-7 bg-white shadow-sm rounded flex items-center justify-center text-gray-600 hover:text-black"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-medium text-sm w-4 text-center">
                    {product.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        product._id,
                        product.size,
                        product.quantity + 1,
                      )
                    }
                    className="w-7 h-7 bg-white shadow-sm rounded flex items-center justify-center text-gray-600 hover:text-black"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Address Selection */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="text-green-600" /> Adresse de livraison
          </h2>

          {/* Show Address Form Inline */}
          {showAddressForm ? (
            <div className="bg-white border-2 border-green-200 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingAddressId
                    ? "modifier l'Adresse"
                    : "Ajouter une nouvelle Adresse"}
                </h3>
                <button
                  onClick={closeAddressForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-6">
                {/* Map Section */}
                <div>
                  <button
                    type="button"
                    onClick={handleCurrentLocation}
                    disabled={isLoadingLocation}
                    className="w-full bg-white text-green-600 border border-green-200 font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow-md hover:bg-green-50 transition-all flex items-center justify-center gap-2 mb-4 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {isLoadingLocation ? (
                      <>
                        <Loader2
                          className="animate-spin text-green-500"
                          size={18}
                        />{" "}
                        Detection du GPS...
                      </>
                    ) : (
                      <>
                        <Crosshair
                          size={18}
                          className="group-hover:rotate-90 transition-transform duration-500"
                        />
                        Auto-Detection de votre adresse
                      </>
                    )}
                  </button>

                  {/* Inline Map */}
                  <div className="w-full h-96 rounded-2xl overflow-hidden border-2 border-green-100 shadow-lg mb-4">
                    <MapPicker
                      onSelect={handleMapSelect}
                      defaultAddress={
                        formData.street
                          ? `${formData.street}, Bafoussam, Ouest, 237`
                          : "Bafoussam, Ouest, 237"
                      }
                    />
                  </div>
                </div>

                {/* Personal Details */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-2 mb-4">
                    <User size={14} className="text-green-600" /> Details
                    personel Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                        Nom
                      </label>
                      <input
                        required
                        onChange={onChangeHandler}
                        name="firstName"
                        value={formData.firstName}
                        type="text"
                        placeholder="du pont"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none p-3 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                        prenom
                      </label>
                      <input
                        onChange={onChangeHandler}
                        name="lastName"
                        value={formData.lastName}
                        type="text"
                        placeholder="Jean"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none p-3 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1 block mb-2">
                        <Phone size={12} /> Telephone
                      </label>
                      <input
                        required
                        onChange={onChangeHandler}
                        name="phone"
                        value={formData.phone}
                        type="tel"
                        placeholder="9876543210"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none p-3 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1 block mb-2">
                        <Mail size={12} /> Email
                      </label>
                      <input
                        onChange={onChangeHandler}
                        name="email"
                        value={formData.email}
                        type="email"
                        placeholder="email@example.com"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none p-3 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-2 mb-4">
                    <Building size={14} className="text-green-600" /> Delivery
                    Address
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                      Quartier
                    </label>
                    <input
                      required
                      onChange={onChangeHandler}
                      name="street"
                      value={formData.street}
                      type="text"
                      placeholder="Flat 4B, Main Road"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none p-3 transition-all"
                    />
                  </div>

                  {/* Locked Fields */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        ville
                      </label>
                      <div className="">
                        <input
                          required
                          onChange={onChangeHandler}
                          name="city"
                          value={formData.city}
                          type="text"
                          placeholder="ville"
                          className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none p-3 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        region
                      </label>
                      <input
                        required
                        onChange={onChangeHandler}
                        name="state"
                        value={formData.state}
                        type="text"
                        placeholder="region"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none p-3 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        code zip
                      </label>
                      <div className="w-full bg-[#4A76AC] border border-[#4A76AC] text-white font-bold rounded-lg p-3 cursor-not-allowed flex items-center justify-between">
                        {SERVICE_AREA.zipcode}{" "}
                        <Lock size={14} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        pays
                      </label>
                      <div className="w-full bg-[#4A76AC] border border-[#4A76AC] text-white font-bold rounded-lg p-3 cursor-not-allowed flex items-center justify-between">
                        {SERVICE_AREA.country}{" "}
                        <Lock size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAddressForm}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#4A76AC] text-white font-bold rounded-lg hover:bg-[#4A76AC] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />{" "}
                    {editingAddressId
                      ? "mettre à jour l'adresse"
                      : "Enregistrer  L'adresse"}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Saved Addresses List */}
          <div className="grid grid-cols-1 gap-4">
            {addresses.map((addr, index) => (
              <div
                key={index}
                onClick={() => setSelectedAddress(addr)}
                className={`p-5 border rounded-2xl cursor-pointer relative transition-all duration-200 ${selectedAddress?._id === addr._id ? "border-[#4A76AC] bg-green-50/50 ring-2 ring-green-100" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800">
                      {addr.firstName} {addr.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {addr.street}, {addr.city}, {addr.zipcode}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" /> {addr.phone}
                    </p>
                  </div>
                  {selectedAddress?._id === addr._id && (
                    <div className="bg-[#4A76AC] text-white rounded-full p-1">
                      <Check size={14} />
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAddress(addr);
                  }}
                  className="absolute bottom-4 right-4 text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <Edit2 size={12} /> modifier
                </button>
              </div>
            ))}
          </div>

          {/* Add New Address Button */}
          {addresses.length > 0 && !showAddressForm && (
            <button
              onClick={() => setShowAddressForm(true)}
              className="w-full mt-4 py-3 border-2 border-dashed border-green-400 text-green-600 font-bold rounded-lg hover:bg-green-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Ajouter une nouvelle adresse
            </button>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Order Summary */}
      <div className="w-full md:w-[380px]">
        {/* UPSELL SUGGESTIONS */}
        {totalAmount < MIN_ORDER_AMOUNT && (
          <div className="bg-orange-50 border border-orange-200 rounded-3xl p-5 mb-6 animate-fade-in">
            <div className="flex items-start gap-3 text-orange-700 mb-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Déjà ici!</p>
                <p className="text-xs font-medium opacity-90">
                  Ajouter
                  {amountShort} {currency} plus pour atteindre
                  {MIN_ORDER_AMOUNT} {currency} minimum de commande.
                </p>
              </div>
            </div>

            <p className="text-xs font-bold text-orange-800/60 uppercase tracking-widest mb-3 flex items-center gap-1">
              <TrendingUp size={12} /> Suggestions pour compléter votre commande
            </p>

            <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
              {getSuggestions().map((product) => {
                const price =
                  product.variants?.[0]?.offerPrice || product.offerPrice;
                const defaultSize =
                  product.sizes?.[0] ||
                  product.variants?.[0]?.weight ||
                  "Standard";

                return (
                  <div
                    key={product._id}
                    className="min-w-[110px] bg-white p-3 rounded-2xl border border-orange-100 flex flex-col items-center text-center shadow-sm snap-start shrink-0"
                  >
                    <img
                      src={product.image[0]}
                      className="w-12 h-12 object-contain mb-2 mix-blend-multiply"
                      alt={product.name}
                    />
                    <p className="text-[10px] font-bold text-gray-800 line-clamp-1 w-full">
                      {product.name}
                    </p>
                    <p className="text-xs font-black text-[#4A76AC] my-1">
                      {currency}
                      {price}
                    </p>
                    <button
                      onClick={async () => {
                        if (addToCart) {
                          await addToCart(product._id, defaultSize);
                        } else {
                          updateQuantity(product._id, defaultSize, 1);
                        }
                      }}
                      className="mt-auto w-full py-1.5 bg-orange-100 text-orange-700 text-[10px] font-black tracking-wide rounded-lg hover:bg-orange-200 transition-colors active:scale-95"
                    >
                      + ADD
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-[#fbfcff] p-7 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-blue-100/50 sticky top-24">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
            <ShoppingBag className="text-emerald-500" strokeWidth={2.5} />
            Resumé de commande
          </h2>
          <div className="space-y-4 text-sm font-medium text-slate-500 mb-6">
            <div className="flex justify-between items-center">
              <span>Sous-total</span>
              <span className="font-bold text-slate-800">
                {currency}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Frais de livraison</span>
              <span
                className={`font-bold ${deliveryCharge === 0 ? "text-[#4A76AC] bg-emerald-50 px-2 py-0.5 rounded-md" : "text-slate-800"}`}
              >
                {deliveryCharge === 0
                  ? "FREE"
                  : `${currency}${deliveryCharge.toFixed(2)}`}
              </span>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent my-5"></div>

            <div className="flex justify-between items-end">
              <div>
                <span className="text-xl font-black text-slate-900 block">
                  Total
                </span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Inclure tout les taxes
                </span>
              </div>
              <span className="text-3xl font-black text-[#4A76AC] tracking-tight">
                {totalAmount.toFixed(2)}
                {currency}
              </span>
            </div>

            {totalAmount > MAX_ORDER_AMOUNT && (
              <p className="text-red-500 text-xs font-bold mt-3 text-center bg-red-50 p-2.5 rounded-xl border border-red-100">
                Aucune limite de commande
              </p>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm font-bold text-gray-800 mb-3">
              Mode de payement
            </p>
            <div className="space-y-3">
              <div
                onClick={() => !isCodDisabled && setPaymentMethod("cod")}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCodDisabled ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50" : paymentMethod === "cod" ? "border-green-500 bg-green-50 cursor-pointer" : "border-gray-200 hover:border-gray-300 cursor-pointer"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-[#4A76AC]" : "border-gray-400"}`}
                >
                  {paymentMethod === "cod" && (
                    <div className="w-2.5 h-2.5 bg-[#4A76AC] rounded-full"></div>
                  )}
                </div>
                <Banknote
                  size={20}
                  className={isCodDisabled ? "text-gray-400" : "text-[#4A76AC]"}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-700">
                    cash a la livraison
                  </span>
                  {isCodDisabled && (
                    <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle size={10} /> non disponible pour le montant
                      de cette commande
                    </span>
                  )}
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod("online")}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === "online" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "online" ? "border-blue-500" : "border-gray-400"}`}
                >
                  {paymentMethod === "online" && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <CreditCard size={20} className="text-blue-600" />
                <span className="font-medium text-gray-700">
                  Payement en ligne (UPI/Carte de credit)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlaceOrderClick}
            disabled={
              isProcessing ||
              totalAmount < MIN_ORDER_AMOUNT ||
              totalAmount > MAX_ORDER_AMOUNT
            }
            className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed ${paymentMethod === "online" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-[#4A76AC] hover:bg-[#3A669C] shadow-[#4A76AC]/30"}`}
          >
            {isProcessing
              ? "PROCESSING..."
              : totalAmount < MIN_ORDER_AMOUNT
                ? `ADD ${amountShort}${currency} MORE`
                : paymentMethod === "online"
                  ? "PAY NOW"
                  : "PLACE ORDER"}
          </button>

          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-xs text-emerald-800">
            Vous pouvez commander en mode invité. Un compte peut être créé après
            confirmation pour suivre votre colis.
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="flex flex-col items-center justify-center text-center p-3 border border-slate-100 rounded-xl bg-gray-50/80">
              <Truck className="text-[#4A76AC] mb-1.5" size={18} />
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                Expedition
                <br />
                {/* Above {currency}
                {systemSettings.freeDeliveryThreshold} */}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-3 border border-slate-100 rounded-xl bg-gray-50/80">
              <Zap className="text-[#4A76AC] mb-1.5" size={18} />
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                Livraison rapide
                <br />à votre porte
              </span>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-3 border border-slate-100 rounded-xl bg-gray-50/80">
              <Headset className="text-[#4A76AC] mb-1.5" size={18} />
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                Article cassé?
                <br />
                Contacts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
