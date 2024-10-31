import React from 'react';

interface DistanceOverlayProps {
  position: google.maps.LatLngLiteral;
  distance: number;
}

const DistanceOverlay: React.FC<DistanceOverlayProps> = ({ position, distance }) => {
  const formattedDistance = distance < 1000 
    ? `${Math.round(distance)}m` 
    : `${(distance / 1000).toFixed(2)}km`;

  return (
    <div
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        left: position.lng,
        top: position.lat,
      }}
      className="bg-white px-2 py-1 rounded-md shadow-md text-sm font-medium text-gray-700 whitespace-nowrap"
    >
      {formattedDistance}
    </div>
  );
};

export default DistanceOverlay;