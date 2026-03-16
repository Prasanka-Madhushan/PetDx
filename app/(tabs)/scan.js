import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT  = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 50;
const PREVIEW_SIZE       = width * 0.78;

// Corner accent dimensions
const CORNER_SIZE   = 22;
const CORNER_WEIGHT = 2.5;
const CORNER_RADIUS = 7;

// ─────────────────────────────────────────────────────────────────────────────
export default function ScanScreen() {
  const [image, setImage] = useState(null);
  const router            = useRouter();

  // ── Mount reveal animations ───────────────────────────────────────────
  const mountAnim    = useRef(new Animated.Value(0)).current;
  const titleSlide   = useRef(new Animated.Value(28)).current;
  const previewScale = useRef(new Animated.Value(0.86)).current;
  const btnSlide     = useRef(new Animated.Value(36)).current;

  // ── Parallax: orbs breathe on an infinite slow loop ──────────────────
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3X = useRef(new Animated.Value(0)).current;

  // ── Scan-line that sweeps the empty preview frame ─────────────────────
  const scanLineY = useRef(new Animated.Value(0)).current;

  // ── Analyse button idle pulse ─────────────────────────────────────────
  const analysePulse = useRef(new Animated.Value(1)).current;

  // ── Mount effect ──────────────────────────────────────────────────────
  useEffect(() => {
    // Page entry reveal
    Animated.parallel([
      Animated.timing(mountAnim,    { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(titleSlide,   { toValue: 0, friction: 7, tension: 80,  useNativeDriver: true }),
      Animated.spring(previewScale, { toValue: 1, friction: 6, tension: 70,  useNativeDriver: true }),
      Animated.timing(btnSlide,     { toValue: 0, duration: 580, useNativeDriver: true }),
    ]).start();

    // Orb parallax drift loops
    const driftOrb1 = Animated.loop(Animated.sequence([
      Animated.timing(orb1Y, { toValue: -20, duration: 3800, useNativeDriver: true }),
      Animated.timing(orb1Y, { toValue:   0, duration: 3800, useNativeDriver: true }),
    ]));
    const driftOrb2 = Animated.loop(Animated.sequence([
      Animated.timing(orb2Y, { toValue:  16, duration: 4400, useNativeDriver: true }),
      Animated.timing(orb2Y, { toValue:   0, duration: 4400, useNativeDriver: true }),
    ]));
    const driftOrb3 = Animated.loop(Animated.sequence([
      Animated.timing(orb3X, { toValue: -14, duration: 5200, useNativeDriver: true }),
      Animated.timing(orb3X, { toValue:   0, duration: 5200, useNativeDriver: true }),
    ]));
    driftOrb1.start();
    driftOrb2.start();
    driftOrb3.start();

    return () => { driftOrb1.stop(); driftOrb2.stop(); driftOrb3.stop(); };
  }, []);

  // ── Scan line runs when no image is selected ──────────────────────────
  useEffect(() => {
    if (!image) {
      scanLineY.setValue(0);
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(scanLineY, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanLineY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }
  }, [image]);

  // ── Analyse button pulses when image is ready ─────────────────────────
  useEffect(() => {
    if (image) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(analysePulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(analysePulse, { toValue: 1.00, duration: 900, useNativeDriver: true }),
      ]));
      pulse.start();
      return () => pulse.stop();
    }
  }, [image]);

  // ── Handlers (original logic, unchanged) ─────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const analyzeImage = () => {
    if (!image) {
      Alert.alert('No Image', 'Please select an image first.');
      return;
    }
    router.push({ pathname: '/result', params: { imageUri: image } });
  };

  // ── Scan line position ────────────────────────────────────────────────
  const scanLineTranslateY = scanLineY.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, PREVIEW_SIZE - 4],
  });

  // ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ══ DEEP BACKGROUND ══════════════════════════════════════════════ */}
      <LinearGradient
        colors={['#0A0820', '#150D38', '#0A1628']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ══ PARALLAX GLOW ORBS ═══════════════════════════════════════════ */}
      <Animated.View style={[styles.glowOrb, styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.glowOrb, styles.orb2, { transform: [{ translateY: orb2Y }] }]} />
      <Animated.View style={[styles.glowOrb, styles.orb3, { transform: [{ translateX: orb3X }] }]} />

      {/* ══ PAGE CONTENT ═════════════════════════════════════════════════ */}
      <View style={[styles.content, { paddingTop: STATUS_BAR_HEIGHT + 10 }]}>

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.headerRow, { opacity: mountAnim, transform: [{ translateY: titleSlide }] }]}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <BlurView intensity={18} tint="dark" style={styles.backBtnInner}>
              <LinearGradient
                colors={['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.03)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.topShimmer} />
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.88)" />
            </BlurView>
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>PetDx Scan</Text>
            <Text style={styles.subtitle}>Identify your pet's health</Text>
          </View>

          {/* Spacer to keep title centred */}
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* ── PREVIEW FRAME ────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.previewWrapper, { opacity: mountAnim, transform: [{ scale: previewScale }] }]}
        >
          {/* Outer soft glow ring */}
          <View style={styles.previewGlowRing} />

          <BlurView intensity={20} tint="dark" style={styles.previewFrame}>
            {/* Glass tint */}
            <LinearGradient
              colors={['rgba(123,95,255,0.14)', 'rgba(10,8,28,0.72)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Corner accent marks */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {image ? (
              /* ── Image loaded ── */
              <>
                <Image source={{ uri: image }} style={styles.previewImage} />
                {/* Green "ready" border */}
                <View style={styles.readyRing} />
              </>
            ) : (
              /* ── Empty state ── */
              <View style={styles.emptyState}>
                {/* Animated scan line */}
                <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(123,95,255,0.80)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.scanLineInner}
                  />
                </Animated.View>

                {/* Paw icon */}
                <View style={styles.pawCircle}>
                  <LinearGradient
                    colors={['rgba(123,95,255,0.22)', 'rgba(123,95,255,0.06)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="paw-outline" size={54} color="rgba(169,139,255,0.68)" />
                </View>
                <Text style={styles.emptyLabel}>No image selected</Text>
                <Text style={styles.emptyHint}>Use the buttons below to add a photo</Text>
              </View>
            )}
          </BlurView>
        </Animated.View>

        {/* ── TIP CHIP ──────────────────────────────────────────────────── */}
        <Animated.View style={[styles.tipChip, { opacity: mountAnim }]}>
          <BlurView intensity={16} tint="dark" style={styles.tipChipInner}>
            <LinearGradient
              colors={['rgba(255,184,0,0.16)', 'rgba(255,184,0,0.04)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.tipShimmer} />
            <Ionicons name="bulb-outline" size={14} color="#FFB800" style={{ marginRight: 7 }} />
            <Text style={styles.tipText}>
              Tip: Good lighting and a clear face shot gives the best results
            </Text>
          </BlurView>
        </Animated.View>

        {/* ── ACTION BUTTONS ─────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.btnRow, { opacity: mountAnim, transform: [{ translateY: btnSlide }] }]}
        >
          {/* Gallery */}
          <TouchableOpacity style={styles.actionBtn} onPress={pickImage} activeOpacity={0.78}>
            <BlurView intensity={18} tint="dark" style={styles.actionBtnInner}>
              <LinearGradient
                colors={['rgba(123,95,255,0.28)', 'rgba(123,95,255,0.08)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.topShimmer} />
              <View style={styles.actionIconWrap}>
                <LinearGradient colors={['#7B5FFF', '#A98BFF']} style={styles.actionIconGradient}>
                  <Ionicons name="images-outline" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.actionLabel}>Gallery</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Camera */}
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnCamera]} onPress={takePhoto} activeOpacity={0.78}>
            <BlurView intensity={18} tint="dark" style={styles.actionBtnInner}>
              <LinearGradient
                colors={['rgba(255,107,78,0.26)', 'rgba(255,107,78,0.07)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.topShimmer, { backgroundColor: 'rgba(255,107,78,0.35)' }]} />
              <View style={styles.actionIconWrap}>
                <LinearGradient colors={['#FF6B4E', '#FF9F7B']} style={styles.actionIconGradient}>
                  <Ionicons name="camera-outline" size={20} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.actionLabel}>Camera</Text>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* ── ANALYSE BUTTON ─────────────────────────────────────────────── */}
        {image && (
          <Animated.View style={[styles.analyseWrapper, { transform: [{ scale: analysePulse }] }]}>
            <TouchableOpacity style={styles.analyseBtn} onPress={analyzeImage} activeOpacity={0.80}>
              {/* Android glow slab */}
              <View style={styles.analyseGlowSlab} />
              <LinearGradient
                colors={['#8B6FFF', '#5E3FE8', '#A98BFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.analyseGradient}
              >
                <View style={styles.analyseShimmer} />
                <Ionicons name="scan-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.analyseLabel}>Analyse Pet</Text>
                <View style={styles.analyseArrow}>
                  <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.65)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Clear selection */}
        {image && (
          <TouchableOpacity onPress={() => setImage(null)} style={styles.clearBtn}>
            <Text style={styles.clearLabel}>Clear selection</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Root & background ──────────────────────────────────────────────────────
  root: {
    flex:            1,
    backgroundColor: '#0A0820',
  },

  // ── Glow orbs ─────────────────────────────────────────────────────────────
  glowOrb: {
    position:     'absolute',
    borderRadius: 999,
    opacity:      0.30,
  },
  orb1: {
    width:           300,
    height:          300,
    backgroundColor: '#7B5FFF',
    top:             -100,
    left:            -80,
    shadowColor:     '#7B5FFF',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    110,
    elevation:       0,
  },
  orb2: {
    width:           240,
    height:          240,
    backgroundColor: '#FF6B4E',
    top:             height * 0.40,
    right:           -80,
    shadowColor:     '#FF6B4E',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    90,
    elevation:       0,
  },
  orb3: {
    width:           180,
    height:          180,
    backgroundColor: '#00C2FF',
    bottom:          90,
    left:            -50,
    shadowColor:     '#00C2FF',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    70,
    elevation:       0,
  },

  // ── Content ────────────────────────────────────────────────────────────────
  content: {
    flex:              1,
    alignItems:        'center',
    paddingHorizontal: 20,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  headerRow: {
    width:          '100%',
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   20,
  },
  backBtn: {
    borderRadius: 14,
    overflow:     'hidden',
    borderWidth:  1,
    borderColor:  'rgba(255,255,255,0.11)',
    elevation:    4,
  },
  backBtnInner: {
    width:           44,
    height:          44,
    justifyContent:  'center',
    alignItems:      'center',
    overflow:        'hidden',
    backgroundColor: 'rgba(10,8,28,0.70)',   // Android fallback
  },
  headerSpacer: {
    width:  44,
    height: 44,
  },
  titleBlock: { alignItems: 'center' },
  title: {
    fontSize:      24,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize:  12,
    color:     'rgba(255,255,255,0.48)',
    marginTop: 3,
    letterSpacing: 0.2,
  },

  // ── Preview frame ──────────────────────────────────────────────────────────
  previewWrapper: {
    marginBottom: 16,
  },
  previewGlowRing: {
    position:     'absolute',
    top:          -5,
    left:         -5,
    width:        PREVIEW_SIZE + 10,
    height:       PREVIEW_SIZE + 10,
    borderRadius: 30,
    borderWidth:  1.5,
    borderColor:  'rgba(123,95,255,0.25)',
    elevation:    10,
  },
  previewFrame: {
    width:           PREVIEW_SIZE,
    height:          PREVIEW_SIZE,
    borderRadius:    24,
    overflow:        'hidden',
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.13)',
    elevation:       8,
    backgroundColor: 'rgba(10,8,28,0.82)',   // Android fallback
  },
  previewImage: {
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  readyRing: {
    position:     'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 22,
    borderWidth:  2,
    borderColor:  'rgba(61,190,110,0.42)',
  },

  // Corner marks
  corner: {
    position: 'absolute',
    width:    CORNER_SIZE,
    height:   CORNER_SIZE,
    zIndex:   4,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth:      CORNER_WEIGHT,
    borderLeftWidth:     CORNER_WEIGHT,
    borderTopLeftRadius: CORNER_RADIUS,
    borderColor:         'rgba(169,139,255,0.72)',
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth:       CORNER_WEIGHT,
    borderRightWidth:     CORNER_WEIGHT,
    borderTopRightRadius: CORNER_RADIUS,
    borderColor:          'rgba(169,139,255,0.72)',
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth:      CORNER_WEIGHT,
    borderLeftWidth:        CORNER_WEIGHT,
    borderBottomLeftRadius: CORNER_RADIUS,
    borderColor:            'rgba(169,139,255,0.72)',
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth:       CORNER_WEIGHT,
    borderRightWidth:        CORNER_WEIGHT,
    borderBottomRightRadius: CORNER_RADIUS,
    borderColor:             'rgba(169,139,255,0.72)',
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
  },
  scanLine: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   3,
    zIndex:   3,
  },
  scanLineInner: {
    flex: 1,
  },
  pawCircle: {
    width:          100,
    height:         100,
    borderRadius:   30,
    justifyContent: 'center',
    alignItems:     'center',
    overflow:       'hidden',
    marginBottom:   14,
    borderWidth:    1,
    borderColor:    'rgba(169,139,255,0.20)',
  },
  emptyLabel: {
    fontSize:  15,
    fontWeight: '600',
    color:     'rgba(255,255,255,0.58)',
    marginBottom: 5,
  },
  emptyHint: {
    fontSize:  12,
    color:     'rgba(255,255,255,0.28)',
    textAlign: 'center',
    paddingHorizontal: 24,
    letterSpacing: 0.15,
  },

  // ── Tip chip ───────────────────────────────────────────────────────────────
  tipChip: {
    width:        '100%',
    borderRadius: 14,
    overflow:     'hidden',
    marginBottom: 14,
    borderWidth:  1,
    borderColor:  'rgba(255,184,0,0.22)',
    elevation:    3,
  },
  tipChipInner: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   10,
    paddingHorizontal: 14,
    overflow:          'hidden',
    backgroundColor:   'rgba(10,8,28,0.72)',  // Android fallback
  },
  tipShimmer: {
    position:        'absolute',
    top: 0, left: 0, right: 0,
    height:          1,
    backgroundColor: 'rgba(255,184,0,0.28)',
  },
  tipText: {
    flex:          1,
    fontSize:      12,
    color:         'rgba(255,225,120,0.78)',
    lineHeight:    17,
    letterSpacing: 0.15,
  },

  // ── Action buttons ─────────────────────────────────────────────────────────
  btnRow: {
    flexDirection:  'row',
    width:          '100%',
    gap:            12,
    marginBottom:   14,
  },
  actionBtn: {
    flex:         1,
    borderRadius: 18,
    overflow:     'hidden',
    borderWidth:  1,
    borderColor:  'rgba(123,95,255,0.22)',
    elevation:    6,
  },
  actionBtnCamera: {
    borderColor: 'rgba(255,107,78,0.22)',
  },
  actionBtnInner: {
    paddingVertical:   16,
    paddingHorizontal: 12,
    alignItems:        'center',
    overflow:          'hidden',
    backgroundColor:   'rgba(10,8,28,0.74)',  // Android fallback
  },
  actionIconWrap: {
    borderRadius:  14,
    overflow:      'hidden',
    marginBottom:  8,
    elevation:     4,
  },
  actionIconGradient: {
    width:          44,
    height:         44,
    justifyContent: 'center',
    alignItems:     'center',
  },
  actionLabel: {
    fontSize:      13,
    fontWeight:    '600',
    color:         'rgba(255,255,255,0.84)',
    letterSpacing: 0.3,
  },

  // ── Analyse button ─────────────────────────────────────────────────────────
  analyseWrapper: {
    width:        '100%',
    marginBottom: 10,
  },
  analyseBtn: {
    width:        '100%',
    borderRadius: 20,
    overflow:     'visible',
    elevation:    12,
  },
  analyseGlowSlab: {
    position:        'absolute',
    top:              6,
    left:            12,
    right:           12,
    bottom:          -4,
    borderRadius:    20,
    backgroundColor: '#7B5FFF',
    opacity:         0.32,
    elevation:       8,
  },
  analyseGradient: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    paddingVertical:   18,
    paddingHorizontal: 28,
    borderRadius:      20,
    overflow:          'hidden',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.22)',
  },
  analyseShimmer: {
    position:        'absolute',
    top: 0, left: 0, right: 0,
    height:          1.5,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  analyseLabel: {
    fontSize:      17,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 0.4,
  },
  analyseArrow: {
    position: 'absolute',
    right:    22,
  },

  // ── Clear ──────────────────────────────────────────────────────────────────
  clearBtn: {
    paddingVertical:   6,
    paddingHorizontal: 16,
  },
  clearLabel: {
    fontSize:  13,
    color:     'rgba(255,255,255,0.28)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Shared top shimmer border for glass elements
  topShimmer: {
    position:        'absolute',
    top: 0, left: 0, right: 0,
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    zIndex:          2,
  },
});