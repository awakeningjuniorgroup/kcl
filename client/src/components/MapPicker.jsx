import React, { useState, useCallback, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { MapPin, Search } from "lucide-react";
import toast from "react-hot-toast";

// Load 'places' library for the search bar to work
const libraries = ["places"];

const containerStyle = {
  width: "100%",
  height: "100%",
};

// 📍 Default center for the delivery area in Cameroon.
const defaultCenter = { lat: 5.468, lng: 10.417 };

const MapPicker = ({ onSelect, defaultAddress }) => {
  // Initialize Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: libraries,
  });

  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [currentAddress, setCurrentAddress] = useState(
    defaultAddress || "Click map or search location...",
  );
  const [parsedDetails, setParsedDetails] = useState({
    street: "",
    suburb: "",
    city: "",
    state: "",
    zipcode: "",
  });

  const autocompleteRef = useRef(null);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Reverse geocode using OpenStreetMap to avoid Google Geocoding API denial.
  const fetchAddressDetails = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=fr`,
      );

      if (!response.ok) {
        throw new Error("OSM reverse geocoding request failed");
      }

      const data = await response.json();
      const address = data?.address || {};
      const street = [address.house_number, address.road]
        .filter(Boolean)
        .join(" ");

      const details = {
        street: street || address.suburb || address.neighbourhood || "",
        suburb: address.suburb || address.neighbourhood || "",
        city:
          address.city ||
          address.town ||
          address.village ||
          address.county ||
          "",
        state: address.state || address.region || "",
        zipcode: address.postcode || "",
      };

      setCurrentAddress(data.display_name || "Adresse détectée");
      setParsedDetails(details);
    } catch (error) {
      console.error("Geocoding error", error);
      toast.error(
        "Impossible de récupérer les détails précis de l'adresse. Vous pouvez continuer sans validation automatique.",
      );
    }
  };

  const onMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    fetchAddressDetails(lat, lng);
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setMarkerPosition({ lat, lng });
        if (map) map.panTo({ lat, lng });

        fetchAddressDetails(lat, lng);
      }
    }
  };

  const handleConfirm = () => {
    if (!parsedDetails.city && !parsedDetails.street) {
      return toast.error(
        "Veuillez déposer une épingle ou rechercher un lieu en premier.",
      );
    }

    onSelect({
      ...parsedDetails,
      lat: markerPosition.lat,
      lng: markerPosition.lng,
      fullAddress: currentAddress,
    });
  };

  if (loadError)
    return (
      <div className="h-full flex items-center justify-center text-red-500 font-bold bg-red-50 rounded-2xl">
        Erreur lors du chargement des cartes. Vérifiez la clé API.
      </div>
    );
  if (!isLoaded)
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 animate-pulse rounded-2xl text-gray-400 font-bold tracking-widest uppercase">
        Initialisation du moteur de cartes...
      </div>
    );

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-100">
      {/* 🔍 FLOATING SEARCH BAR */}
      <div className="absolute top-4 left-4 right-4 z-10 md:w-96">
        <Autocomplete
          onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
          onPlaceChanged={handlePlaceChanged}
          options={{
            componentRestrictions: { country: "cm" },
          }}
        >
          <div className="relative shadow-lg rounded-xl overflow-hidden bg-white/95 backdrop-blur-md border border-gray-200 focus-within:border-indigo-500 transition-colors">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un lieu..."
              className="w-full py-3.5 pl-11 pr-4 text-sm font-bold text-gray-800 bg-transparent outline-none placeholder:font-medium placeholder:text-gray-400"
            />
          </div>
        </Autocomplete>
      </div>

      {/* 🗺️ THE GOOGLE MAP */}
      <div className="flex-1 w-full h-full">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={markerPosition}
          zoom={14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          <Marker
            position={markerPosition}
            draggable={true}
            onDragEnd={(e) => {
              const newLat = e.latLng.lat();
              const newLng = e.latLng.lng();
              setMarkerPosition({ lat: newLat, lng: newLng });
              fetchAddressDetails(newLat, newLng);
            }}
          />
        </GoogleMap>
      </div>

      {/* ✅ FLOATING CONFIRMATION PANEL */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-gray-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex-1 w-full flex items-start gap-3 overflow-hidden">
          <div className="bg-indigo-50 p-2 rounded-full mt-0.5 shrink-0">
            <MapPin className="text-indigo-600" size={18} />
          </div>
          <div className="overflow-hidden w-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              Selected Location
            </p>
            <p
              className="text-sm font-bold text-gray-800 truncate"
              title={currentAddress}
            >
              {currentAddress}
            </p>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 whitespace-nowrap"
        >
          Confirm Address
        </button>
      </div>
    </div>
  );
};

export default React.memo(MapPicker);
