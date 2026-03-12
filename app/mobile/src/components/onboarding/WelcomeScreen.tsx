import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrandLogo from '../BrandLogo';

type Props = { onNext: () => void };

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'location-outline', text: 'Tap refresh to surface nearby points of interest.' },
  { icon: 'flash-outline',    text: 'Geolore synthesizes them into punchy, conversation-ready facts at your fingertips.' },
  { icon: 'options-outline',  text: 'Filter by radius and interests.' },
];

export default function WelcomeScreen({ onNext }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <BrandLogo size="lg" />
        <Text style={styles.tagline}>Discover the story of where you are.</Text>
      </View>
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.icon} style={styles.featureRow}>
            <Ionicons name={f.icon} size={22} color="rgba(255,255,240,0.7)" style={styles.iconStyle} />
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2218',
    paddingHorizontal: 28,
    paddingTop: 100,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Helvetica',
    fontSize: 52,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FFFFF0',
  },
  tagline: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    fontStyle: 'italic',
    color: '#FFFFF0',
    textAlign: 'center',
  },
  features: {
    flex: 1,
    justifyContent: 'space-evenly',
    marginTop: 24,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconStyle: {
    marginTop: 1,
  },
  featureText: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: 'rgba(255,255,240,0.85)',
    lineHeight: 20,
    flex: 1,
  },
  button: {
    backgroundColor: '#1A3828',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFF0',
  },
});
