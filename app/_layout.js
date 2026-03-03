import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initDatabase, prepopulateBreeds, prepopulateDiseases } from '../utils/database';

export default function Layout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await initDatabase();
      await prepopulateBreeds();
      await prepopulateDiseases();
      setIsDbReady(true);
    };
    setup();
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="result" options={{ presentation: 'modal', title: 'Scan Result' }} />
      <Stack.Screen name="breed-details" options={{ title: 'Breed Details' }} />
      <Stack.Screen name="disease-details" options={{ title: 'Disease Details' }} />
    </Stack>
  );
}