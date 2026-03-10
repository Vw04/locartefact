import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { getCurrentLocation } from './src/services/location';
import { fetchNearbyWikipediaPlaces, fetchWikipediaSummary } from './src/services/wikipedia';
import type { WikipediaSummary } from './src/types/place';

export default function App() {
  const [latitude, setLatitude] = useState<string>('—');
  const [longitude, setLongitude] = useState<string>('—');
  const [status, setStatus] = useState<string>('Ready');
  const [loading, setLoading] = useState<boolean>(false);
  const [places, setPlaces] = useState<WikipediaSummary[]>([]);

  const refreshNearbyFacts = async () => {
    try {
      setLoading(true);
      setStatus('Getting current location...');

      const location = await getCurrentLocation();

      setLatitude(location.latitude.toFixed(6));
      setLongitude(location.longitude.toFixed(6));

      setStatus('Finding nearby places...');
      
      const nearbyPlaces = await fetchNearbyWikipediaPlaces(
        location.latitude,
        location.longitude
      );

      setStatus('Fetching summaries...');

const summaries = await Promise.all(
  nearbyPlaces.slice(0, 3).map(async (place) => {
    const summary = await fetchWikipediaSummary(place.title);

    return {
      id: place.id,
      title: summary.title,
      summary: summary.summary,
      url: summary.url,
      distance: place.distance,
    };
  })
);

setPlaces(summaries);
setStatus(`Loaded ${summaries.length} facts`);

      setStatus(`Found ${nearbyPlaces.length} nearby places`);
    } catch (error) {
      console.error('refreshNearbyFacts failed:', error);
      setStatus('Failed to load nearby facts');
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Locartefact</Text>
        <Text style={styles.subtitle}>
          Discover facts about the world around you.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={refreshNearbyFacts}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Refresh Nearby Facts</Text>
          )}
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{status}</Text>

          <Text style={styles.label}>Latitude</Text>
          <Text style={styles.value}>{latitude}</Text>

          <Text style={styles.label}>Longitude</Text>
          <Text style={styles.value}>{longitude}</Text>
        </View>

        <FlatList
          data={places}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.placeCard}
              onPress={() => Linking.openURL(item.url)}
            >
              <Text style={styles.placeTitle}>{item.title}</Text>
              <Text style={styles.placeMeta}>
                {Math.round(item.distance)} m away
              </Text>
              <Text style={styles.placeSummary}>
                {item.summary}
              </Text>
              <Text style={styles.placeLink}>Open source</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>
                No nearby places loaded yet.
              </Text>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#111',
    marginTop: 4,
  },
  list: {
    paddingBottom: 40,
  },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  placeTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  placeMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  placeSummary: {
  fontSize: 14,
  color: '#333',
  marginTop: 6,
  lineHeight: 20,
  },
  placeLink: {
    fontSize: 14,
    color: '#0a66c2',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
});
