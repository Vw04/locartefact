import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNearbyFacts } from './wikipedia';
import type { NotifSettings } from './keystore';

const TASK = 'GEOLORE_WALK_AROUND';
const LAST_NOTIF_KEY = 'walk_last_notif_ts';
const SEEN_IDS_KEY = 'walk_seen_ids';

// Must be defined at module top-level (outside components) for background execution
TaskManager.defineTask(TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
  if (error) {
    console.log('[walkAround] task error:', error);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  const loc = locations?.[0];
  if (!loc) return;

  try {
    // Read persisted settings
    const settingsRaw = await AsyncStorage.getItem('notif_settings');
    const settings: NotifSettings = settingsRaw
      ? { enabled: false, frequencyMs: 300000, bulletCount: 2, ...JSON.parse(settingsRaw) }
      : { enabled: false, frequencyMs: 300000, bulletCount: 2 };

    if (!settings.enabled) return;

    // Debounce by frequency
    const lastTs = Number((await AsyncStorage.getItem(LAST_NOTIF_KEY)) ?? '0');
    if (Date.now() - lastTs < settings.frequencyMs) return;

    // Fetch facts (uses in-memory cache when location hasn't changed much)
    const facts = await fetchNearbyFacts(loc.coords.latitude, loc.coords.longitude);
    if (facts.length === 0) return;

    // Pick an unseen fact
    const seenRaw = await AsyncStorage.getItem(SEEN_IDS_KEY);
    const seen: number[] = seenRaw ? JSON.parse(seenRaw) : [];
    const unseen = facts.filter((f) => !seen.includes(f.pageId) && f.extract.length > 80);
    if (unseen.length === 0) return;

    const fact = unseen[0];

    // Format body from extract sentences (no Claude synthesis in background)
    const sentences = fact.extract
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.length > 20)
      .slice(0, settings.bulletCount);
    const body = sentences.map((s) => `• ${s}`).join('\n');

    await Notifications.scheduleNotificationAsync({
      content: {
        title: fact.title,
        body,
        data: { pageId: fact.pageId, title: fact.title },
        sound: true,
      },
      trigger: null, // immediate
    });

    await AsyncStorage.setItem(LAST_NOTIF_KEY, String(Date.now()));
    await AsyncStorage.setItem(
      SEEN_IDS_KEY,
      JSON.stringify([...seen, fact.pageId].slice(-50))
    );

    console.log(`[walkAround] notified: "${fact.title}"`);
  } catch (err) {
    console.log('[walkAround] task exception:', err);
  }
});

export async function requestWalkAroundPermissions(): Promise<{ granted: boolean; reason?: string }> {
  const { status: notifStatus } = await Notifications.requestPermissionsAsync();
  if (notifStatus !== 'granted') {
    return { granted: false, reason: 'Notification permission denied. Enable in iOS Settings > Geolore > Notifications.' };
  }
  const { status: locStatus } = await Location.requestBackgroundPermissionsAsync();
  if (locStatus !== 'granted') {
    return { granted: false, reason: 'Background location permission denied. Enable "Always" in iOS Settings > Geolore > Location.' };
  }
  return { granted: true };
}

export async function startWalkAround(): Promise<{ started: boolean; reason?: string }> {
  const { granted, reason } = await requestWalkAroundPermissions();
  if (!granted) return { started: false, reason };

  await Location.startLocationUpdatesAsync(TASK, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 50, // fire after 50m movement minimum
    showsBackgroundLocationIndicator: true,
    activityType: Location.ActivityType.Fitness,
  });
  console.log('[walkAround] started');
  return { started: true };
}

export async function stopWalkAround(): Promise<void> {
  const running = await isWalkAroundRunning();
  if (running) {
    await Location.stopLocationUpdatesAsync(TASK);
    console.log('[walkAround] stopped');
  }
}

export async function isWalkAroundRunning(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(TASK);
  } catch {
    return false;
  }
}
