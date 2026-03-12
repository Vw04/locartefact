import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Size = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<Size, { icon: number; fontSize: number; fontWeight: '700' | '800'; gap: number }> = {
  sm: { icon: 22, fontSize: 22, fontWeight: '700', gap: 6 },
  md: { icon: 32, fontSize: 28, fontWeight: '700', gap: 10 },
  lg: { icon: 48, fontSize: 40, fontWeight: '800', gap: 14 },
};

type Props = { size?: Size };

export default function BrandLogo({ size = 'md' }: Props) {
  const { icon, fontSize, fontWeight, gap } = SIZE_MAP[size];
  return (
    <View style={[styles.row, { gap }]}>
      <Ionicons name="earth-outline" size={icon} color="#FFFFF0" />
      <Text style={[styles.text, { fontSize, fontWeight }]}>Geolore</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Helvetica',
    color: '#FFFFF0',
  },
});
