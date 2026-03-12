import React, { useEffect, useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiKey, setApiKey } from '../../services/keystore';

type Props = { onNext: () => void; onBack: () => void };

export default function ApiKeyScreen({ onNext, onBack }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (__DEV__) {
      const envKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
      if (envKey) {
        getApiKey().then((existing) => {
          if (!existing) {
            setApiKey(envKey).then(() => onNext());
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!input.trim().startsWith('sk-ant-')) {
      setError('Key should start with sk-ant-');
      return;
    }
    await setApiKey(input.trim());
    onNext();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Fact Synthesis</Text>
        <Text style={styles.subtitle}>Optional</Text>
        <Text style={styles.body}>
          Paste your Anthropic API key to generate punchy, curated facts.
          Without it, raw Wikipedia summaries are shown instead.
          Your key is stored only on this device.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')}>
          <Text style={styles.link}>Get a key at console.anthropic.com →</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="sk-ant-..."
          placeholderTextColor="rgba(255,255,240,0.3)"
          value={input}
          onChangeText={(t) => { setInput(t); setError(''); }}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save & Continue</Text>
        </TouchableOpacity>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.navText}>◀ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext}>
            <Text style={styles.navText}>Skip for now</Text>
          </TouchableOpacity>
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
    paddingTop: 100,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  content: {
    gap: 16,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Helvetica',
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFF0',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Helvetica',
    fontSize: 15,
    color: 'rgba(255,255,240,0.55)',
    textAlign: 'center',
    marginTop: -8,
  },
  body: {
    fontFamily: 'Helvetica',
    fontSize: 15,
    color: 'rgba(255,255,240,0.75)',
    lineHeight: 22,
    textAlign: 'center',
  },
  link: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: '#2A9D8F',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#162E20',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E5038',
    color: '#FFFFF0',
    fontFamily: 'Helvetica',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
    width: '100%',
  },
  error: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#ff7777',
  },
  actions: {
    gap: 14,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1A3828',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  saveText: {
    fontFamily: 'Helvetica',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFF0',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  navText: {
    fontFamily: 'Helvetica',
    fontSize: 14,
    color: 'rgba(255,255,240,0.45)',
  },
});
