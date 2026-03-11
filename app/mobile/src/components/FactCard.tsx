import React, { useState } from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Fact } from '../types/place';

type Props = { fact: Fact };

export default function FactCard({ fact }: Props) {
  const [expanded, setExpanded] = useState(false);

  const openMaps = () =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${fact.lat},${fact.lon}`);

  const openWikipedia = () => Linking.openURL(fact.sourceUrl);

  const bodyContent = (
    <>
      <Text style={styles.title}>{fact.title}</Text>
      {fact.hasGeoData && fact.distance > 0 && (
        <Text style={styles.distance}>
          {fact.distance >= 1000
            ? `${(fact.distance / 1000).toFixed(1)} km away`
            : `${Math.round(fact.distance)} m away`}
        </Text>
      )}
      {fact.synthesizedFacts ? (
        <View style={styles.factsContainer}>
          {fact.synthesizedFacts.map((f, i) => (
            <Text key={i} style={styles.factBullet}>{'• '}{f}</Text>
          ))}
        </View>
      ) : (
        <Text style={styles.extract}>{fact.extract}</Text>
      )}
      {expanded && fact.synthesizedFacts && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedLabel}>Full article summary</Text>
          <Text style={styles.extract}>{fact.extract}</Text>
        </View>
      )}
      <Text style={styles.expandHint}>{expanded ? '▲ Less' : '▼ More'}</Text>
    </>
  );

  const cardBody = (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setExpanded((v) => !v)}
    >
      {fact.thumbnail ? (
        <View style={styles.row}>
          <Image source={{ uri: fact.thumbnail }} style={styles.thumbnail} />
          <View style={styles.textContainer}>{bodyContent}</View>
        </View>
      ) : (
        bodyContent
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.card}>
      {cardBody}
      <View style={[styles.buttonRow, !fact.hasGeoData && styles.buttonRowCentered]}>
        {fact.hasGeoData && (
          <TouchableOpacity onPress={openMaps}>
            <Text style={styles.linkText}>Map View</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={openWikipedia}>
          <Text style={styles.linkText}>Learn More</Text>
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
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    color: '#FFFFF0',
  },
  distance: {
    fontFamily: 'Helvetica',
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  extract: {
    fontFamily: 'Helvetica',
    fontSize: 15,
    color: '#FFFFF0',
    lineHeight: 22,
  },
  factsContainer: {
    marginTop: 4,
    gap: 6,
  },
  factBullet: {
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
  expandHint: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: 'rgba(255,255,240,0.4)',
    marginTop: 8,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    paddingTop: 10,
  },
  buttonRowCentered: {
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: '#F8FABC',
  },
});
