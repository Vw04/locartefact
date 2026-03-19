import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const N_KEYFRAMES = 60;

export default function GlobeSpinner({ r = 50 }: { r?: number }) {
  const cx = r + 2;
  const cy = r + 2;
  const size = (r + 2) * 2;
  const rx = r * 0.42; // longitude ellipse horizontal radius
  const ry = r;        // longitude ellipse vertical radius (full globe height)
  const dotR = r * 0.12;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: false, // SVG props cannot use native driver
      })
    ).start();
    return () => progress.stopAnimation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Precompute 61-point ellipse path as interpolation keyframes
  const inputRange = Array.from({ length: N_KEYFRAMES + 1 }, (_, i) => i / N_KEYFRAMES);
  const dotX = progress.interpolate({
    inputRange,
    outputRange: inputRange.map((v) => cx + rx * Math.cos(2 * Math.PI * v)),
  });
  const dotY = progress.interpolate({
    inputRange,
    outputRange: inputRange.map((v) => cy + ry * Math.sin(2 * Math.PI * v)),
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Static globe outline — teal accent ellipse omitted to avoid competing with dot */}
      <Circle cx={cx} cy={cy} r={r} stroke="#FFFFF0" strokeWidth={1.5} fill="none" />
      <Ellipse cx={cx} cy={cy - r * 0.3} rx={r * 0.95} ry={r * 0.25} stroke="#FFFFF0" strokeWidth={1} fill="none" />
      <Ellipse cx={cx} cy={cy + r * 0.3} rx={r * 0.95} ry={r * 0.25} stroke="#FFFFF0" strokeWidth={1} fill="none" />
      <Ellipse cx={cx} cy={cy} rx={r * 0.42} ry={r} stroke="#FFFFF0" strokeWidth={1} fill="none" />
      {/* Animated teal dot tracing the central longitude ellipse */}
      <AnimatedCircle cx={dotX} cy={dotY} r={dotR} fill="#2A9D8F" />
    </Svg>
  );
}
