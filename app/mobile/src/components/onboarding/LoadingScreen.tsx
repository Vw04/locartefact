import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = { onDone: () => void };

export default function LoadingScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Geolore</Text>
      <Text style={styles.tagline}>Discover the story of where you are.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202C1F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: 'Helvetica',
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFF0',
    marginBottom: 12,
  },
  tagline: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    color: 'rgba(255,255,240,0.6)',
    textAlign: 'center',
  },
});
