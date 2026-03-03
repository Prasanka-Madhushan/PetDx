import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import { useRouter } from 'expo-router';

const db = SQLite.openDatabaseSync('petdx.db');

export default function InfoScreen() {
  const [sections, setSections] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const breeds = await db.getAllAsync('SELECT name FROM breeds ORDER BY name');
    const diseases = await db.getAllAsync('SELECT name FROM diseases ORDER BY name');

    setSections([
      { title: 'Breeds', data: breeds.map(b => ({ name: b.name, type: 'breed' })) },
      { title: 'Diseases', data: diseases.map(d => ({ name: d.name, type: 'disease' })) },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        router.push({
          pathname: item.type === 'breed' ? '/breed-details' : '/disease-details',
          params: item.type === 'breed' ? { breedName: item.name } : { diseaseName: item.name },
        });
      }}
    >
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => item.name + index}
      renderItem={renderItem}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
      )}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F5F7FA' },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#6B4EFF', marginTop: 20, marginBottom: 10 },
  item: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 8 },
  itemText: { fontSize: 16, color: '#333' },
});