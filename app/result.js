import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { saveScan } from '../utils/database';

// Dummy data – replace with actual model inference later
const dummyBreeds = ['Golden Retriever', 'Siamese Cat', 'Labrador', 'Persian Cat', 'Beagle'];
const dummyDiseases = ['Healthy', 'Skin Infection', 'Ear Mite', 'Conjunctivitis', 'Parvovirus'];

export default function ResultScreen() {
  const { imageUri } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Simulate inference delay
    const timer = setTimeout(() => {
      setResult({
        breed: dummyBreeds[Math.floor(Math.random() * dummyBreeds.length)],
        breedConfidence: (Math.random() * 0.5 + 0.5).toFixed(2),
        disease: dummyDiseases[Math.floor(Math.random() * dummyDiseases.length)],
        diseaseConfidence: (Math.random() * 0.5 + 0.5).toFixed(2),
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    try {
      await saveScan({
        imageUri,
        breed: result.breed,
        breedConfidence: parseFloat(result.breedConfidence),
        disease: result.disease,
        diseaseConfidence: parseFloat(result.diseaseConfidence),
      });
      Alert.alert('Success', 'Scan saved to history');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save scan');
    }
  };

  const handleViewDetails = () => {
    // For demo, we'll just show breed details. You could add a picker.
    // In a real app, you might have a button to choose breed or disease details.
    // We'll navigate to breed details by default for now.
    router.push({
      pathname: '/breed-details',
      params: { breedName: result.breed }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="sync" size={50} color="#6B4EFF" />
        <Text style={styles.loadingText}>Analyzing your pet...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} />

      <View style={styles.resultCard}>
        <Text style={styles.sectionTitle}>Breed</Text>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>{result.breed}</Text>
          <Text style={styles.confidence}>{(result.breedConfidence * 100).toFixed(0)}%</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Disease</Text>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>{result.disease}</Text>
          <Text style={styles.confidence}>{(result.diseaseConfidence * 100).toFixed(0)}%</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.detailsButton} onPress={handleViewDetails}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save to History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#6B4EFF',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#fff'
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: '#111',
  },
  confidence: {
    fontSize: 16,
    color: '#6B4EFF',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  detailsButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 10,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B4E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});