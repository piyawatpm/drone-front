import React from "react";

interface Point {
  lat: number;
  lng: number;
}

interface Obstructor {
  id: string;
  paths: Point[];
}

interface Polygon {
  id: string;
  name: string;
  paths: Point[];
  completed: boolean;
  obstructors: Obstructor[];
}

interface MapPanelProps {
  polygons: Polygon[];
  onAddPolygon: () => void;
  onEditPolygon: (id: string) => void;
  onFinishPolygon: () => void;
  editingPolygonId: string | null;
  onRemovePolygon: (id: string) => void;
  onSelectPolygon: (id: string) => void;
  selectedPolygonId: string | null;
  onAddObstructor: (polygonId: string) => void;
  editingObstructorId: string | null;
  setEditingObstructorId: (id: string | null) => void;
}

const MapPanel: React.FC<MapPanelProps> = ({
  polygons,
  onAddPolygon,
  onEditPolygon,
  onFinishPolygon,
  editingPolygonId,
  onRemovePolygon,
  onSelectPolygon,
  selectedPolygonId,
  onAddObstructor,
  editingObstructorId,
  setEditingObstructorId,
}) => {
  const handlePolygonClick = (id: string) => {
    console.log("click", id);
    onSelectPolygon(id);
  };

  return (
    <div className="absolute top-0 left-0 w-1/4 h-full bg-white z-20 p-4 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Polygons</h2>
      <button
        onClick={onAddPolygon}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded mb-4 hover:bg-blue-600 transition-colors"
        disabled={!!editingPolygonId}
      >
        Add New Polygon
      </button>
      {editingPolygonId && (
        <button
          onClick={onFinishPolygon}
          className="w-full bg-green-500 text-white py-2 px-4 rounded mb-4 hover:bg-green-600 transition-colors"
        >
          Finish Polygon
        </button>
      )}
      <ul className="space-y-4">
        {polygons.map((polygon) => (
          <li
            key={polygon.id}
            className={`bg-gray-100 p-4 rounded ${
              selectedPolygonId === polygon.id ? "border-2 border-blue-500" : ""
            }`}
          >
            <div
              onClick={() => handlePolygonClick(polygon.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold hover:text-blue-600">
                  {polygon.name} {polygon.completed ? "(Completed)" : ""}
                </span>
                <div>
                  {!polygon.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPolygon(polygon.id);
                      }}
                      className="bg-green-500 text-white py-1 px-2 rounded text-sm hover:bg-green-600 transition-colors mr-2"
                      disabled={
                        !!editingPolygonId && editingPolygonId !== polygon.id
                      }
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePolygon(polygon.id);
                    }}
                    className="bg-red-500 text-white py-1 px-2 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <p className="font-medium">Coordinates:</p>
                <ul className="list-disc list-inside text-sm">
                  {polygon.paths.map((path, index) => (
                    <li key={index}>
                      Lat: {path.lat.toFixed(6)}, Lng: {path.lng.toFixed(6)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {polygon.completed && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Obstructions</h3>
                  <button
                    onClick={() => {
                      if (editingObstructorId) {
                        setEditingObstructorId(null);
                      } else {
                        onAddObstructor(polygon.id);
                      }
                    }}
                    className="bg-yellow-500 text-white py-1 px-2 rounded text-sm hover:bg-yellow-600 transition-colors"
                    disabled={!!editingPolygonId}
                  >
                    {editingObstructorId ? "Finish" : "Add Obstructor"}
                  </button>
                </div>
                {polygon.obstructors?.length > 0 ? (
                  <ul className="space-y-2">
                    {polygon.obstructors.map((obstructor) => (
                      <li
                        key={obstructor.id}
                        className="bg-gray-200 p-2 rounded"
                      >
                        <p className="font-medium">
                          Obstructor {obstructor.id}
                        </p>
                        <ul className="list-disc list-inside text-sm">
                          {obstructor.paths.map((path, index) => (
                            <li key={index}>
                              Lat: {path.lat.toFixed(6)}, Lng:{" "}
                              {path.lng.toFixed(6)}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No obstructions added yet.
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MapPanel;
