import { useState } from "react";
import * as turf from "@turf/turf";
import {
  Feature,
  Point,
  Polygon,
  GeoJsonProperties,
  FeatureCollection,
  LineString,
} from "geojson";
const useWindingPath = ({
  polygons,
  setPolygons,
  showWindingPath,
  setShowWindingPath,
}: {
  polygons: PolygonData[];
  setPolygons: (polygons: PolygonData[]) => void;
  setShowWindingPath: (showWindingPath: string) => void;
  showWindingPath: string;
}) => {
  const [angle, setAngle] = useState<number>(86);
  const [density, setDensity] = useState<number>(51);
  const generateWindingPath = (
    polygon: PolygonData,
    angle: number,
    density: number
  ): google.maps.LatLngLiteral[] => {
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
    const mainPolygonGeoJSON = turf.polygon([mainPolygonCoords]);
    // Step 2: Convert obstacles to GeoJSON with scale
    const scaleFactor = 1.1; // Adjust this value to scale up (>1) or down (<1)
    const obstaclePolygonsGeoJSON = polygon.obstructors.map((obstructor) => {
      const obstructorCoords = obstructor.paths.map((coord) => [
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
    const availablePoints = [] as Feature<Point>[];
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
      const difference = turf.difference(
        turf.featureCollection([freeSpace, obstacle])
      );
      if (difference) {
        freeSpace = difference as Feature<Polygon, GeoJsonProperties>;
      }
    });
    if (!freeSpace) {
      console.error("No free space available after subtracting obstacles.");
      return [];
    }
    console.log("freeSpace", freeSpace);

    // Step 4: Rotate the free space and work in rotated coordinates

    const rotatedFreeSpace = freeSpace;

    // Step 5: Generate equally spaced lines across the rotated polygon
    const bbox = turf.bbox(freeSpace);
    const width = bbox[2] - bbox[0];
    const height = bbox[3] - bbox[1];

    // Convert angle to radians
    const angleRadians = (angle * Math.PI) / 180;

    // Calculate maximum vertical distance based on angle
    const maxDown = height + width * Math.tan(angleRadians);
    const spacing = maxDown / density;

    // Generate angled lines
    const lines = [];
    let currentDown = spacing;
    // const extendFactor = 0.1; // Extend lines by 10% on each side
    while (currentDown <= maxDown) {
      // Calculate line endpoints based on angle
      let firstPoint, secondPoint;

      // If currentDown is less than the angled width projection
      if (currentDown < width * Math.tan(angleRadians)) {
        secondPoint = [bbox[0] + currentDown / Math.tan(angleRadians), bbox[3]];
      } else {
        secondPoint = [
          bbox[2],
          bbox[3] - (currentDown - width * Math.tan(angleRadians)),
        ];
      }

      // If currentDown is less than height
      if (currentDown < height) {
        firstPoint = [bbox[0], bbox[3] - currentDown];
      } else {
        firstPoint = [
          bbox[0] + (currentDown - height) / Math.tan(angleRadians),
          bbox[1],
        ];
      }

      const line = turf.lineString([firstPoint, secondPoint]);
      lines.push(line);
      currentDown += spacing;
    }
    const lineDistance = turf.distance(
      turf.point([bbox[0], bbox[1]]),
      turf.point([bbox[0], bbox[3]]),
      { units: "meters" }
    );
    const numLines = Math.floor(lineDistance / spacing);
    console.log("numLines", numLines);

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
    const points = [] as Feature<Point>[];
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
    const adjustedPath = [] as Feature<Point>[];
    console.log("middlePoint before", points);

    let targetAfterObstacle = null;
    let usedPointCurrentLine = [] as Feature<Point>[];

    // loop through points
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      if (!end) {
        adjustedPath.push(start);
        break;
      }
      console.log("start,end", { start, end });
      // Create a line between start and end points
      const line = turf.lineString([
        start.geometry.coordinates,
        end.geometry.coordinates,
      ]);
      console.log("check line ", line);
      // const scaleFactor = 1;
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

      const isIntersected = turf.booleanIntersects(
        line,
        // @ts-expect-error
        turf.featureCollection(obstaclePolygonsGeoJSON)
      );

      const findNearestValidPoint = (
        point: Feature<Point>,
        availablePoints: Feature<Point>[],
        obstacles: FeatureCollection<Polygon, GeoJsonProperties>,
        line: number,
        intersectingObstacleId: string | null
      ): Feature<Point> | null => {
        const availablePointsWithObstacleId = availablePoints.filter(
          (point) => point.properties?.id === intersectingObstacleId
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
        if (ans && ans.properties) {
          ans.properties.line = line;
        }
        usedPointCurrentLine.push(ans);
        return ans;
      };
      if (isIntersected) {
        const intersectingObstacle = obstaclePolygonsGeoJSON.find(
          (obstacle) => {
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
          start.properties?.line,
          intersectingObstacleId
        );
        console.log("middlePoint", middlePoint, points);
        if (middlePoint) {
          points.splice(i + 1, 0, middlePoint);
        }
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
        const calculateAngleBetweenLines = (
          line1: Feature<LineString>,
          line2: Feature<LineString>
        ) => {
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

        if (end.properties?.line !== start.properties?.line) {
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

    // Step 10: Convert points back to LatLngLiteral
    const windingPath = adjustedPath.map((point) => ({
      lat: point.geometry.coordinates[1],
      lng: point.geometry.coordinates[0],
    }));
    console.log("windingPath", windingPath);
    return windingPath;
  };

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
  return {
    angle,
    density,
    handleDensityChange,
    handleAngleChange,
    handleCreateWindingPath,
  };
};

export default useWindingPath;
