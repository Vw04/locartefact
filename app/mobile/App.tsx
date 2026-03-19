import React, { useEffect, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import FactCard from './src/components/FactCard';
import BrandLogo from './src/components/BrandLogo';
import SettingsScreen from './src/components/SettingsScreen';
import HomeScreen from './src/components/HomeScreen';
import WelcomeScreen from './src/components/onboarding/WelcomeScreen';
import ApiKeyScreen from './src/components/onboarding/ApiKeyScreen';
import InterestsScreen from './src/components/onboarding/InterestsScreen';
import type { Fact } from './src/types/place';
import { getCurrentLocation } from './src/services/location';
import {
  getOnboardingComplete, setOnboardingComplete, getUserInterests, setUserInterests,
  getNotifSettings, setNotifSettings,
  getDisplaySettings, setDisplaySettings as saveDisplaySettings,
} from './src/services/keystore';
import type { NotifSettings, DisplaySettings } from './src/services/keystore';
import { fetchNearbyFacts, reverseGeocodeLabel } from './src/services/wikipedia';
import { rankFacts } from './src/services/ranking';
import { synthesizeFacts } from './src/services/synthesis';
import * as Notifications from 'expo-notifications';
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
  const [status, setStatus] = useState<string>('Discovering nearby facts…');
  const [loading, setLoading] = useState<boolean>(false);
  const [radius, setRadius] = useState<number>(1000);
  const [synthRadius, setSynthRadius] = useState<number>(1000);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [factCount, setFactCount] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<'checking' | 'welcome' | 'apikey' | 'interests' | null>('checking');
  const [interests, setInterests] = useState<string[]>(['All']);
  const [showSettings, setShowSettings] = useState(false);
  const [notifSettings, setNotifState] = useState<NotifSettings>({ enabled: false, frequencyMs: 300000, bulletCount: 2 });
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({ sortOrder: 'distance', maxFacts: 5 });
  const [showHome, setShowHome] = useState(false);

  // Keep a stable ref to runWithCoords for use inside the startup effect
  const runWithCoordsRef = useRef<((lat: number, lon: number, label: string, interestsOverride?: string[]) => Promise<void>) | null>(null);

  useEffect(() => {
    (async () => {
      const done = await getOnboardingComplete();
      if (done) {
        const [savedInterests, savedNotif, savedDisplay] = await Promise.all([
          getUserInterests(),
          getNotifSettings(),
          getDisplaySettings(),
        ]);
        setInterests(savedInterests);
        setNotifState(savedNotif);
        setDisplaySettings(savedDisplay);
        setOnboardingStep(null);
        setShowHome(true);
        // Auto-refresh with correct interests before state settles
        try {
          setLoading(true);
          setStatus('Discovering nearby facts…');
          const { latitude, longitude } = await getCurrentLocation();
          await runWithCoordsRef.current?.(latitude, longitude, 'Your Location', savedInterests);
        } catch {
          setStatus('Location Not Found');
          setLoading(false);
        }
      } else {
        setOnboardingStep('welcome');
      }
    })();

    // Handle notification taps — bring app to foreground on main screen
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      setShowSettings(false);
      setOnboardingStep(null);
    });
    return () => sub.remove();
  }, []);

  // Recompute factCount whenever radius or facts change
  useEffect(() => {
    if (facts.length > 0) {
      setFactCount(facts.filter((f) => f.distance === 0 || f.distance <= radius).length);
    }
  }, [radius, facts]);

  // JIT synthesis: synthesize newly-exposed facts when synthRadius/sort/maxFacts changes
  useEffect(() => {
    if (facts.length === 0 || loading) return;
    const currentDisplayed = facts
      .filter((f) => f.distance === 0 || f.distance <= synthRadius)
      .sort((a, b) =>
        displaySettings.sortOrder === 'notable'
          ? b.extract.length - a.extract.length
          : a.distance - b.distance
      )
      .slice(0, displaySettings.maxFacts);
    const needsSynthesis = currentDisplayed.filter((f) => !f.synthesizedFacts);
    if (needsSynthesis.length === 0) return;
    const needsIds = new Set(needsSynthesis.map((f) => f.pageId));
    synthesizeFacts(needsSynthesis, interests).then((synthesized) => {
      const synthesizedIds = new Set(synthesized.map((f) => f.pageId));
      const map = new Map(synthesized.map((f) => [f.pageId, f]));
      const hasInterestFilter = !interests.includes('All');
      setFacts((prev) =>
        prev
          .map((f) => {
            if (map.has(f.pageId)) return map.get(f.pageId)!;
            if (hasInterestFilter && needsIds.has(f.pageId) && !synthesizedIds.has(f.pageId)) return null;
            return f;
          })
          .filter((f): f is Fact => f !== null)
          .sort((a, b) => a.distance - b.distance)
      );
    });
  }, [synthRadius, displaySettings.sortOrder, displaySettings.maxFacts]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasLoaded = facts.length > 0 || loading;

  const displayedFacts = facts
    .filter((f) => f.distance === 0 || f.distance <= radius)
    .sort((a, b) =>
      displaySettings.sortOrder === 'notable'
        ? b.extract.length - a.extract.length
        : a.distance - b.distance
    )
    .slice(0, displaySettings.maxFacts);

  const radiusLabel = radius >= 1000
    ? `${(radius / 1000).toFixed(1)} km`
    : `${radius} m`;

  const runWithCoords = async (lat: number, lon: number, label: string, interestsOverride = interests) => {
    setLoading(true);
    setCurrentCoords(null);
    setFactCount(null);
    setLocationLabel(null);
    setStatus('Discovering nearby facts…');
    try {
      const [rawFacts, geoLabel] = await Promise.all([
        fetchNearbyFacts(lat, lon),
        reverseGeocodeLabel(lat, lon),
      ]);
      const RANK_POOL = interestsOverride.includes('All') ? 20 : 28;
      const ranked = rankFacts(rawFacts, RANK_POOL);
      setFacts([...ranked].sort((a, b) => a.distance - b.distance));

      const initialVisible = ranked
        .filter((f) => f.distance === 0 || f.distance <= radius)
        .sort((a, b) =>
          displaySettings.sortOrder === 'notable'
            ? b.extract.length - a.extract.length
            : a.distance - b.distance
        )
        .slice(0, displaySettings.maxFacts);

      const synthesized = await synthesizeFacts(initialVisible, interestsOverride);
      const synthesizedMap = new Map(synthesized.map((f) => [f.pageId, f]));
      const hasInterestFilter = !interestsOverride.includes('All');
      const merged = ranked
        .map((f) => synthesizedMap.get(f.pageId) ?? (hasInterestFilter ? null : f))
        .filter((f): f is Fact => f !== null);
      setFacts([...merged].sort((a, b) => a.distance - b.distance));
      setCurrentCoords({ lat, lon });
      setLocationLabel(geoLabel || label);
    } catch {
      setStatus('Location Not Found');
      setFacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep ref in sync so startup effect can call it
  runWithCoordsRef.current = runWithCoords;

  const handleRefresh = async () => {
    setLoading(true);
    setCurrentCoords(null);
    setFactCount(null);
    setLocationLabel(null);
    setStatus('Requesting location…');
    try {
      const { latitude, longitude } = await getCurrentLocation();
      await runWithCoords(latitude, longitude, 'Your Location');
    } catch {
      setStatus('Location Not Found');
      setFacts([]);
      setLoading(false);
    }
  };

  const finishOnboarding = async (selectedInterests: string[]) => {
    setInterests(selectedInterests);
    await setOnboardingComplete();
    await setUserInterests(selectedInterests);
    setOnboardingStep(null);
    setShowHome(true);
    try {
      setLoading(true);
      setStatus('Discovering nearby facts…');
      const { latitude, longitude } = await getCurrentLocation();
      await runWithCoords(latitude, longitude, 'Your Location', selectedInterests);
    } catch {
      setStatus('Location Not Found');
      setLoading(false);
    }
  };

  const handleSaveSettings = async (newInterests: string[], newNotif: NotifSettings, newDisplay: DisplaySettings) => {
    setInterests(newInterests);
    setNotifState(newNotif);
    setDisplaySettings(newDisplay);
    await setUserInterests(newInterests);
    await setNotifSettings(newNotif);
    await saveDisplaySettings(newDisplay);
    setShowSettings(false);
  };

  if (showHome) {
    return (
      <HomeScreen
        loading={loading}
        onCardView={() => setShowHome(false)}
      />
    );
  }

  if (onboardingStep === 'checking') {
    return <View style={{ flex: 1, backgroundColor: '#0D2218' }} />;
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
          <TouchableOpacity
            style={[styles.devButton, { backgroundColor: '#2a1a0a', borderColor: '#cc8844' }]}
            onPress={() => setOnboardingStep('welcome')}
          >
            <Text style={[styles.devLabel, { color: '#ffbb66' }]}>↩ Onboarding</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.devButton, { backgroundColor: '#0a1a12', borderColor: '#2A9D8F' }]}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Text style={[styles.devLabel, { color: '#2A9D8F' }]}>📍 Location</Text>
          </TouchableOpacity>
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

      <View style={styles.header}>
        <View style={styles.titleRow}>
          {hasLoaded && <BrandLogo size="md" />}
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsBtn}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={!hasLoaded ? styles.contentCentered : styles.contentNormal}>
        {!hasLoaded && (
          <View style={styles.logoCenter}>
            <BrandLogo size="xl" />
          </View>
        )}
        {loading && !hasLoaded && (
          <ActivityIndicator color="#FFFFF0" style={{ marginBottom: 12 }} />
        )}
        {currentCoords && factCount !== null ? (
          <TouchableOpacity
            style={styles.infoBar}
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lon}`)}
          >
            <Ionicons name="navigate-outline" size={12} color="rgba(255,255,225,0.4)" style={{ marginRight: 5 }} />
            <Text style={[styles.infoBarText, { flex: 1 }]}>{locationLabel || 'Current Location'}</Text>
            <Text style={styles.infoBarStats}>{displayedFacts.length} {displayedFacts.length === 1 ? 'fact' : 'facts'} · {radiusLabel}</Text>
          </TouchableOpacity>
        ) : (
          !loading && <Text style={styles.status}>{status}</Text>
        )}
        {hasLoaded && (
          <View style={styles.sliderContainer}>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderEndLabel}>0 m</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={3000}
                step={100}
                value={radius}
                onValueChange={setRadius}
                onSlidingComplete={setSynthRadius}
                minimumTrackTintColor="#2A9D8F"
                maximumTrackTintColor="#1E5038"
                thumbTintColor="#FFFFF0"
              />
              <Text style={styles.sliderEndLabel}>3 km</Text>
            </View>
          </View>
        )}
      </View>

      {hasLoaded && !loading && displayedFacts.length === 0 && (
        <Text style={[styles.status, { paddingHorizontal: 20, marginTop: 16 }]}>
          No {interests.includes('All') ? '' : `${interests[0]} `}facts found nearby. Try a wider radius or update your interests in Settings.
        </Text>
      )}

      {hasLoaded && (
        <FlatList
          data={displayedFacts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <FactCard fact={item} />}
        />
      )}

      <SettingsScreen
        visible={showSettings}
        interests={interests}
        notifSettings={notifSettings}
        displaySettings={displaySettings}
        onSave={handleSaveSettings}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2218',
  },
  devBar: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#050F0A',
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  titleRow: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    minHeight: 36,
  },
  settingsBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  logoCenter: {
    alignItems: 'center',
    marginBottom: 32,
  },
  contentCentered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contentNormal: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFF0',
  },
  status: {
    fontFamily: 'Helvetica',
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 225, 0.85)',
    textAlign: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: '#1A3828',
    marginBottom: 8,
  },
  infoBarText: {
    fontFamily: 'Helvetica',
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 225, 0.85)',
    letterSpacing: 0.1,
  },
  infoBarStats: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 225, 0.72)',
    letterSpacing: 0.1,
  },
  sliderContainer: {
    marginTop: 4,
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
