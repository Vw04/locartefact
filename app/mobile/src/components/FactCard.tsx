import React, { useState } from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Fact } from '../types/place';

type Props = { fact: Fact };

const IMAGE_H = 80;

export default function FactCard({ fact }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [headerH, setHeaderH] = useState(IMAGE_H);

  const openMaps = () =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${fact.lat},${fact.lon}`);

  const openWikipedia = () => Linking.openURL(fact.sourceUrl);

  const distanceLabel =
    fact.hasGeoData && fact.distance > 0
      ? fact.distance >= 1000
        ? `${(fact.distance / 1000).toFixed(1)} km away`
        : `${Math.round(fact.distance)} m away`
      : null;

  const factsContent = fact.synthesizedFacts ? (
    <View style={styles.factsContainer}>
      {fact.synthesizedFacts.map((f, i, arr) => (
        <View key={i} style={[styles.factItem, i === arr.length - 1 && styles.factItemLast]}>
          <Text style={styles.factText}>{f}</Text>
        </View>
      ))}
    </View>
  ) : (
    <Text style={styles.extract}>{fact.extract}</Text>
  );

  const cardBody = (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded((v) => !v)}
    >
      {fact.thumbnail ? (
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: fact.thumbnail }} style={styles.thumbnail} />

          {/* Header always beside image */}
          <View
            style={styles.thumbnailHeader}
            onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
          >
            <Text style={styles.title}>{fact.title}</Text>
            {distanceLabel && <Text style={styles.distance}>{distanceLabel}</Text>}
          </View>

          {/* Facts: beside image if header didn't fill it, full-width otherwise */}
          <View style={headerH < IMAGE_H ? styles.thumbnailInset : undefined}>
            {factsContent}
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.title}>{fact.title}</Text>
          {distanceLabel && <Text style={styles.distance}>{distanceLabel}</Text>}
          {factsContent}
        </>
      )}
      {expanded && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedLabel}>Full article summary</Text>
          <Text style={styles.extract}>{fact.extract}</Text>
          <TouchableOpacity onPress={openWikipedia} style={styles.articleLink}>
            <Ionicons name="open-outline" size={13} color="rgba(255,251,188,0.6)" />
            <Text style={styles.articleLinkText}>Read full article</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.card}>
      {cardBody}
      <View style={[styles.buttonRow, !fact.hasGeoData && styles.buttonRowNoMap]}>
        {fact.hasGeoData && (
          <TouchableOpacity onPress={openMaps} style={styles.footerBtn}>
            <Ionicons name="map-outline" size={15} color="rgba(255,251,188,0.6)" />
            <Text style={styles.linkText}>Map</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setExpanded((v) => !v)} style={styles.footerBtn}>
          <Text style={styles.expandHint}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#374635',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Helvetica',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#FFFFF0',
  },
  distance: {
    fontFamily: 'Helvetica',
    fontSize: 13,
    color: '#FFFFF0',
    marginBottom: 6,
  },
  extract: {
    fontFamily: 'Helvetica',
    fontSize: 15,
    color: '#FFFFF0',
    lineHeight: 22,
  },
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnailHeader: {
    paddingRight: 100,
  },
  thumbnailInset: {
    paddingRight: 100,
  },
  thumbnail: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  factsContainer: {
    marginTop: 2,
  },
  factItem: {
    marginBottom: 8,
  },
  factItemLast: {
    marginBottom: 0,
  },
  factText: {
    fontFamily: 'Helvetica',
    fontSize: 15,
    color: '#FFFFF0',
    lineHeight: 22,
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  expandedLabel: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: 'rgba(255,255,240,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  articleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  articleLinkText: {
    fontFamily: 'Helvetica',
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,251,188,0.6)',
    letterSpacing: 0.3,
  },
  expandHint: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: 'rgba(255,255,240,0.35)',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  buttonRowNoMap: {
    justifyContent: 'flex-end',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  linkText: {
    fontFamily: 'Helvetica',
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,251,188,0.6)',
    letterSpacing: 0.3,
  },
});
