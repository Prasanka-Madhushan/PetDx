import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { getAllScans, initDatabase } from '../../utils/database';

// ─── Constants ────────────────────────────────────────────────────────────────
const { width, height } = Dimensions.get('window');
const CARD_WIDTH         = width * 0.7;
const STATUS_BAR_HEIGHT  = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ?? 24;

// The tall hero banner that parallaxes behind the fixed header
const HERO_HEIGHT        = 260;
// Height of the fully-expanded fixed header
const HEADER_EXPANDED_H  = 120 + STATUS_BAR_HEIGHT;
// Height of the collapsed (compact) fixed header
const HEADER_COLLAPSED_H = 60  + STATUS_BAR_HEIGHT;
// Scroll distance that drives the collapse
const COLLAPSE_SCROLL    = HERO_HEIGHT - HEADER_COLLAPSED_H;

// ─── Data ─────────────────────────────────────────────────────────────────────
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
  "Microchipping increases the chance of reuniting with a lost pet.",
];

const featuredPets = [
  { id: 1, name: 'Luna',  breed: 'Siamese',          image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400' },
  { id: 2, name: 'Max',   breed: 'Golden Retriever',  image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400' },
  { id: 3, name: 'Bella', breed: 'Persian',           image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400' },
  { id: 4, name: 'Anton', breed: 'Siamese',           image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400' },
  { id: 5, name: 'Red',   breed: 'Golden Retriever',  image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400' },
  { id: 6, name: 'John',  breed: 'Persian',           image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400' },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user }  = useAuth();
  const router    = useRouter();

  const [recentScans, setRecentScans] = useState([]);
  const [refreshing,  setRefreshing]  = useState(false);
  const [stats,       setStats]       = useState({ totalScans: 0, uniqueBreeds: 0, commonDisease: 'N/A' });
  const [dailyTip,    setDailyTip]    = useState('');

  // ── Stat counter animations ──────────────────────────────────────────────
  const animatedTotalScans   = useRef(new Animated.Value(0)).current;
  const animatedUniqueBreeds = useRef(new Animated.Value(0)).current;
  const [displayTotal,  setDisplayTotal]  = useState(0);
  const [displayUnique, setDisplayUnique] = useState(0);

  // ── Single scroll-driven Animated.Value ─────────────────────────────────
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── All interpolations are pure – zero JS-thread listeners needed ────────

  // Hero image moves up at 0.45× scroll speed  →  parallax
  const heroTranslateY = scrollY.interpolate({
    inputRange:  [0, HERO_HEIGHT],
    outputRange: [0, -HERO_HEIGHT * 0.45],
    extrapolate: 'clamp',
  });

  // Glow orbs drift at different rates for a depth-of-field feel
  const orb1TranslateY = scrollY.interpolate({
    inputRange:  [0, height],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });
  const orb2TranslateY = scrollY.interpolate({
    inputRange:  [0, height],
    outputRange: [0, -35],
    extrapolate: 'clamp',
  });
  const orb3TranslateY = scrollY.interpolate({
    inputRange:  [0, height],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  // Header height shrinks from EXPANDED → COLLAPSED as user scrolls
  const headerHeight = scrollY.interpolate({
    inputRange:  [0, COLLAPSE_SCROLL],
    outputRange: [HEADER_EXPANDED_H, HEADER_COLLAPSED_H],
    extrapolate: 'clamp',
  });

  // Overlay fades in, giving the impression of a deeper blur
  const headerOverlayOpacity = scrollY.interpolate({
    inputRange:  [0, COLLAPSE_SCROLL],
    outputRange: [0, 0.65],
    extrapolate: 'clamp',
  });

  // Subtitle fades out and slides up early in the scroll
  const subtitleOpacity = scrollY.interpolate({
    inputRange:  [0, COLLAPSE_SCROLL * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const subtitleTranslateY = scrollY.interpolate({
    inputRange:  [0, COLLAPSE_SCROLL * 0.5],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  // Username font-size shrinks from 26 → 18
  const userNameFontSize = scrollY.interpolate({
    inputRange:  [0, COLLAPSE_SCROLL],
    outputRange: [26, 18],
    extrapolate: 'clamp',
  });

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        await loadRecentScans();
        refreshTip();
      } catch (e) { console.error('Init error:', e); }
    };
    init();
  }, []);

  useEffect(() => {
    const t1 = animatedTotalScans.addListener(({ value }) => setDisplayTotal(Math.floor(value)));
    const t2 = animatedUniqueBreeds.addListener(({ value }) => setDisplayUnique(Math.floor(value)));
    return () => {
      animatedTotalScans.removeListener(t1);
      animatedUniqueBreeds.removeListener(t2);
    };
  }, []);

  // ── Data helpers ──────────────────────────────────────────────────────────
  const loadRecentScans = async () => {
    try {
      const scans        = await getAllScans();
      const total        = scans.length;
      const uniqueBreeds = new Set(scans.map(s => s.breed)).size;
      const common       = getMostCommonDisease(scans);
      setRecentScans(scans.slice(0, 10));
      setStats({ totalScans: total, uniqueBreeds, commonDisease: common });
      animateStats(total, uniqueBreeds);
    } catch (e) { console.error('Load error:', e); }
  };

  const animateStats = (total, unique) => {
    Animated.parallel([
      Animated.timing(animatedTotalScans,   { toValue: total,  duration: 1500, useNativeDriver: false }),
      Animated.timing(animatedUniqueBreeds, { toValue: unique, duration: 1500, useNativeDriver: false }),
    ]).start();
  };

  const getMostCommonDisease = (scans) => {
    if (!scans.length) return 'N/A';
    const counts     = scans.reduce((acc, s) => { acc[s.disease] = (acc[s.disease] || 0) + 1; return acc; }, {});
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return mostCommon ? mostCommon[0] : 'N/A';
  };

  const refreshTip = () => setDailyTip(dailyTips[Math.floor(Math.random() * dailyTips.length)]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentScans();
    refreshTip();
    setRefreshing(false);
  };

  // ── Card definitions ──────────────────────────────────────────────────────
  const statCards = [
    { value: displayTotal.toString(),  label: 'Total Scans',  colors: ['#FF6B4E', '#FF9F7B'] },
    { value: displayUnique.toString(), label: 'Breeds Found', colors: ['#3DBE6E', '#7DDFA0'] },
    {
      value: stats.commonDisease.length > 10 ? stats.commonDisease.substring(0, 8) + '..' : stats.commonDisease,
      label: 'Common Issue',
      colors: ['#FFB800', '#FFD966'],
    },
  ];

  const quickActions = [
    { label: 'New Scan', icon: 'camera',       colors: ['#7B5FFF', '#A98BFF'], onPress: () => router.push('/(tabs)/scan')    },
    { label: 'Find Vet', icon: 'map',           colors: ['#FF6B4E', '#FF9F7B'], onPress: () => router.push('/(tabs)/vet')     },
    { label: 'Pet Info', icon: 'information',   colors: ['#3DBE6E', '#7DDFA0'], onPress: () => router.push('/(tabs)/info')    },
    { label: 'History',  icon: 'time',          colors: ['#FFB800', '#FFD966'], onPress: () => router.push('/(tabs)/history') },
  ];

  // ── Renderers ─────────────────────────────────────────────────────────────
  const renderScanItem = ({ item }) => (
    <TouchableOpacity
      style={styles.scanCard}
      onPress={() => router.push({ pathname: '/result', params: { imageUri: item.imageUri, fromHistory: true, scanId: item.id } })}
    >
      <Image source={{ uri: item.imageUri }} style={styles.scanCardImage} />
      <BlurView intensity={40} tint="dark" style={styles.scanCardGlassOverlay}>
        <Text style={styles.scanCardBreed}   numberOfLines={1}>{item.breed}</Text>
        <Text style={styles.scanCardDisease} numberOfLines={1}>{item.disease}</Text>
        <Text style={styles.scanCardDate}>{new Date(item.timestamp).toLocaleDateString()}</Text>
      </BlurView>
    </TouchableOpacity>
  );

  const renderFeaturedItem = ({ item }) => (
    <View style={styles.featuredCard}>
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <BlurView intensity={50} tint="dark" style={styles.featuredGlassOverlay}>
        <Text style={styles.featuredName}>{item.name}</Text>
        <Text style={styles.featuredBreed}>{item.breed}</Text>
      </BlurView>
    </View>
  );

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ══ FULL-SCREEN GRADIENT BACKGROUND ══════════════════════════════════ */}
      <LinearGradient
        colors={['#0D0B2A', '#1A1040', '#0D1F3C']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ══ PARALLAX GLOW ORBS ═══════════════════════════════════════════════ */}
      <Animated.View style={[styles.glowOrb, styles.glowOrb1, { transform: [{ translateY: orb1TranslateY }] }]} />
      <Animated.View style={[styles.glowOrb, styles.glowOrb2, { transform: [{ translateY: orb2TranslateY }] }]} />
      <Animated.View style={[styles.glowOrb, styles.glowOrb3, { transform: [{ translateY: orb3TranslateY }] }]} />

      {/* ══ SCROLLABLE CONTENT ═══════════════════════════════════════════════ */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }    
        )}
        scrollEventThrottle={16}        
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A98BFF"
            progressViewOffset={HEADER_EXPANDED_H}
          />
        }
      >
        {/* ── PARALLAX HERO BANNER ─────────────────────────────────────────
            Sits at scroll position 0. The fixed header floats above it.
            The image is taller than HERO_HEIGHT so parallax never shows a gap. */}
        <View style={styles.heroContainer}>
          <Animated.Image
            source={{ uri: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800' }}
            style={[styles.heroImage, { transform: [{ translateY: heroTranslateY }] }]}
            resizeMode="cover"
          />
          {/* Gradient overlay so the transition to page background is seamless */}
          <LinearGradient
            colors={['rgba(13,11,42,0)', 'rgba(13,11,42,0.45)', '#0D0B2A']}
            style={styles.heroGradient}
          />
        </View>

        {/* ══ STATS (overlap the hero bottom) ══════════════════════════════ */}
        <View style={styles.statsContainer}>
          {statCards.map((card, i) => (
            <View key={i} style={styles.statCardWrapper}>
              <LinearGradient colors={card.colors} style={styles.statGlow} />
              <BlurView intensity={55} tint="dark" style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.statNumber} numberOfLines={1}>{card.value}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
              </BlurView>
            </View>
          ))}
        </View>

        {/* ══ QUICK ACTIONS ════════════════════════════════════════════════ */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, i) => (
            <TouchableOpacity key={i} style={styles.quickAction} onPress={action.onPress}>
              <View style={styles.quickActionIconWrapper}>
                <LinearGradient colors={action.colors} style={styles.quickActionGradient}>
                  <Ionicons name={action.icon} size={22} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ══ RECENT SCANS ═════════════════════════════════════════════════ */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            {recentScans.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={styles.viewAll}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentScans.length === 0 ? (
            <BlurView intensity={40} tint="dark" style={styles.emptyContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No scans yet</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/scan')}>
                <LinearGradient colors={['#7B5FFF', '#A98BFF']} style={styles.emptyButtonGradient}>
                  <Text style={styles.emptyButtonText}>Start Scanning</Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          ) : (
            <FlatList
              data={recentScans}
              renderItem={renderScanItem}
              keyExtractor={item => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              snapToInterval={CARD_WIDTH + 15}
              decelerationRate="fast"
            />
          )}
        </View>

        {/* ══ DAILY TIP ════════════════════════════════════════════════════ */}
        <BlurView intensity={40} tint="dark" style={styles.tipContainer}>
          <LinearGradient
            colors={['rgba(255,184,0,0.18)', 'rgba(255,184,0,0.06)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.tipBorder} />
          <Ionicons name="bulb-outline" size={28} color="#FFB800" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Pet Care Tip</Text>
            <Text style={styles.tipText}>{dailyTip}</Text>
          </View>
          <TouchableOpacity onPress={refreshTip} style={styles.tipRefresh}>
            <Ionicons name="refresh" size={20} color="#FFB800" />
          </TouchableOpacity>
        </BlurView>

        {/* ══ FEATURED PETS ════════════════════════════════════════════════ */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Pets</Text>
          </View>
          <FlatList
            data={featuredPets}
            renderItem={renderFeaturedItem}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredCarousel}
          />
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* ══ FIXED GLASS HEADER ═══════════════════════════════════════════════
          Lives OUTSIDE the ScrollView so it never scrolls away.
          Its height, blur intensity overlay, and text all animate via scrollY. */}
      <Animated.View style={[styles.fixedHeader, { height: headerHeight }]} pointerEvents="box-none">

        {/* Layer 1 – always-on BlurView base */}
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Layer 2 – solid dark overlay that deepens as user scrolls */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(13,11,42,1)', opacity: headerOverlayOpacity }]}
          pointerEvents="none"
        />

        {/* Layer 3 – purple gradient tint */}
        <LinearGradient
          colors={['rgba(123,95,255,0.40)', 'rgba(123,95,255,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Glass bottom border */}
        <View style={styles.headerBottomBorder} pointerEvents="none" />

        {/* ── Actual header content ── */}
        <View style={[styles.headerInner, { paddingTop: STATUS_BAR_HEIGHT }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Animated.Text
            style={[
              styles.greeting,
              { opacity: subtitleOpacity, transform: [{ translateY: subtitleTranslateY }] },
            ]}
            pointerEvents="none"
          >
            Hello
          </Animated.Text>
              {/* Font shrinks from 26 → 18 as header collapses */}
              <Animated.Text style={[styles.userName, { fontSize: userNameFontSize }]}>
                {user?.email?.split('@')[0] || 'Pet Lover'}
              </Animated.Text>
            </View>

            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <BlurView intensity={60} tint="light" style={styles.avatar}>
                <Ionicons name="person" size={24} color="#7B5FFF" />
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Subtitle fades out and slides up as user scrolls */}
          <Animated.Text
            style={[
              styles.headerSubtitle,
              { opacity: subtitleOpacity, transform: [{ translateY: subtitleTranslateY }] },
            ]}
            pointerEvents="none"
          >
            Ready to care for your furry friend? 🐾
          </Animated.Text>
        </View>
      </Animated.View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Root ─────────────────────────────────────────────────────────────────
  rootContainer: {
    flex: 1,
    backgroundColor: '#0D0B2A',
  },
  scrollView: {
    flex: 1,
  },

  // ── Glow orbs ─────────────────────────────────────────────────────────────
  glowOrb: {
    position:     'absolute',
    borderRadius: 999,
    opacity:      0.35,
  },
  glowOrb1: {
    width:  300, height: 300,
    backgroundColor: '#7B5FFF',
    top: -90, left: -90,
    shadowColor: '#7B5FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 100,
  },
  glowOrb2: {
    width:  240, height: 240,
    backgroundColor: '#FF6B4E',
    top: 320, right: -75,
    shadowColor: '#FF6B4E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 85,
  },
  glowOrb3: {
    width:  200, height: 200,
    backgroundColor: '#00C2FF',
    bottom: 220, left: -50,
    shadowColor: '#00C2FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 75,
  },

  // ── Parallax hero ─────────────────────────────────────────────────────────
  heroContainer: {
    height:   HERO_HEIGHT,
    overflow: 'hidden',
  },
  heroImage: {
    width:    '100%',
    // Taller than container so translateY never reveals an empty gap
    height:   HERO_HEIGHT + HERO_HEIGHT * 0.45,
    position: 'absolute',
    top:      0,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsContainer: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    marginTop:        -28,   // overlap bottom of hero banner
    marginHorizontal: 18,
    marginBottom:     26,
    zIndex:           1,
  },
  statCardWrapper: {
    flex:             1,
    marginHorizontal: 4,
    borderRadius:     18,
    overflow:         'visible',
  },
  statGlow: {
    position: 'absolute',
    top: 6, left: 6, right: 6, bottom: -4,
    borderRadius: 18,
    opacity:      0.55,
  },
  statCard: {
    borderRadius:      18,
    paddingVertical:   16,
    paddingHorizontal: 8,
    alignItems:        'center',
    overflow:          'hidden',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.18)',
  },
  statNumber: {
    fontSize:     22,
    fontWeight:   '800',
    color:        '#FFFFFF',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize:     11,
    color:        'rgba(255,255,255,0.70)',
    marginTop:    4,
    textAlign:    'center',
    letterSpacing: 0.3,
  },

  // ── Quick actions ──────────────────────────────────────────────────────────
  quickActionsContainer: {
    flexDirection:    'row',
    justifyContent:   'space-around',
    paddingHorizontal: 12,
    marginBottom:     26,
  },
  quickAction: {
    alignItems: 'center',
    flex:       1,
  },
  quickActionIconWrapper: {
    borderRadius:  28,
    overflow:      'hidden',
    marginBottom:  7,
    shadowColor:   '#7B5FFF',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius:  8,
    elevation:     6,
    borderWidth:   1,
    borderColor:   'rgba(255,255,255,0.20)',
  },
  quickActionGradient: {
    width: 52, height: 52,
    justifyContent: 'center',
    alignItems:     'center',
  },
  quickActionText: {
    fontSize:     11,
    color:        'rgba(255,255,255,0.75)',
    textAlign:    'center',
    letterSpacing: 0.2,
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  sectionContainer: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal: 20,
    marginBottom:     12,
  },
  sectionTitle: {
    fontSize:     18,
    fontWeight:   '700',
    color:        '#FFFFFF',
    letterSpacing: 0.3,
  },
  viewAll: {
    fontSize:   13,
    color:      '#A98BFF',
    fontWeight: '600',
  },

  // ── Scan cards ────────────────────────────────────────────────────────────
  carouselContent: { paddingHorizontal: 20 },
  scanCard: {
    width:         CARD_WIDTH,
    height:        155,
    borderRadius:  18,
    marginRight:   15,
    overflow:      'hidden',
    borderWidth:   1,
    borderColor:   'rgba(255,255,255,0.15)',
    shadowColor:   '#7B5FFF',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius:  12,
    elevation:     8,
  },
  scanCardImage: {
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  scanCardGlassOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingVertical:   12,
    paddingHorizontal: 13,
    overflow:          'hidden',
    borderTopWidth:    1,
    borderTopColor:    'rgba(255,255,255,0.15)',
  },
  scanCardBreed:   { color: '#fff',                    fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  scanCardDisease: { color: 'rgba(255,255,255,0.85)',   fontSize: 13, marginTop: 1 },
  scanCardDate:    { color: 'rgba(255,255,255,0.55)',   fontSize: 11, marginTop: 4 },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems:       'center',
    paddingVertical:  32,
    marginHorizontal: 20,
    borderRadius:     20,
    overflow:         'hidden',
    borderWidth:      1,
    borderColor:      'rgba(255,255,255,0.12)',
  },
  emptyText: { fontSize: 16, color: 'rgba(255,255,255,0.55)', marginTop: 10, marginBottom: 14 },
  emptyButton: {
    borderRadius:  22,
    overflow:      'hidden',
    borderWidth:   1,
    borderColor:   'rgba(255,255,255,0.25)',
    shadowColor:   '#7B5FFF',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius:  8,
    elevation:     6,
  },
  emptyButtonGradient: { paddingHorizontal: 24, paddingVertical: 11 },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },

  // ── Daily tip ─────────────────────────────────────────────────────────────
  tipContainer: {
    flexDirection:    'row',
    alignItems:       'center',
    marginHorizontal: 20,
    marginBottom:     26,
    padding:          16,
    borderRadius:     20,
    overflow:         'hidden',
    borderWidth:      1,
    borderColor:      'rgba(255,184,0,0.30)',
  },
  tipBorder: {
    position:        'absolute',
    top: 0, left: 0, right: 0,
    height:          1,
    backgroundColor: 'rgba(255,184,0,0.4)',
  },
  tipContent: { flex: 1, marginLeft: 13 },
  tipTitle:   { fontSize: 15, fontWeight: '700', color: '#FFD966', letterSpacing: 0.3 },
  tipText:    { fontSize: 13, color: 'rgba(255,230,130,0.85)', marginTop: 4, lineHeight: 19 },
  tipRefresh: { padding: 5, marginLeft: 4 },

  // ── Featured pets ─────────────────────────────────────────────────────────
  featuredCarousel: { paddingHorizontal: 20 },
  featuredCard: {
    width:         120,
    height:        155,
    borderRadius:  18,
    marginRight:   13,
    overflow:      'hidden',
    borderWidth:   1,
    borderColor:   'rgba(255,255,255,0.15)',
    shadowColor:   '#A98BFF',
    shadowOffset:  { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius:  10,
    elevation:     6,
  },
  featuredImage:        { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredGlassOverlay: {
    position:          'absolute',
    bottom: 0, left: 0, right: 0,
    paddingVertical:   9,
    paddingHorizontal: 8,
    alignItems:        'center',
    overflow:          'hidden',
    borderTopWidth:    1,
    borderTopColor:    'rgba(255,255,255,0.15)',
  },
  featuredName:  { color: '#fff',                  fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  featuredBreed: { color: 'rgba(255,255,255,0.80)', fontSize: 11, marginTop: 2 },

  // ══ FIXED GLASS HEADER ════════════════════════════════════════════════════
  fixedHeader: {
    position:  'absolute',
    top:       0,
    left:      0,
    right:     0,
    zIndex:    100,
    overflow:  'hidden',
  },
  headerBottomBorder: {
    position:        'absolute',
    bottom: 0, left: 0, right: 0,
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerInner: {
    flex:              1,
    paddingHorizontal: 22,
    paddingBottom:     14,
    justifyContent:    'flex-end',
  },
  headerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  headerTextGroup: { flex: 1 },
  greeting: {
    fontSize:     13,
    color:        'rgba(255,255,255,0.60)',
    letterSpacing: 0.5,
  },
  userName: {
    // fontSize animated externally via Animated.Text
    fontWeight:    '700',
    color:         '#FFFFFF',
    marginTop:     2,
    letterSpacing: 0.3,
  },
  avatarWrapper: {
    top:            20,
    borderRadius:  28,
    overflow:      'hidden',
    borderWidth:   1.5,
    borderColor:   'rgba(255,255,255,0.25)',
    shadowColor:   '#7B5FFF',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius:  10,
    elevation:     8,
  },
  avatar: {
    width: 52, height: 52,
    justifyContent: 'center',
    alignItems:     'center',
  },
  headerSubtitle: {
    fontSize:     13,
    color:        'rgba(255,255,255,0.55)',
    marginTop:    5,
    letterSpacing: 0.2,
  },
});