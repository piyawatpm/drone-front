"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";

import PF from "pathfinding";
import {
  GoogleMap,
  Libraries,
  Polygon,
  useJsApiLoader,
  Polyline,
} from "@react-google-maps/api";
import MapPanel from "./_component/MapPanel";
import DraggableMarker from "./_component/DraggableMarker";
import Inside from "./_component/Inside";

const libraries: Libraries = ["places", "marker", "geometry"];
const mapContainerStyle = { width: "100%", height: "100%" };

const createMapOptions: google.maps.MapOptions = {
  mapId: "7fb16e77d4180515",
  tilt: 0,
  rotateControl: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: true,
  fullscreenControl: false,
  disableDoubleClickZoom: true,
  disableDefaultUI: true,
  minZoom: 2,
  gestureHandling: "greedy",
};

interface ObstructorData {
  id: string;
  paths: google.maps.LatLngLiteral[];
}

interface PolygonData {
  id: string;
  name: string;
  paths: google.maps.LatLngLiteral[];
  completed: boolean;
  obstructors: ObstructorData[];
  windingPath?: google.maps.LatLngLiteral[];
}

export default function CustomGoogleMap() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const onLoad = useCallback((map: google.maps.Map) => {
    map.setZoom(17);
    setMap(map);
  }, []);
  const defaultCenter = { lat: -33.8688, lng: 151.2093 };

  const onUnmount = useCallback(() => setMap(null), []);

  if (!isLoaded) return null;

  return (
    <div className="w-screen h-screen flex items-center justify-center relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        options={createMapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        // onClick={handleMapClickForPolygon}
      >
        <Inside map={map} />
      </GoogleMap>
    </div>
  );
}
