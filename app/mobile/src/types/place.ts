export type NearbyPlace = {
  id: number;
  title: string;
  distance: number;
  latitude: number;
  longitude: number;
  pageId: number;
  url: string;
};

export type WikipediaSummary = {
  title: string;
  summary: string;
  url: string;
};