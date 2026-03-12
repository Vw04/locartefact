import React from 'react';
import { Image } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<Size, { width: number; height: number }> = {
  sm: { width: 130, height: 49 },
  md: { width: 170, height: 64 },
  lg: { width: 240, height: 90 },
};

// Primary dark logo (dark #0D2218 background blends with all app screens)
const LOGO = require('../../../assets/Untitled design.png');

type Props = { size?: Size };

export default function BrandLogo({ size = 'md' }: Props) {
  const { width, height } = SIZE_MAP[size];
  return <Image source={LOGO} style={{ width, height }} resizeMode="contain" />;
}
