import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useState } from 'react';

export default function VetScreen() {
  const [location, setLocation] = useState(null);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Allow location to find nearby vets.');
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
    Alert.alert('Location obtained', `Lat: ${loc.coords.latitude}, Lon: ${loc.coords.longitude}\n\nMap integration coming soon with Google Maps API key.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Vet Near You</Text>
      <Button title="Get My Location" onPress={getLocation} color="#6B4EFF" />
      {location && (
        <Text style={styles.coords}>
          Your location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      )}
      <Text style={styles.note}>
        Note: To enable map, add your Google Maps API key in app.json under "ios.config.googleMapsApiKey" and "android.config.googleMaps.apiKey".
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FA' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#6B4EFF', marginBottom: 20, textAlign: 'center' },
  coords: { marginTop: 20, fontSize: 16, color: '#333' },
  note: { marginTop: 30, fontSize: 14, color: '#888', fontStyle: 'italic' },
});