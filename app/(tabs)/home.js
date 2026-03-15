import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  FlatList,
  Alert,
  RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllScans, initDatabase  } from '../../utils/database';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

// Daily tips array (can be expanded)
const dailyTips = [
  "Regular vet check-ups can help detect health issues early.",
  "Brush your pet's teeth daily to prevent dental disease.",
  "Cats need vertical space like cat trees to feel secure.",
  "Dogs thrive on routine – try to feed and walk at the same times daily.",
  "Keep your pet hydrated – fresh water should always be available.",
  "Pets can get sunburned too! Use pet-safe sunscreen on light-colored areas.",
  "Exercise helps reduce anxiety and destructive behavior in dogs.",
  "Cats love puzzle feeders – they stimulate natural hunting instincts.",
  "Never give chocolate, grapes, or onions to your pet – they're toxic.",
  "Microchipping increases the chance of reuniting with a lost pet."
];

// Mock featured pets
const featuredPets = [
  { id: 1, name: 'Luna', breed: 'Siamese', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400' },
  { id: 2, name: 'Max', breed: 'Golden Retriever', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400' },
  { id: 3, name: 'Bella', breed: 'Persian', image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400' },
  { id: 4, name: 'Anton', breed: 'Siamese', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400' },
  { id: 5, name: 'Red', breed: 'Golden Retriever', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400' },
  { id: 6, name: 'John', breed: 'Persian', image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [recentScans, setRecentScans] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalScans: 0,
    uniqueBreeds: 0,
    commonDisease: 'N/A'
  });
  const [dailyTip, setDailyTip] = useState('');
  
  // Animation values for stats
  const animatedTotalScans = useRef(new Animated.Value(0)).current;
  const animatedUniqueBreeds = useRef(new Animated.Value(0)).current;
  const [displayTotal, setDisplayTotal] = useState(0);
  const [displayUnique, setDisplayUnique] = useState(0);

  useEffect(() => {
  const initializeHome = async () => {
    try {
      await initDatabase();
      await loadRecentScans();
      refreshTip();
    } catch (error) {
      console.error('Error initializing home:', error);
    }
  };

  initializeHome();
}, []);

  // Load recent scans and stats
  const loadRecentScans = async () => {
    try {
      const scans = await getAllScans();
      setRecentScans(scans.slice(0, 10)); 
      
      const total = scans.length;
      const uniqueBreeds = new Set(scans.map(s => s.breed)).size;
      const common = getMostCommonDisease(scans);
      
      setStats({ totalScans: total, uniqueBreeds, commonDisease: common });
      
      // Animate stats
      animateStats(total, uniqueBreeds);
    } catch (error) {
      console.error('Error loading scans:', error);
    }
  };

  const animateStats = (total, unique) => {
    Animated.parallel([
      Animated.timing(animatedTotalScans, {
        toValue: total,
        duration: 1500,
        useNativeDriver: false,
      }),
      Animated.timing(animatedUniqueBreeds, {
        toValue: unique,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Update displayed numbers as animation progresses
  useEffect(() => {
    const listenerTotal = animatedTotalScans.addListener(({ value }) => {
      setDisplayTotal(Math.floor(value));
    });
    const listenerUnique = animatedUniqueBreeds.addListener(({ value }) => {
      setDisplayUnique(Math.floor(value));
    });
    
    return () => {
      animatedTotalScans.removeListener(listenerTotal);
      animatedUniqueBreeds.removeListener(listenerUnique);
    };
  }, []);

  const getMostCommonDisease = (scans) => {
    if (scans.length === 0) return 'N/A';
    const diseaseCounts = scans.reduce((acc, scan) => {
      acc[scan.disease] = (acc[scan.disease] || 0) + 1;
      return acc;
    }, {});
    const mostCommon = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? mostCommon[0] : 'N/A';
  };

  // Pick random daily tip
  const refreshTip = () => {
    const randomIndex = Math.floor(Math.random() * dailyTips.length);
    setDailyTip(dailyTips[randomIndex]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentScans();
    refreshTip();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRecentScans();
    refreshTip();
  }, []);

  const handleScanPress = () => {
    router.push('/(tabs)/scan');
  };

  const handleViewAllHistory = () => {
    router.push('/(tabs)/history');
  };

  const handleVetPress = () => {
    router.push('/(tabs)/vet');
  };

  const handleInfoPress = () => {
    router.push('/(tabs)/info');
  };

  const renderScanItem = ({ item }) => (
    <TouchableOpacity
      style={styles.scanCard}
      onPress={() => router.push({
        pathname: '/result',
        params: { imageUri: item.imageUri, fromHistory: true, scanId: item.id }
      })}
    >
      <Image source={{ uri: item.imageUri }} style={styles.scanCardImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.scanCardGradient}
      >
        <Text style={styles.scanCardBreed} numberOfLines={1}>{item.breed}</Text>
        <Text style={styles.scanCardDisease} numberOfLines={1}>{item.disease}</Text>
        <Text style={styles.scanCardDate}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderFeaturedItem = ({ item }) => (
    <View style={styles.featuredCard}>
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <LinearGradient
        colors={['transparent', 'rgba(107,78,255,0.9)']}
        style={styles.featuredGradient}
      >
        <Text style={styles.featuredName}>{item.name}</Text>
        <Text style={styles.featuredBreed}>{item.breed}</Text>
      </LinearGradient>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6B4EFF" />
      }
    >
      {/* Header with Greeting and Avatar */}
      <LinearGradient
        colors={['#6B4EFF', '#8B6EFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'Pet Lover'}
            </Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person" size={30} color="#6B4EFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Ready to care for your furry friend?</Text>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={['#FF6B4E', '#FF8B6E']}
          style={styles.statCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statNumber}>{displayTotal}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </LinearGradient>

        <LinearGradient
          colors={['#4CAF50', '#6ECF6E']}
          style={styles.statCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statNumber}>{displayUnique}</Text>
          <Text style={styles.statLabel}>Breeds Found</Text>
        </LinearGradient>

        <LinearGradient
          colors={['#FFB800', '#FFD600']}
          style={styles.statCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statNumber} numberOfLines={1}>
            {stats.commonDisease.length > 10
              ? stats.commonDisease.substring(0, 8) + '..'
              : stats.commonDisease}
          </Text>
          <Text style={styles.statLabel}>Common Issue</Text>
        </LinearGradient>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.quickAction} onPress={handleScanPress}>
          <LinearGradient
            colors={['#6B4EFF', '#8B6EFF']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="camera" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionText}>New Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleVetPress}>
          <LinearGradient
            colors={['#FF6B4E', '#FF8B6E']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="map" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionText}>Find Vet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleInfoPress}>
          <LinearGradient
            colors={['#4CAF50', '#6ECF6E']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="information" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionText}>Pet Info</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleViewAllHistory}>
          <LinearGradient
            colors={['#FFB800', '#FFD600']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="time" size={24} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Scans Carousel */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          {recentScans.length > 0 && (
            <TouchableOpacity onPress={handleViewAllHistory}>
              <Text style={styles.viewAll}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentScans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No scans yet</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleScanPress}>
              <Text style={styles.emptyButtonText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={recentScans}
            renderItem={renderScanItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={CARD_WIDTH + 15}
            decelerationRate="fast"
          />
        )}
      </View>

      {/* Daily Pet Tip */}
      <LinearGradient
        colors={['#FFF9E6', '#FFEFD2']}
        style={styles.tipContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="bulb-outline" size={30} color="#FFB800" />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Pet Care Tip</Text>
          <Text style={styles.tipText}>{dailyTip}</Text>
        </View>
        <TouchableOpacity onPress={refreshTip} style={styles.tipRefresh}>
          <Ionicons name="refresh" size={20} color="#FFB800" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Featured Pets Section (Optional) */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Featured Pets</Text>
        <FlatList
          data={featuredPets}
          renderItem={renderFeaturedItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredCarousel}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -25,
    marginHorizontal: 20,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 25,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAll: {
    fontSize: 14,
    color: '#6B4EFF',
    fontWeight: '500',
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  scanCard: {
    width: CARD_WIDTH,
    height: 150,
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scanCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 30,
  },
  scanCardBreed: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanCardDisease: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  scanCardDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 25,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B87C00',
  },
  tipText: {
    fontSize: 14,
    color: '#8F6B00',
    marginTop: 4,
  },
  tipRefresh: {
    padding: 5,
  },
  featuredCarousel: {
    paddingHorizontal: 20,
  },
  featuredCard: {
    width: 120,
    height: 150,
    borderRadius: 15,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    alignItems: 'center',
  },
  featuredName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featuredBreed: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    marginTop: 2,
  },
});