import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BrandLogo from './BrandLogo';
import GlobeSpinner from './GlobeSpinner';

type Props = {
  loading: boolean;
  onCardView: () => void;
};

export default function HomeScreen({ loading, onCardView }: Props) {
  if (loading) {
    return (
      <View style={styles.spinnerContainer}>
        <GlobeSpinner r={50} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <BrandLogo size="xl" />
        <Text style={styles.tagline}>Discover the story of where you are.</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onCardView}>
          <Text style={styles.primaryButtonText}>Card View</Text>
        </TouchableOpacity>
        <View style={styles.mapButton}>
          <Text style={styles.mapButtonText}>Map View  ·  Coming soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2218',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  tagline: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255,255,240,0.65)',
    textAlign: 'center',
    marginTop: 4,
  },
  spinnerContainer: {
    flex: 1,
    backgroundColor: '#0D2218',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1A3828',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFF0',
  },
  mapButton: {
    borderWidth: 1,
    borderColor: '#374635',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    opacity: 0.35,
  },
  mapButtonText: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFF0',
  },
});
