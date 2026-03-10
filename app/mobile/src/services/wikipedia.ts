import { NearbyPlace } from '../types/place';

type WikipediaGeoSearchResponse = {
  query?: {
    geosearch?: Array<{
      pageid: number;
      title: string;
      lat: number;
      lon: number;
      dist: number;
    }>;
  };
};

export async function fetchNearbyWikipediaPlaces(
  latitude: number,
  longitude: number
): Promise<NearbyPlace[]> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'geosearch',
    gscoord: `${latitude}|${longitude}`,
    gsradius: '10000',
    gslimit: '10',
    format: 'json',
    origin: '*',
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Wikipedia request failed: ${response.status}`);
  }

  const data: WikipediaGeoSearchResponse = await response.json();

  const places = data.query?.geosearch ?? [];

  return places.map((place) => ({
    id: place.pageid,
    pageId: place.pageid,
    title: place.title,
    distance: place.dist,
    latitude: place.lat,
    longitude: place.lon,
    url: `https://en.wikipedia.org/?curid=${place.pageid}`,
  }));
}
export async function fetchWikipediaSummary(title: string) {
  const encodedTitle = encodeURIComponent(title);

  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.status}`);
  }

  const data = await response.json();

  return {
    title: data.title,
    summary: data.extract,
    url: data.content_urls?.desktop?.page,
  };
}