
import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        ALFRED
      </Text>

      <Text style={styles.subtitle}>
        Your Personal AI Assistant
      </Text>

      <Pressable style={styles.micButton}>
        <Text style={styles.micText}>
          START LISTENING
        </Text>
      </Pressable>

      <Text style={styles.status}>
        Alfred is currently inactive
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080D18',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  title: {
    color: '#38BDF8',
    fontSize: 38,
    fontWeight: 'bold',
    letterSpacing: 8,
  },

  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 12,
  },

  micButton: {
    marginTop: 55,
    backgroundColor: '#0E7490',
    paddingVertical: 18,
    paddingHorizontal: 35,
    borderRadius: 30,
  },

  micText: {
    color: 'white',
    fontWeight: 'bold',
  },

  status: {
    color: '#64748B',
    marginTop: 25,
  },
});
