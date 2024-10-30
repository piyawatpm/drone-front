import { Polygon, Polyline, useGoogleMap } from "@react-google-maps/api";
import React, { useState, useRef, useEffect, useCallback } from "react";
import DraggableMarker from "./DraggableMarker";
import MapPanel from "./MapPanel";
import * as turf from "@turf/turf";
const Inside = ({ map }: { map: google.maps.Map | null }) => {
  //   const { map } = useGoogleMap();
  const [polygons, setPolygons] = useState<any[]>([
    {
      id: "1729992063022",
      name: "Polygon 2",
      paths: [
        {
          lat: -33.8688,
          lng: 151.2093,
        },
        {
          lat: -33.8688,
          lng: 151.2134,
        },
        {
          lat: -33.8654,
          lng: 151.2134,
        },
        {
          lat: -33.8654,
          lng: 151.2093,
        },
        {
          lat: -33.8688,
          lng: 151.2093,
        },
      ],
      completed: true,
      obstructors: [
        {
          id: "1730087124421",
          paths: [
            {
              lat: -33.86738801908181,
              lng: 151.2108127657412,
            },
            {
              lat: -33.866657521364594,
              lng: 151.2106411043805,
            },
            {
              lat: -33.86609628106762,
              lng: 151.2115423265242,
            },
            {
              lat: -33.866710972629036,
              lng: 151.2117139878849,
            },
          ],
        },
        {
          id: "1730265292832",
          paths: [
            {
              lat: -33.868119,
              lng: 151.21166,
            },
            {
              lat: -33.867415,
              lng: 151.21166,
            },
            {
              lat: -33.867432,
              lng: 151.212719,
            },
          ],
        },
      ],
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
  const [density, setDensity] = useState<number>(58);

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

  map?.addListener("click", handleMapClickForPolygon);

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

  console.log("editingObstructorId", editingObstructorId);

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
    polygon: PolygonData,
    angle: number,
    density: number
  ): google.maps.LatLngLiteral[] => {
    console.count("generateWindingPath");
    // Step 1: Convert main polygon to GeoJSON
    const mainPolygonCoords = polygon.paths.map((coord) => [
      coord.lng,
      coord.lat,
    ]);
    if (
      mainPolygonCoords[0][0] !==
        mainPolygonCoords[mainPolygonCoords.length - 1][0] ||
      mainPolygonCoords[0][1] !==
        mainPolygonCoords[mainPolygonCoords.length - 1][1]
    ) {
      // Close the polygon if not already closed
      mainPolygonCoords.push(mainPolygonCoords[0]);
    }
    let mainPolygonGeoJSON = turf.polygon([mainPolygonCoords]);
    console.log("mainPolygonGeoJSON", mainPolygonGeoJSON);
    // Step 2: Create a grid for the main polygon
    const bboxMain = turf.bbox(mainPolygonGeoJSON);
    // const grid = turf.pointGrid(turf.bbox(freeSpace), cellSize, { units: 'meters' });

    // const gridMain = turf.pointGrid(bboxMain, density , { units: "meters" });
    // console.log("gridMain", gridMain);
    // Step 2: Convert obstacles to GeoJSON

    const scaleFactor = 1.1; // Adjust this value to scale up (>1) or down (<1)
    const obstaclePolygonsGeoJSON = polygon.obstructors.map((obstructor) => {
      let obstructorCoords = obstructor.paths.map((coord) => [
        coord.lng,
        coord.lat,
      ]);
      if (
        obstructorCoords[0][0] !==
          obstructorCoords[obstructorCoords.length - 1][0] ||
        obstructorCoords[0][1] !==
          obstructorCoords[obstructorCoords.length - 1][1]
      ) {
        // Close the polygon if not already closed
        obstructorCoords.push(obstructorCoords[0]);
      }

      // Create a Turf polygon
      const obstructorPolygon = turf.polygon([obstructorCoords], {
        id: obstructor.id,
      });

      // Scale the polygon
      const scaledObstructorPolygon = turf.transformScale(obstructorPolygon, 1);

      return scaledObstructorPolygon;
    });
    const availablePoints = [];
    const nonScaledObstaclePolygonsGeoJSON = polygon.obstructors.map(
      (obstructor) => {
        const obstructorCoords = obstructor.paths.map(
          (coord: { lng: number; lat: number }) => [coord.lng, coord.lat]
        );
        if (
          obstructorCoords[0][0] !==
            obstructorCoords[obstructorCoords.length - 1][0] ||
          obstructorCoords[0][1] !==
            obstructorCoords[obstructorCoords.length - 1][1]
        ) {
          // Close the polygon if not already closed
          obstructorCoords.push(obstructorCoords[0]);
        }

        // Create a Turf polygon
        const obstructorPolygon = turf.polygon([obstructorCoords]);

        // Scale the polygon
        const scaledObstructorPolygon = turf.transformScale(
          obstructorPolygon,
          scaleFactor
        );

        // Push every coord (after scale) as turf.point into availablePoints array
        scaledObstructorPolygon.geometry.coordinates[0].forEach((coord) => {
          console.log("before push", turf.point(coord));
          availablePoints.push(turf.point(coord, { id: obstructor.id }));
        });

        return scaledObstructorPolygon;
      }
    );
    console.log("availablePoints", availablePoints);
    console.log("obstaclePolygonsGeoJSON", obstaclePolygonsGeoJSON);
    // Step 3: Subtract obstacles from main polygon
    let freeSpace = mainPolygonGeoJSON;
    nonScaledObstaclePolygonsGeoJSON.forEach((obstacle) => {
      freeSpace = turf.difference(
        turf.featureCollection([freeSpace, obstacle])
      );
    });
    if (!freeSpace) {
      console.error("No free space available after subtracting obstacles.");
      return [];
    }
    console.log("freeSpace", freeSpace);

    // Step 4: Rotate the free space and work in rotated coordinates
    const pivot = turf.centroid(freeSpace);
    // const rotatedFreeSpace = turf.transformRotate(freeSpace, angle, {
    //   pivot: pivot.geometry.coordinates,
    // });
    const rotatedFreeSpace = freeSpace;

    // Step 5: Generate equally spaced lines across the rotated polygon
    const spacing = density; // Spacing between lines in meters
    console.log("rotatedFreeSpace", rotatedFreeSpace);
    const bbox = turf.bbox(mainPolygonGeoJSON);
    console.log("bbox2", bbox);
    const lineDistance = turf.distance(
      turf.point([bbox[0], bbox[1]]),
      turf.point([bbox[0], bbox[3]]),
      { units: "meters" }
    );
    const numLines = Math.floor(lineDistance / spacing);
    console.log("numLines", numLines);
    const extendFactor = 0.1; // Extend lines by 10% on each side

    const lines = [];
    for (let i = 0; i <= numLines; i++) {
      const y = bbox[1] + (i / numLines) * (bbox[3] - bbox[1]);
      const xExtension = (bbox[2] - bbox[0]) * extendFactor;
      const line = turf.lineString([
        [bbox[0] - xExtension, y],
        [bbox[2] + xExtension, y],
      ]);
      lines.push(line);
    }
    console.log("lines", lines);
    console.log("rotatedFreeSpace", rotatedFreeSpace);
    // Step 6: Clip lines to the rotated free space polygon
    const clippedLines = lines.map((line) =>
      turf.lineIntersect(line, freeSpace)
    );

    console.log("clippedLines", clippedLines, polygon.obstructors);
    // polygon.obstructors.forEach((obstructor) => {
    //   const paths = obstructor.paths.map((path) =>
    //     turf.point([path.lng, path.lat])
    //   );
    //   const feature = turf.featureCollection(paths);
    //   clippedLines.push(feature);
    // });

    // Step 7: Generate points along the clipped lines
    // polygon.obstructors.forEach((obstructor) => {
    //   obstructor.paths.forEach((path) => {
    //     clippedLines.push(turf.point([path.lng, path.lat]));
    //   });
    // });
    console.log("clippedLines2", clippedLines);
    const points = [];
    clippedLines.forEach((clippedLine, index) => {
      if (clippedLine.features.length > 0) {
        const coords = clippedLine.features.map(
          (feature) => feature.geometry.coordinates
        );
        // Sort coordinates from left to right
        coords.sort((a, b) => a[0] - b[0]);
        if (index % 2 === 1) {
          // Reverse every other line to create the winding path
          coords.reverse();
        }
        coords.forEach((coord) => {
          points.push(turf.point(coord, { line: index }));
        });
      }
    });

    console.log("points", points);
    // Step 8: Adjust path for obstacles using pathfinding when necessary

    // console.clear();
    console.log("available points", availablePoints);
    const adjustedPath = [];
    console.log("middlePoint before", points);

    let targetAfterObstacle = null;
    let usedPointCurrentLine = [];

    // loop through points
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      console.log("start,end", { start, end });
      // Create a line between start and end points
      const line = turf.lineString([
        start.geometry.coordinates,
        end.geometry.coordinates,
      ]);
      console.log("check line ", line);
      const scaleFactor = 1;
      const obstaclesCollection = turf.featureCollection(
        polygon.obstructors.map((obstructor) => {
          const coords = obstructor.paths.map((path) => [path.lng, path.lat]);
          // Close the polygon if not already closed
          if (
            coords[0][0] !== coords[coords.length - 1][0] ||
            coords[0][1] !== coords[coords.length - 1][1]
          ) {
            coords.push(coords[0]);
          }
          return turf.polygon([coords]);
        })
      );

      const obstaclePolygon = obstaclePolygonsGeoJSON[0];

      // const scaledObstaclePolygon = turf.transformScale(
      //   obstaclePolygon,
      //   scaleFactor
      // );

      const options = {
        units: "meters",
        resolution: 1500,
        obstacles: obstaclesCollection,
      };
      const isIntersected = turf.booleanIntersects(
        line,
        turf.featureCollection(obstaclePolygonsGeoJSON)
      );

      const findNearestValidPoint = (
        point: turf.Feature<turf.Point>,
        availablePoints: turf.Feature<turf.Point>[],
        obstacles: turf.FeatureCollection,
        line: number,
        intersectingObstacleId: string | null
      ): turf.Feature<turf.Point> | null => {
        const availablePointsWithObstacleId = availablePoints.filter(
          (point) => point.properties.id === intersectingObstacleId
        );
        console.log(
          "availablePointsWithObstacleId",
          availablePointsWithObstacleId
        );
        const sorted = availablePointsWithObstacleId.sort((a, b) => {
          const distA = turf.distance(point, a);
          const distB = turf.distance(point, b);
          return distA - distB;
        });
        console.log("usedPointCurrentLine", usedPointCurrentLine);
        const filtered = sorted.filter(
          (p) =>
            !usedPointCurrentLine.some(
              (point) =>
                point.geometry.coordinates[0] === p.geometry.coordinates[0] &&
                point.geometry.coordinates[1] === p.geometry.coordinates[1]
            )
        );

        console.log("available after filter", filtered, points);
        const ans = filtered[0];
        ans.properties.line = line;
        usedPointCurrentLine.push(ans);
        return ans;
      };
      if (isIntersected) {
        const intersectingObstacle = obstaclePolygonsGeoJSON.find(
          (obstacle, index) => {
            return turf.booleanIntersects(line, obstacle, {
              ignoreSelfIntersections: true,
            });
          }
        );
        const intersectingObstacleId = intersectingObstacle
          ? polygon.obstructors[
              obstaclePolygonsGeoJSON.indexOf(intersectingObstacle)
            ].id
          : null;

        console.log("Intersecting obstacle IDs:", intersectingObstacleId);
        console.log(
          "isIntersected at array",
          i,
          line,
          turf.featureCollection(obstaclePolygonsGeoJSON)
        );
        const middlePoint = findNearestValidPoint(
          start,
          availablePoints,
          obstaclesCollection,
          start.properties.line,
          intersectingObstacleId
        );
        console.log("middlePoint", middlePoint, points);
        points.splice(i + 1, 0, middlePoint);
        if (
          !availablePoints.some(
            (p) =>
              p.geometry.coordinates[0] === end.geometry.coordinates[0] &&
              p.geometry.coordinates[1] === end.geometry.coordinates[1]
          )
        ) {
          targetAfterObstacle = end;
        }
        console.log("targetAfterObstacle", targetAfterObstacle);
        i--;
      } else {
        const calculateAngleBetweenLines = (line1, line2) => {
          // Get coordinates
          const [start1, end1] = line1.geometry.coordinates;
          const [start2, end2] = line2.geometry.coordinates;

          // Calculate bearings
          const bearing1 = turf.bearing(turf.point(start1), turf.point(end1));
          const bearing2 = turf.bearing(turf.point(start2), turf.point(end2));

          // Calculate absolute difference
          let angle = Math.abs(bearing2 - bearing1);

          // Normalize to [0, 180]
          if (angle > 180) {
            angle = 360 - angle;
          }

          return angle;
        };

        const mockPrevious = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [151.21063567806965, -33.86685714285714],
              [151.2105874602246, -33.86665195364748],
            ],
          },
        };
        const mockCurrent = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [151.2105874602246, -33.86665195364748],
              [151.21077628754347, -33.86745550113641],
            ],
          },
        };
        if (end.properties.line !== start.properties.line) {
          usedPointCurrentLine = [];
        }
        if (adjustedPath.length > 1) {
          const previousLine = turf.lineString([
            adjustedPath[adjustedPath.length - 2]?.geometry.coordinates,
            adjustedPath[adjustedPath.length - 1]?.geometry.coordinates,
          ]);
          const currentLine = turf.lineString([
            start.geometry.coordinates,
            end.geometry.coordinates,
          ]);
          const angle = calculateAngleBetweenLines(previousLine, currentLine);
          // turning 180 degree removed
          console.log(
            "piyawat current Point Array",
            i,
            JSON.parse(JSON.stringify(adjustedPath))
          );
          if (angle > 170) {
            console.log("piyawat yes pop");
            adjustedPath.pop();
            adjustedPath.pop();
            adjustedPath.push(adjustedPath[adjustedPath.length - 1]);
            adjustedPath.push(end);
          } else {
            adjustedPath.push(start);
            adjustedPath.push(end);
          }

          console.log("angle", angle);
          // console.log("intersectionarttt", intersection);

          // console.log("Intersection check", { previousLine, currentLine });
        } else {
          adjustedPath.push(start);
          adjustedPath.push(end);
        }
        // If no intersection, use the direct line
      }
    }
    // Add the last point if not already added
    if (!adjustedPath.includes(points[points.length - 1])) {
      adjustedPath.push(points[points.length - 1]);
    }
    console.log("adjustedPath", adjustedPath);
    // Step 9: Rotate adjusted path back to original coordinates
    const finalPoints = adjustedPath.map((point) =>
      turf.transformRotate(point, -angle, { pivot: pivot.geometry.coordinates })
    );

    // Step 10: Convert points back to LatLngLiteral
    const windingPath = finalPoints.map((point) => ({
      lat: point.geometry.coordinates[1],
      lng: point.geometry.coordinates[0],
    }));
    console.log("windingPath", windingPath);
    return windingPath;
  };

  const isPointInPolygon = (
    point: google.maps.LatLngLiteral,
    polygon: google.maps.LatLngLiteral[]
  ): boolean => {
    const googlePoint = new google.maps.LatLng(point);
    const googlePolygon = new google.maps.Polygon({ paths: polygon });
    return google.maps.geometry.poly.containsLocation(
      googlePoint,
      googlePolygon
    );
  };

  // Update handleCreateWindingPath to use the density state
  const handleCreateWindingPath = (polygonId: string) => {
    setPolygons(
      polygons.map((polygon) => {
        if (polygon.id === polygonId) {
          const windingPath = generateWindingPath(polygon, angle, density);
          return { ...polygon, windingPath };
        }
        return polygon;
      })
    );
    setShowWindingPath(polygonId);
  };

  // Add density change handler
  const handleDensityChange = (newDensity: number) => {
    setDensity(newDensity);
    if (showWindingPath) {
      handleCreateWindingPath(showWindingPath);
    }
  };
  const handleAngleChange = (newAngle: number) => {
    setAngle(newAngle);
    if (showWindingPath) {
      handleCreateWindingPath(showWindingPath);
    }
  };
  return (
    <>
      {" "}
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
                strokeWeight: 0,
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
