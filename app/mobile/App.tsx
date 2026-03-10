import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';

export default function App() {
  const [latitude, setLatitude] = useState<string>('—');
  const [longitude, setLongitude] = useState<string>('—');
  const [status, setStatus] = useState<string>('Ready');
  const [loading, setLoading] = useState<boolean>(false);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setStatus('Requesting location permission...');

      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();

      if (permissionStatus !== 'granted') {
        setStatus('Location permission denied');
        Alert.alert(
          'Location Permission Needed',
          'Locartefact needs location access to find nearby facts.'
        );
        return;
      }

      setStatus('Fetching current location...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(location.coords.latitude.toFixed(6));
      setLongitude(location.coords.longitude.toFixed(6));
      setStatus('Location fetched successfully');
    } catch (error) {
      console.error(error);
      setStatus('Failed to fetch location');
      Alert.alert('Error', 'Could not get your current location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Locartefact</Text>
        <Text style={styles.subtitle}>
          Turn on location and discover facts about the world around you.
        </Text>

        <TouchableOpacity style={styles.button} onPress={getCurrentLocation} disabled={loading}>
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
    justifyContent: 'center',
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
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
});