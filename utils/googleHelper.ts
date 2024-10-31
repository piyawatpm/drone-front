import * as turf from "@turf/turf";

export const calculateDistance = (
  point1: google.maps.LatLngLiteral,
  point2: google.maps.LatLngLiteral
): number => {
 
  const p1 = turf.point([point1.lng, point1.lat]);
  const p2 = turf.point([point2.lng, point2.lat]);
  return turf.distance(p1, p2, { units: "meters" });
};
