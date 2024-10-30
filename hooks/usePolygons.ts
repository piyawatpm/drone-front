import { mockPolygons } from "@/utils/mockData";
import { useEffect, useRef, useState } from "react";

const usePolygons = ({ map }: { map: google.maps.Map | null }) => {
  const [polygons, setPolygons] = useState<PolygonData[]>(mockPolygons);
  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(
    null
  );
  const [editingObstructorId, setEditingObstructorId] = useState<string | null>(
    null
  );
  const [showWindingPath, setShowWindingPath] = useState<string | null>(null);
  const windingPathRef = useRef<google.maps.Polyline | null>(null);

  const handleMapClickForPolygon = (e: google.maps.MapMouseEvent) => {
    console.log("artmape =", e, editingPolygonId);
    if (editingPolygonId) {
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
          return polygon;
        })
      );
    }
  };
  map?.addListener("click", handleMapClickForPolygon);

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
          strokeColor: "blue",
          strokeOpacity: 1.0,
          strokeWeight: 0.5,
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
    console.log("artaddpolygon");
    const newPolygon: PolygonData = {
      id: Date.now().toString(),
      name: `Polygon ${polygons.length + 1}`,
      paths: [],
      completed: false,
      obstructors: [],
    };
    setPolygons([...polygons, newPolygon]);
    setSelectedPolygonId(newPolygon.id);

    setEditingPolygonId(newPolygon.id);
    console.log("artnewpolygon", newPolygon);
  };

  const handleEditPolygon = (id: string) => {
    setEditingPolygonId(id);
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
              // const adjustedPaths = adjustObstructorPath(
              //   obstructor.paths,
              //   0.001
              // );
              const adjustedPaths = obstructor.paths;
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
  const handleSelectPolygon = (id: string) => {
    setSelectedPolygonId((prev) => (prev === id ? null : id));
  };
  return {
    map,
    windingPathRef,
    showWindingPath,
    setShowWindingPath,
    editingObstructorId,
    setEditingObstructorId,
    polygons,
    setPolygons,
    editingPolygonId,
    setEditingPolygonId,
    selectedPolygonId,
    setSelectedPolygonId,
    handleAddObstructor,
    handleRemovePolygon,
    handleAddPolygon,
    handleEditPolygon,
    handleFinishPolygon,
    handleSelectPolygon,
  };
};
export default usePolygons;
