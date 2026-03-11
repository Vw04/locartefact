import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  apiKey: 'anthropic_api_key',
  onboardingComplete: 'onboarding_complete',
  userInterests: 'user_interests',
};

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.apiKey);
}

export async function setApiKey(key: string): Promise<void> {
  return AsyncStorage.setItem(KEYS.apiKey, key.trim());
}

export async function clearApiKey(): Promise<void> {
  return AsyncStorage.removeItem(KEYS.apiKey);
}

export async function getOnboardingComplete(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.onboardingComplete);
  return val === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  return AsyncStorage.setItem(KEYS.onboardingComplete, 'true');
}

export async function getUserInterests(): Promise<string[]> {
  const val = await AsyncStorage.getItem(KEYS.userInterests);
  if (!val) return ['All'];
  try { return JSON.parse(val); } catch { return ['All']; }
}

export async function setUserInterests(interests: string[]): Promise<void> {
  return AsyncStorage.setItem(KEYS.userInterests, JSON.stringify(interests));
}
