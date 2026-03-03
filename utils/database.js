import * as SQLite from 'expo-sqlite';

// Open database (creates if not exists)
const db = SQLite.openDatabaseSync('petdx.db');

// Initialize tables
export const initDatabase = async () => {
  try {
    // Table for scan history
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imageUri TEXT NOT NULL,
        breed TEXT NOT NULL,
        breedConfidence REAL NOT NULL,
        disease TEXT NOT NULL,
        diseaseConfidence REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table for breed information (offline)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS breeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        temperament TEXT,
        size TEXT,
        lifeExpectancy TEXT,
        careTips TEXT
      );
    `);

    // Table for disease information (offline)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS diseases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        symptoms TEXT,
        treatment TEXT,
        urgency TEXT
      );
    `);

    console.log('Database initialized');
  } catch (error) {
    console.error('Database init error:', error);
  }
};

// Save a scan to history
export const saveScan = async (scanData) => {
  try {
    const { imageUri, breed, breedConfidence, disease, diseaseConfidence } = scanData;
    const result = await db.runAsync(
      'INSERT INTO scans (imageUri, breed, breedConfidence, disease, diseaseConfidence) VALUES (?, ?, ?, ?, ?)',
      imageUri, breed, breedConfidence, disease, diseaseConfidence
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error saving scan:', error);
    throw error;
  }
};

// Get all scans (most recent first)
export const getAllScans = async () => {
  try {
    const scans = await db.getAllAsync(
      'SELECT * FROM scans ORDER BY timestamp DESC'
    );
    return scans;
  } catch (error) {
    console.error('Error fetching scans:', error);
    return [];
  }
};

// Delete a scan by id
export const deleteScan = async (id) => {
  try {
    await db.runAsync('DELETE FROM scans WHERE id = ?', id);
  } catch (error) {
    console.error('Error deleting scan:', error);
  }
};

// Prepopulate breed information (call once when app starts)
export const prepopulateBreeds = async () => {
  // Check if already populated
  const count = await db.getFirstAsync('SELECT COUNT(*) as count FROM breeds');
  if (count.count > 0) return;

  // Sample breed data – replace with your actual 10 breeds
  const breedsData = [
    { name: 'Golden Retriever', description: 'Friendly and intelligent.', temperament: 'Friendly, Intelligent', size: 'Large', lifeExpectancy: '10-12 years', careTips: 'Regular exercise, grooming' },
    { name: 'Siamese Cat', description: 'Sociable and vocal.', temperament: 'Social, Affectionate', size: 'Medium', lifeExpectancy: '12-15 years', careTips: 'Interactive play, dental care' },
    // ... add the rest
  ];

  for (const b of breedsData) {
    await db.runAsync(
      'INSERT INTO breeds (name, description, temperament, size, lifeExpectancy, careTips) VALUES (?, ?, ?, ?, ?, ?)',
      b.name, b.description, b.temperament, b.size, b.lifeExpectancy, b.careTips
    );
  }
  console.log('Breeds prepopulated');
};

// Prepopulate disease information
export const prepopulateDiseases = async () => {
  const count = await db.getFirstAsync('SELECT COUNT(*) as count FROM diseases');
  if (count.count > 0) return;

  const diseasesData = [
    { name: 'Skin Infection', description: 'Bacterial or fungal skin condition.', symptoms: 'Itching, redness, hair loss', treatment: 'Antibiotics, medicated shampoos', urgency: 'Moderate – see vet within a week' },
    { name: 'Ear Mite', description: 'Parasitic infection in ears.', symptoms: 'Head shaking, scratching, dark discharge', treatment: 'Ear drops, cleaning', urgency: 'Moderate – treat promptly' },
    // ... add the rest
  ];

  for (const d of diseasesData) {
    await db.runAsync(
      'INSERT INTO diseases (name, description, symptoms, treatment, urgency) VALUES (?, ?, ?, ?, ?)',
      d.name, d.description, d.symptoms, d.treatment, d.urgency
    );
  }
  console.log('Diseases prepopulated');
};

// Get breed details by name
export const getBreedDetails = async (name) => {
  return await db.getFirstAsync('SELECT * FROM breeds WHERE name = ?', name);
};

// Get disease details by name
export const getDiseaseDetails = async (name) => {
  return await db.getFirstAsync('SELECT * FROM diseases WHERE name = ?', name);
};