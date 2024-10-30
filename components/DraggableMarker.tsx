import React from "react";
import { Marker } from "@react-google-maps/api";

interface DraggableMarkerProps {
  position: google.maps.LatLngLiteral;
  label: string;
  draggable: boolean;
  onDrag: (newPosition: google.maps.LatLngLiteral) => void;
  options?: google.maps.MarkerOptions;
}

const DraggableMarker: React.FC<DraggableMarkerProps> = ({
  position,
  label,
  draggable,
  onDrag,
  options,
}) => {
  const handleDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onDrag(e.latLng.toJSON());
    }
  };

  return (
    <Marker
      visible={draggable}
      position={position}
      draggable={draggable}
      onDrag={handleDragEnd}
      options={options}
    />
  );
};

export default DraggableMarker;
