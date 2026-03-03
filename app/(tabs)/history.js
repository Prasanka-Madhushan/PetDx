import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getAllScans, deleteScan } from '../../utils/database';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const [scans, setScans] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadScans();
    }, [])
  );

  const loadScans = async () => {
    const data = await getAllScans();
    setScans(data);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to delete this scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteScan(id);
            loadScans();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.breed}>{item.breed}</Text>
        <Text style={styles.disease}>{item.disease}</Text>
        <Text style={styles.date}>{new Date(item.timestamp).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={24} color="#FF6B4E" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {scans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No scans yet</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#888', marginTop: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  breed: { fontSize: 16, fontWeight: '600', color: '#333' },
  disease: { fontSize: 14, color: '#666', marginTop: 2 },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
});