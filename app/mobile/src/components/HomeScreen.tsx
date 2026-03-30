import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BrandLogo from './BrandLogo';
import GlobeSpinner from './GlobeSpinner';

type Props = {
  loading: boolean;
  onCardView: () => void;
};

export default function HomeScreen({ loading, onCardView }: Props) {
  const brandLogoRef = useRef<View>(null);
  const [timerDone, setTimerDone] = useState(false);
  const [transitionDone, setTransitionDone] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);

  const spinnerTranslateX = useRef(new Animated.Value(0)).current;
  const spinnerTranslateY = useRef(new Animated.Value(0)).current;
  const spinnerScale      = useRef(new Animated.Value(1)).current;
  const spinnerOpacity    = useRef(new Animated.Value(1)).current;
  const contentOpacity    = useRef(new Animated.Value(0)).current;

  // 3-second minimum timer
  useEffect(() => {
    const id = setTimeout(() => setTimerDone(true), 2000);
    return () => clearTimeout(id);
  }, []);

  // Trigger transition when both conditions met
  useEffect(() => {
    if (timerDone && !loading && !transitionDone) {
      startTransition();
    }
  }, [timerDone, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  function startTransition() {
    setTransitionDone(true);
    brandLogoRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      const { width: sw, height: sh } = Dimensions.get('window');
      // Globe SVG center within BrandLogo: r=32, so offset = r+2 = 34
      const dx = (pageX + 34) - sw / 2;
      const dy = (pageY + 34) - sh / 2;

      Animated.parallel([
        Animated.timing(spinnerTranslateX, {
          toValue: dx, duration: 600,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(spinnerTranslateY, {
          toValue: dy, duration: 600,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(spinnerScale, {
          toValue: 0.64, duration: 600,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(spinnerOpacity, {
          toValue: 0, duration: 600,
          easing: Easing.in(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1, duration: 500, delay: 150,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
      ]).start(() => setShowSpinner(false));
    });
  }

  return (
    <View style={styles.root}>
      {/* Home content — always rendered for ref measurement, fades in during transition */}
      <Animated.View style={[styles.container, { opacity: contentOpacity }]}>
        <View style={styles.center}>
          <View ref={brandLogoRef} collapsable={false}>
            <BrandLogo size="xl" />
          </View>
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
      </Animated.View>

      {/* Spinner overlay — absolute, removed after transition */}
      {showSpinner && (
        <Animated.View
          style={[styles.spinnerOverlay, {
            opacity: spinnerOpacity,
            transform: [
              { translateX: spinnerTranslateX },
              { translateY: spinnerTranslateY },
              { scale: spinnerScale },
            ],
          }]}
          pointerEvents="none"
        >
          <GlobeSpinner r={50} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#101318',
  },
  container: {
    flex: 1,
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
    color: 'rgba(236,238,242,0.65)',
    textAlign: 'center',
    marginTop: 4,
  },
  spinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#181D25',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    fontWeight: '600',
    color: '#ECEEF2',
  },
  mapButton: {
    borderWidth: 1,
    borderColor: '#20262E',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    opacity: 0.35,
  },
  mapButtonText: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    fontWeight: '500',
    color: '#ECEEF2',
  },
});
