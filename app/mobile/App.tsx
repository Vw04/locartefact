import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import FactCard from './src/components/FactCard';
import LoadingScreen from './src/components/onboarding/LoadingScreen';
import WelcomeScreen from './src/components/onboarding/WelcomeScreen';
import ApiKeyScreen from './src/components/onboarding/ApiKeyScreen';
import InterestsScreen from './src/components/onboarding/InterestsScreen';
import type { Fact } from './src/types/place';
import { getCurrentLocation } from './src/services/location';
import { getOnboardingComplete, setOnboardingComplete, getUserInterests } from './src/services/keystore';
import { fetchNearbyFacts, reverseGeocodeLabel } from './src/services/wikipedia';
import { rankFacts } from './src/services/ranking';
import { synthesizeFacts } from './src/services/synthesis';
import SAMPLE_LOCATIONS from './src/data/sample-locations.json';

const DEV_CITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Tokyo':       { bg: '#2d1040', border: '#9955cc', text: '#cc88ff' },
  'Paris':       { bg: '#2e2a00', border: '#ccaa00', text: '#ffdd44' },
  'Moscow':      { bg: '#e8e8e8', border: '#aaaaaa', text: '#1a1a1a' },
  'Los Angeles': { bg: '#0a1a3a', border: '#4466cc', text: '#88aaff' },
  'Miami':       { bg: '#3a1800', border: '#cc6600', text: '#ffaa44' },
  'Hong Kong':   { bg: '#3a0a0a', border: '#cc3333', text: '#ff7777' },
};

export default function App() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [status, setStatus] = useState<string>('Tap refresh to discover nearby facts.');
  const [loading, setLoading] = useState<boolean>(false);
  const [radius, setRadius] = useState<number>(5000);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [factCount, setFactCount] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<'loading' | 'welcome' | 'apikey' | 'interests' | null>('loading');
  const [interests, setInterests] = useState<string[]>(['All']);

  useEffect(() => {
    getOnboardingComplete().then((done) => {
      if (done) {
        getUserInterests().then(setInterests);
        setOnboardingStep(null);
      }
      // else stay at 'loading' — LoadingScreen will auto-advance
    });
  }, []);

  // Recompute factCount whenever radius or facts change
  useEffect(() => {
    if (facts.length > 0) {
      setFactCount(facts.filter((f) => f.distance === 0 || f.distance <= radius).length);
    }
  }, [radius, facts]);

  const hasLoaded = facts.length > 0 || loading;

  const displayedFacts = facts
    .filter((f) => f.distance === 0 || f.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  const radiusLabel = radius >= 1000
    ? `${(radius / 1000).toFixed(1)} km`
    : `${radius} m`;

  const runWithCoords = async (lat: number, lon: number, label: string) => {
    setLoading(true);
    setCurrentCoords(null);
    setFactCount(null);
    setLocationLabel(null);
    setStatus(`Loading: ${label}`);
    try {
      const [rawFacts, geoLabel] = await Promise.all([
        fetchNearbyFacts(lat, lon),
        reverseGeocodeLabel(lat, lon),
      ]);
      const maxPool = !interests.includes('All') ? 60 : 40;
      const ranked = rankFacts(rawFacts, maxPool);
      const preSort = [...ranked].sort((a, b) => a.distance - b.distance);
      setFacts(preSort);
      setCurrentCoords({ lat, lon });
      setLocationLabel(geoLabel || label);
      const synthesized = await synthesizeFacts(ranked, interests);
      const sorted = [...synthesized].sort((a, b) => a.distance - b.distance);
      setFacts(sorted);
    } catch {
      setStatus('Location Not Found');
      setFacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setCurrentCoords(null);
    setFactCount(null);
    setLocationLabel(null);
    setStatus('Requesting location…');
    try {
      const { latitude, longitude } = await getCurrentLocation();
      await runWithCoords(latitude, longitude, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } catch {
      setStatus('Location Not Found');
      setFacts([]);
      setLoading(false);
    }
  };

  const finishOnboarding = async (selectedInterests: string[]) => {
    setInterests(selectedInterests);
    await setOnboardingComplete();
    setOnboardingStep(null);
  };

  if (onboardingStep === 'loading') {
    return <LoadingScreen onDone={() => setOnboardingStep('welcome')} />;
  }
  if (onboardingStep === 'welcome') {
    return <WelcomeScreen onNext={() => setOnboardingStep('apikey')} />;
  }
  if (onboardingStep === 'apikey') {
    return <ApiKeyScreen onNext={() => setOnboardingStep('interests')} onBack={() => setOnboardingStep('welcome')} />;
  }
  if (onboardingStep === 'interests') {
    return <InterestsScreen onDone={finishOnboarding} onBack={() => setOnboardingStep('apikey')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {__DEV__ && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.devBar}
          contentContainerStyle={styles.devBarContent}
        >
          {SAMPLE_LOCATIONS.locations.map((loc) => {
            const c = DEV_CITY_COLORS[loc.label];
            return (
              <TouchableOpacity
                key={loc.label}
                style={[styles.devButton, c && { backgroundColor: c.bg, borderColor: c.border }]}
                onPress={() => runWithCoords(loc.lat, loc.lon, loc.label)}
                disabled={loading}
              >
                <Text style={[styles.devLabel, c && { color: c.text }]}>{loc.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={!hasLoaded ? styles.headerWrapperCentered : undefined}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={{ width: 32 }} />
            <Text style={styles.appTitle}>Geolore</Text>
            <TouchableOpacity onPress={() => setOnboardingStep('interests')} style={styles.settingsBtn}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </TouchableOpacity>
          </View>
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
          {currentCoords && factCount !== null ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lon}`)}
            >
              <Text style={styles.statusCoords}>
                {locationLabel ? `${locationLabel} — ` : ''}{currentCoords.lat.toFixed(5)}, {currentCoords.lon.toFixed(5)} — {factCount} facts found
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.status}>{status}</Text>
          )}
          {hasLoaded && (
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Radius: {radiusLabel}</Text>
              <View style={styles.sliderRow}>
                <Text style={styles.sliderEndLabel}>0 m</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10000}
                  step={100}
                  value={radius}
                  onValueChange={setRadius}
                  minimumTrackTintColor="#88cc88"
                  maximumTrackTintColor="#4a7a4a"
                  thumbTintColor="#FFFFF0"
                />
                <Text style={styles.sliderEndLabel}>10 km</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {hasLoaded && (
        <FlatList
          data={displayedFacts}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  appTitle: {
    fontFamily: 'Helvetica',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFF0',
  },
  settingsBtn: {
    width: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  menuLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,240,0.5)',
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
  statusCoords: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sliderContainer: {
    marginTop: 12,
  },
  sliderLabel: {
    fontFamily: 'Helvetica',
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderEndLabel: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    width: 32,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 32,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
