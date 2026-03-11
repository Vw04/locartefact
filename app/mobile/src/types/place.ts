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
  id: number;
  title: string;
  summary: string;
  url: string;
  distance: number;
};

export type Fact = {
  id: number;
  pageId: number;
  title: string;
  extract: string;
  synthesizedFacts?: string[];
  distance: number;
  sourceUrl: string;
  lat: number;
  lon: number;
  hasGeoData: boolean;
  thumbnail?: string;
};