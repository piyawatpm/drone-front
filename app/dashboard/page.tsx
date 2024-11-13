"use client";

import { Libraries, useJsApiLoader, GoogleMap } from "@react-google-maps/api";
import { useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const libraries: Libraries = ["places", "marker", "geometry"];
const mapContainerStyle = { width: "100%", height: "100%" };
const createMapOptions: google.maps.MapOptions = {
  mapId: "7fb16e77d4180515",
  mapTypeId: "satellite",
  tilt: 0,
  rotateControl: true,
  streetViewControl: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  fullscreenControl: false,
  disableDoubleClickZoom: true,
  disableDefaultUI: true,
  minZoom: 2,
  gestureHandling: "greedy",
};

export default function CustomGoogleMap() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDrone, setSelectedDrone] = useState("Drone Name");
  const [batteryLevel] = useState(27);

  const onLoad = useCallback((map: google.maps.Map) => {
    map.setZoom(17);
    setMap(map);
  }, []);

  const defaultCenter = { lat: -33.8688, lng: 151.2093 };
  const onUnmount = useCallback(() => setMap(null), []);

  if (!isLoaded) return null;

  return (
    <div className="w-screen h-screen flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isSidebarOpen ? 0 : -320 }}
        className="w-80 bg-white h-full shadow-lg flex flex-col"
      >
        {/* Logo Section */}
        <div className="p-4 border-b">
          <Image
            src="/logo.png"
            alt="Cloudtronics Logo"
            width={180}
            height={40}
            className="object-contain"
          />
        </div>

        {/* User Profile */}
        <div className="p-4 border-b flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">BJ</span>
          </div>
          <div>
            <h3 className="font-medium">Brian James</h3>
            <p className="text-sm text-gray-500">
              Sub-section description title
            </p>
          </div>
        </div>

        {/* Drone Selection */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{selectedDrone}</span>
            </div>
            <button className="text-gray-600">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Battery Status */}
          <div className="mt-4 flex items-center space-x-2">
            <div className="text-sm text-red-500">{batteryLevel}%</div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
            <div className="text-sm text-green-500">Good</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <span>Overview</span>
            </li>
            <li className="flex items-center space-x-3 p-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Device Dashboard</span>
            </li>
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t">
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add new route
          </button>
        </div>
      </motion.div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          options={createMapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
        />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button className="p-2 bg-white rounded-lg shadow hover:bg-gray-50">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button className="p-2 bg-white rounded-lg shadow hover:bg-gray-50">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
