import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FactCard from './src/components/FactCard';
import type { Fact } from './src/types/place';
import { getCurrentLocation } from './src/services/location';
import { fetchNearbyFacts } from './src/services/wikipedia';
import { rankFacts } from './src/services/ranking';
import SAMPLE_LOCATIONS from './src/data/sample-locations.json';

export default function App() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [status, setStatus] = useState<string>('Tap refresh to discover nearby facts.');
  const [loading, setLoading] = useState<boolean>(false);

  const hasLoaded = facts.length > 0 || loading;

  const runWithCoords = async (lat: number, lon: number, label: string) => {
    setLoading(true);
    setStatus(`Loading: ${label}`);
    try {
      const rawFacts = await fetchNearbyFacts(lat, lon);
      const ranked = rankFacts(rawFacts);
      setFacts(ranked);
      setStatus(`${label} — ${ranked.length} facts found`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      setStatus(message);
      setFacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setStatus('Requesting location…');
    try {
      const { latitude, longitude } = await getCurrentLocation();
      await runWithCoords(latitude, longitude, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      setStatus(message);
      setFacts([]);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {__DEV__ && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.devBar}
          contentContainerStyle={styles.devBarContent}
        >
          {SAMPLE_LOCATIONS.locations.map((loc) => (
            <TouchableOpacity
              key={loc.label}
              style={styles.devButton}
              onPress={() => runWithCoords(loc.lat, loc.lon, loc.label)}
              disabled={loading}
            >
              <Text style={styles.devLabel}>{loc.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={!hasLoaded ? styles.headerWrapperCentered : undefined}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Locartefact</Text>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Refresh Nearby Facts</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>

      {hasLoaded && (
        <FlatList
          data={facts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <FactCard fact={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202C1F',
  },
  devBar: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#0a1a0a',
  },
  devBarContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  devButton: {
    backgroundColor: '#1a3a1a',
    borderWidth: 1,
    borderColor: '#4a7a4a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  devLabel: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#88cc88',
  },
  headerWrapperCentered: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 12,
  },
  appTitle: {
    fontFamily: 'Helvetica',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#FFFFF0',
  },
  button: {
    backgroundColor: '#374635',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Helvetica',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
