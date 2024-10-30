// src/types/index.ts

interface LatLng {
  lat: number;
  lng: number;
}

interface ObstructorData {
  id: string;
  paths: LatLng[];
}

interface PolygonData {
  id: string;
  name: string;
  paths: LatLng[];
  completed: boolean;
  obstructors: ObstructorData[];
  windingPath?: LatLng[];
}
