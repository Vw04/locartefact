import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Fact } from '../types/place';

type Props = { fact: Fact };

export default function FactCard({ fact }: Props) {
  const openMaps = () =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${fact.lat},${fact.lon}`);

  const openWikipedia = () => Linking.openURL(fact.sourceUrl);

  const textContent = (
    <>
      <Text style={styles.title}>{fact.title}</Text>
      {fact.hasGeoData && fact.distance > 0 && (
        <Text style={styles.distance}>{Math.round(fact.distance)} m away</Text>
      )}
      <Text style={styles.extract}>{fact.extract}</Text>
    </>
  );

  return (
    <View style={styles.card}>
      {fact.thumbnail ? (
        <View style={styles.row}>
          <Image source={{ uri: fact.thumbnail }} style={styles.thumbnail} />
          <View style={styles.textContainer}>{textContent}</View>
        </View>
      ) : (
        textContent
      )}
      <View style={[styles.buttonRow, !fact.hasGeoData && styles.buttonRowCentered]}>
        {fact.hasGeoData && (
          <TouchableOpacity onPress={openMaps}>
            <Text style={styles.linkText}>View</Text>
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
