"use client";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  GoogleMap,
  Libraries,
  Polygon,
  useJsApiLoader,
  Polyline,
  Marker,
  OverlayView,
} from "@react-google-maps/api";
import MapPanel from "./_component/MapPanel";
import DraggableMarker from "./_component/DraggableMarker";

const libraries: Libraries = ["places", "marker", "geometry"];
const mapContainerStyle = { width: "100%", height: "100%" };

const createMapOptions: google.maps.MapOptions = {
  mapId: "7fb16e77d4180515",
  // mapTypeId: "satellite",
  tilt: 0,
  rotateControl: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: true,
  fullscreenControl: false,
  disableDoubleClickZoom: true,
  disableDefaultUI: true,
  minZoom: 16,
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
  const [polygons, setPolygons] = useState<PolygonData[]>([
    {
      id: "1729853883538",
      name: "Polygon 1",
      paths: [
        {
          lat: 37.56711281046817,
          lng: 126.97805849261188,
        },
        {
          lat: 37.567767623447445,
          lng: 126.97807995027635,
        },
        {
          lat: 37.56778463150193,
          lng: 126.97905627428804,
        },
        {
          lat: 37.56711281046745,
          lng: 126.9790348166381,
        },
      ],
      completed: true,
    },
  ]);
  console.log("polygons", polygons);
  const [angle, setAngle] = useState<number>(0);
  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(
    null
  );
  const [editingObstructorId, setEditingObstructorId] = useState<string | null>(
    null
  );

  const [showWindingPath, setShowWindingPath] = useState<string | null>(null);

  const windingPathRef = useRef<google.maps.Polyline | null>(null);
  useEffect(() => {
    if (map && showWindingPath) {
      const selectedPolygon = polygons.find((p) => p.id === showWindingPath);
      if (selectedPolygon && selectedPolygon.windingPath) {
        // Remove existing winding path if any
        if (windingPathRef.current) {
          windingPathRef.current.setMap(null);
        }

        // Filter out null coordinates
        const validCoordinates = selectedPolygon.windingPath.filter(
          (coord) => !isNaN(coord.lat) && !isNaN(coord.lng)
        );

        console.log("Valid coordinates:", validCoordinates);

        // Create new winding path
        windingPathRef.current = new google.maps.Polyline({
          path: validCoordinates,
          geodesic: true,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
          map: map,
        });
      }
    }

    // Cleanup function
    return () => {
      if (windingPathRef.current) {
        windingPathRef.current.setMap(null);
      }
    };
  }, [map, showWindingPath, polygons]);
  const onLoad = useCallback((map: google.maps.Map) => {
    map.setZoom(17);
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => setMap(null), []);

  const handleAddObstructor = (polygonId: string) => {
    const newObstructor: ObstructorData = {
      id: Date.now().toString(),
      paths: [],
    };
    setPolygons(
      polygons.map((polygon) =>
        polygon.id === polygonId
          ? {
              ...polygon,
              obstructors: [...(polygon?.obstructors || []), newObstructor],
            }
          : polygon
      )
    );
    setEditingObstructorId(newObstructor.id);
    setSelectedPolygonId(polygonId);
  };
  const handleRemovePolygon = (id: string) => {
    setPolygons(polygons.filter((polygon) => polygon.id !== id));
    if (editingPolygonId === id) {
      setEditingPolygonId(null);
    }
    if (selectedPolygonId === id) {
      setSelectedPolygonId(null);
    }
  };

  const handleAddPolygon = () => {
    const newPolygon: PolygonData = {
      id: Date.now().toString(),
      name: `Polygon ${polygons.length + 1}`,
      paths: [],
      completed: false,
    };
    setPolygons([...polygons, newPolygon]);
    setSelectedPolygonId(newPolygon.id);
    setEditingPolygonId(newPolygon.id);
  };

  const handleEditPolygon = (id: string) => {
    setEditingPolygonId(id);
  };
  const adjustObstructorPath = (
    paths: google.maps.LatLngLiteral[],
    spacing: number
  ): google.maps.LatLngLiteral[] => {
    if (paths.length < 2) return paths;

    const adjustedPath: google.maps.LatLngLiteral[] = [paths[0]];
    for (let i = 1; i < paths.length; i++) {
      const start = paths[i - 1];
      const end = paths[i];
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(start),
        new google.maps.LatLng(end)
      );
      const numPoints = Math.floor(distance / (spacing * 111111)) + 1;

      for (let j = 1; j <= numPoints; j++) {
        const fraction = j / numPoints;
        const lat = start.lat + (end.lat - start.lat) * fraction;
        const lng = start.lng + (end.lng - start.lng) * fraction;
        adjustedPath.push({ lat, lng });
      }
    }

    return adjustedPath;
  };
  const handleFinishPolygon = () => {
    if (editingPolygonId) {
      setPolygons(
        polygons.map((polygon) => {
          if (polygon.id === editingPolygonId) {
            return { ...polygon, completed: true };
          }
          return polygon;
        })
      );
      setSelectedPolygonId(null);
      setEditingPolygonId(null);
    } else if (editingObstructorId) {
      setPolygons(
        polygons.map((polygon) => ({
          ...polygon,
          obstructors: polygon.obstructors.map((obstructor) => {
            if (obstructor.id === editingObstructorId) {
              const adjustedPaths = adjustObstructorPath(
                obstructor.paths,
                0.001
              );
              console.log("adjustedPaths", adjustedPaths);
              return { ...obstructor, paths: adjustedPaths };
            }
            return obstructor;
          }),
        }))
      );
      setEditingObstructorId(null);
    }
  };
  console.log("editingObstructorId", editingObstructorId);
  const handleMapClickForPolygon = (e: google.maps.MapMouseEvent) => {
    if (editingPolygonId && e.latLng) {
      setPolygons(
        polygons.map((polygon) =>
          polygon.id === editingPolygonId
            ? { ...polygon, paths: [...polygon.paths, e.latLng!.toJSON()] }
            : polygon
        )
      );
    } else if (editingObstructorId && e.latLng) {
      const clickedPoint = e.latLng!.toJSON();
      setPolygons(
        polygons.map((polygon) => {
          if (
            polygon.obstructors.some(
              (obstructor) => obstructor.id === editingObstructorId
            )
          ) {
            if (isPointInPolygon(clickedPoint, polygon.paths)) {
              return {
                ...polygon,
                obstructors: polygon.obstructors.map((obstructor) =>
                  obstructor.id === editingObstructorId
                    ? {
                        ...obstructor,
                        paths: [...obstructor.paths, clickedPoint],
                      }
                    : obstructor
                ),
              };
            }
          }
          return polygon;
        })
      );
    }
  };
  if (!isLoaded) return null;
  const defaultCenter = { lat: 37.5666791, lng: 126.9783589 };
  const handleMarkerDragEnd = (
    polygonId: string,
    pointIndex: number,
    newPosition: google.maps.LatLngLiteral
  ) => {
    setPolygons(
      polygons.map((polygon) => {
        if (polygon.id === polygonId) {
          const newPaths = [...polygon.paths];
          newPaths[pointIndex] = newPosition;
          return { ...polygon, paths: newPaths };
        }
        return polygon;
      })
    );
  };

  const handleSelectPolygon = (id: string) => {
    setSelectedPolygonId((prev) => (prev === id ? null : id));
  };

  const lineSymbol = {
    path: "M 0,-1 0,1",
    strokeOpacity: 1,
    scale: 5,
    strokeWeight: 2,
    strokeColor: "#DDA13E",
  };
  const generateWindingPath = (
    polygon: google.maps.LatLngLiteral[],
    angle: number,
    totalDistance: number,
    density: number
  ): google.maps.LatLngLiteral[] => {
    const bounds = new google.maps.LatLngBounds();
    polygon.forEach((point) => bounds.extend(point));

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const nw = new google.maps.LatLng(ne.lat(), sw.lng());
    const se = new google.maps.LatLng(sw.lat(), ne.lng());

    const width = ne.lng() - nw.lng();
    const height = ne.lat() - se.lat();

    const angleRadians = (angle * Math.PI) / 180;
    const distancePerWinding = Math.min(height, width) / density; // Adjust this value to change the density of windings
    const windingsCount = Math.floor(totalDistance / distancePerWinding);
    console.log("windingsCount", windingsCount);
    const windingPath: google.maps.LatLngLiteral[] = [];
    let order = true;

    for (let i = 0; i < windingsCount; i++) {
      const down = (i * distancePerWinding) / Math.cos(angleRadians);
      let firstPoint: google.maps.LatLng, secondPoint: google.maps.LatLng;

      if (down < width * Math.tan(angleRadians)) {
        secondPoint = new google.maps.LatLng(
          nw.lat(),
          nw.lng() + down / Math.tan(angleRadians)
        );
      } else {
        secondPoint = new google.maps.LatLng(
          nw.lat() - down + width * Math.tan(angleRadians),
          se.lng()
        );
      }

      if (down < height) {
        firstPoint = new google.maps.LatLng(nw.lat() - down, nw.lng());
      } else {
        firstPoint = new google.maps.LatLng(
          sw.lat(),
          sw.lng() + (down - height) / Math.tan(angleRadians)
        );
      }

      const collisions = findIntersections(polygon, [
        firstPoint.toJSON(),
        secondPoint.toJSON(),
      ]);

      if (collisions.length >= 2) {
        collisions.sort((a, b) => a.lng - b.lng);
        if (order) {
          windingPath.push(collisions[0], collisions[1]);
        } else {
          windingPath.push(collisions[1], collisions[0]);
        }
        order = !order;
      }
    }

    return windingPath;
  };
  const handleCreateWindingPath = (polygonId: string) => {
    setPolygons(
      polygons.map((polygon) => {
        if (polygon.id === polygonId) {
          const totalDistance = 5; // Adjust this value to change the total path length
          const density = 10;
          const windingPath = generateWindingPath(
            polygon.paths,
            angle,
            totalDistance,
            density
          );
          return { ...polygon, windingPath };
        }
        return polygon;
      })
    );
    setShowWindingPath(polygonId);
  };

  const handleAngleChange = (newAngle: number) => {
    setAngle(newAngle);
    if (showWindingPath) {
      handleCreateWindingPath(showWindingPath);
    }
  };
  const findIntersections = (
    polygon: google.maps.LatLngLiteral[],
    line: google.maps.LatLngLiteral[]
  ): google.maps.LatLngLiteral[] => {
    const intersections: google.maps.LatLngLiteral[] = [];

    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const intersection = lineIntersection(
        polygon[i],
        polygon[j],
        line[0],
        line[1]
      );
      if (intersection) {
        intersections.push(intersection);
      }
    }

    return intersections;
  };

  const lineIntersection = (
    p1: google.maps.LatLngLiteral,
    p2: google.maps.LatLngLiteral,
    p3: google.maps.LatLngLiteral,
    p4: google.maps.LatLngLiteral
  ): google.maps.LatLngLiteral | null => {
    const x1 = p1.lng,
      y1 = p1.lat;
    const x2 = p2.lng,
      y2 = p2.lat;
    const x3 = p3.lng,
      y3 = p3.lat;
    const x4 = p4.lng,
      y4 = p4.lat;

    const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (den === 0) return null;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;

    const x = x1 + ua * (x2 - x1);
    const y = y1 + ua * (y2 - y1);

    return { lat: y, lng: x };
  };
  const isPointInPolygon = (
    point: google.maps.LatLngLiteral,
    polygon: google.maps.LatLngLiteral[]
  ): boolean => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng,
        yi = polygon[i].lat;
      const xj = polygon[j].lng,
        yj = polygon[j].lat;

      const intersect =
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
      if (intersect) isInside = !isInside;
    }
    return isInside;
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        options={createMapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClickForPolygon}
      >
        {polygons.map((polygon) => {
          const isSelected = polygon.id === selectedPolygonId;
          const closedPath = [...polygon.paths, polygon.paths[0]]; // Close the loop
          const validPath = closedPath.filter(
            (coord) =>
              coord &&
              typeof coord.lat === "number" &&
              typeof coord.lng === "number" &&
              isFinite(coord.lat) &&
              isFinite(coord.lng)
          );
          console.log("closedPath", closedPath);

          return (
            <React.Fragment key={polygon.id}>
              <Polygon
                key={polygon.id}
                paths={polygon.paths}
                visible={!editingObstructorId}
                onClick={() => handleSelectPolygon(polygon.id)}
                options={{
                  fillColor: isSelected ? "#DDA13E" : "#49AEC2",
                  fillOpacity: 0.35,
                  strokeColor: "#49AEC2",
                  strokeOpacity: isSelected ? 0 : 1,
                  strokeWeight: 2,
                }}
              />
              {polygon?.obstructors?.map((obstructor) => (
                <Polygon
                  key={obstructor.id}
                  paths={obstructor.paths}
                  options={{
                    fillColor: "#FF0000",
                    fillOpacity: 0.2,
                    strokeColor: "#FF0000",
                    strokeOpacity: 1,
                    strokeWeight: 2,
                  }}
                />
              ))}

              <Polyline
                path={validPath}
                options={{
                  strokeColor: "#DDA13E",
                  strokeOpacity: editingObstructorId ? 1 : 0,
                  strokeWeight: 2,
                  visible: editingObstructorId ? true : isSelected,
                  zIndex: 1,
                  icons: [
                    {
                      icon: lineSymbol,
                      offset: "0",
                      repeat: "15px",
                    },
                  ],
                }}
              />
              {polygon.paths.map((point, index) => (
                <DraggableMarker
                  key={`${polygon.id}-${index}`}
                  position={point}
                  label={(index + 1).toString()}
                  draggable={isSelected}
                  onDrag={(newPosition) =>
                    handleMarkerDragEnd(polygon.id, index, newPosition)
                  }
                  options={{
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: isSelected ? 8 : 6,
                      fillColor: isSelected ? "#DDA13E" : "#49AEC2",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                    },
                    label: {
                      text: (index + 1).toString(),
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "bold",
                    },
                  }}
                />
              ))}
            </React.Fragment>
          );
        })}
      </GoogleMap>
      <MapPanel
        polygons={polygons}
        onAddPolygon={handleAddPolygon}
        onEditPolygon={handleEditPolygon}
        onFinishPolygon={handleFinishPolygon}
        editingPolygonId={editingPolygonId}
        onRemovePolygon={handleRemovePolygon}
        onSelectPolygon={handleSelectPolygon}
        selectedPolygonId={selectedPolygonId}
        onAddObstructor={handleAddObstructor}
        editingObstructorId={editingObstructorId}
        setEditingObstructorId={setEditingObstructorId}
        onCreateWindingPath={handleCreateWindingPath}
      />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-md">
        <label
          htmlFor="angle-slider"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Winding Path Angle: {angle}°
        </label>
        <input
          id="angle-slider"
          type="range"
          min="0"
          max="90"
          value={angle}
          onChange={(e) => handleAngleChange(parseInt(e.target.value))}
          className="w-64"
        />
      </div>
    </div>
  );
}
