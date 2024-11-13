import {
  OverlayView,
  Polygon,
  Polyline,
  useGoogleMap,
} from "@react-google-maps/api";
import React, { useState, useRef, useEffect, useCallback } from "react";
import DraggableMarker from "./DraggableMarker";
import MapPanel from "./MapPanel";
import * as turf from "@turf/turf";
import { mockPolygons } from "@/utils/mockData";
import useWindingPath from "@/hooks/useWindingPath";
import usePolygons from "@/hooks/usePolygons";
import { calculateDistance } from "@/utils/googleHelper";
const lineSymbol = {
  path: "M 0,-1 0,1",
  strokeOpacity: 1,
  scale: 5,
  strokeWeight: 2,
  strokeColor: "#DDA13E",
};
const Inside = ({ map }: { map: google.maps.Map | null }) => {
  const {
    polygons,
    setPolygons,
    editingPolygonId,
    setEditingPolygonId,
    showWindingPath,
    setShowWindingPath,
    windingPathRef,
    editingObstructorId,
    setEditingObstructorId,
    selectedPolygonId,
    setSelectedPolygonId,
    handleAddObstructor,
    handleRemovePolygon,
    handleAddPolygon,
    handleEditPolygon,
    handleFinishPolygon,
    handleSelectPolygon,
  } = usePolygons({ map });
  const {
    handleAngleChange,
    handleDensityChange,
    angle,
    density,
    handleCreateWindingPath,
  } = useWindingPath({
    setShowWindingPath,
    showWindingPath: showWindingPath || "",
    polygons,
    setPolygons,
  });
  useEffect(() => {
    if (map) {
      const glyphImg = document.createElement("img");
      glyphImg.src =
        "https://developers.google.com/maps/documentation/javascript/examples/full/images/google_logo_g.svg";

      const glyphSvgPinElement = new google.maps.marker.PinElement({
        glyph: glyphImg,
      });

      const glyphSvgMarkerView = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: 37.425, lng: -122.07 },
        content: glyphSvgPinElement.element,
        title: "A marker using a custom SVG for the glyph.",
      });

      const marker = new google.maps.Marker({
        position: { lat: -33.8688, lng: 151.2093 },
        map,
        title: "Marker in Sydney",
      });
      return () => {
        marker.setMap(null);
      };
    }
  }, [map]);

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

  // Update handleCreateWindingPath to use the density state
  const renderDistanceOverlays = (polygon: PolygonData) => {
    return polygon.paths.map((point, index) => {
      console.log("point", point);
      const nextPoint = polygon.paths[(index + 1) % polygon.paths.length];
      const distance = calculateDistance(point, nextPoint);

      // Calculate midpoint for overlay position
      const midpoint = {
        lat: (point.lat + nextPoint.lat) / 2,
        lng: (point.lng + nextPoint.lng) / 2,
      };

      return (
        <OverlayView
          key={`distance-${polygon.id}-${index}`}
          position={midpoint}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div className="bg-black w-fit text-white px-2 py-1 rounded-md shadow-md text-sm font-medium  whitespace-nowrap">
            {distance < 1000
              ? `${Math.round(distance)}m`
              : `${(distance / 1000).toFixed(2)}km`}
          </div>
        </OverlayView>
      );
    });
  };
  return (
    <>
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
                strokeColor: "#ffffff",
                strokeOpacity: isSelected ? 0 : 1,
                strokeWeight: 1,
              }}
            />
            {isSelected && renderDistanceOverlays(polygon)}

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
        onDensityChange={handleDensityChange}
        currentDensity={density}
      />
    </>
  );
};

export default Inside;
