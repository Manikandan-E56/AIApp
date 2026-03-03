import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Alert, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

const MODES = [
  { id: 'describe',  icon: '🔍', label: 'Describe',  prompt: 'Describe this image in detail.' },
  { id: 'text',      icon: '📝', label: 'Read Text', prompt: 'Extract and list all text visible in this image.' },
  { id: 'objects',   icon: '📦', label: 'Objects',   prompt: 'List all objects, people, and elements you see in this image.' },
  { id: 'emotion',   icon: '😊', label: 'Emotions',  prompt: 'Describe the mood, emotions, and atmosphere of this image.' },
  { id: 'translate', icon: '🌍', label: 'Translate', prompt: 'Identify any text in this image and translate it to English.' },
];

export default function ImageAnalysis({ navigation }) {
  const [imageUri, setImageUri]         = useState(null);
  const [base64Image, setBase64Image]   = useState(null);
  const [result, setResult]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [selectedMode, setSelectedMode] = useState('describe');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSpeaking, setIsSpeaking]     = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // ✅ FIX 1 — Add scrollRef
  const scrollRef = useRef(null);

  // ✅ FIX 2 — Scroll to top helper
  const scrollToTop = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 150);
  };

  const animateResult = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  // ── Pick from Gallery ─────────────────────────────────────────────────────
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Denied', 'Gallery access is required.'); return; }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setBase64Image(result.assets[0].base64);
        setResult('');
        scrollToTop(); // ✅ FIX 3 — Scroll to top after picking
      }
    } catch (e) { Alert.alert('Error', e.message); }
  };

  // ── Take Photo ────────────────────────────────────────────────────────────
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Denied', 'Camera access is required.'); return; }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setBase64Image(result.assets[0].base64);
        setResult('');
        scrollToTop(); // ✅ FIX 3 — Scroll to top after taking photo
      }
    } catch (e) { Alert.alert('Error', e.message); }
  };

  // ── Analyze Image ─────────────────────────────────────────────────────────
  const analyzeImage = async () => {
    if (!imageUri || !base64Image) { Alert.alert('No Image', 'Please select or take a photo first.'); return; }

    const mode   = MODES.find((m) => m.id === selectedMode);
    const prompt = mode?.prompt || customPrompt || 'Describe this image.';

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
              { type: 'text', text: prompt },
            ],
          }],
        }),
      });

      const data = await response.json();
      if (data?.choices?.[0]?.message?.content) {
        setResult(data.choices[0].message.content);
        animateResult();
      } else {
        throw new Error(data?.error?.message || 'No response from AI');
      }
    } catch (e) {
      Alert.alert('Analysis Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Speak Result ──────────────────────────────────────────────────────────
  const speakResult = () => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); return; }
    setIsSpeaking(true);
    Speech.speak(result, {
      language: 'en-US', rate: 0.95,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Image Analysis</Text>
          <Text style={styles.headerSub}>AI-powered vision</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ✅ FIX — ref attached to ScrollView */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Image Picker / Preview */}
        {!imageUri ? (
          <View style={styles.pickerArea}>
            <Text style={styles.pickerIcon}>🖼️</Text>
            <Text style={styles.pickerTitle}>Add an Image</Text>
            <Text style={styles.pickerSub}>Take a photo or choose from your gallery</Text>
            <View style={styles.pickerButtons}>
              <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto} activeOpacity={0.8}>
                <Text style={styles.pickerBtnIcon}>📷</Text>
                <Text style={styles.pickerBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery} activeOpacity={0.8}>
                <Text style={styles.pickerBtnIcon}>🖼️</Text>
                <Text style={styles.pickerBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.imageActionBtn} onPress={takePhoto}>
                <Text style={styles.imageActionText}>📷 Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageActionBtn} onPress={pickFromGallery}>
                <Text style={styles.imageActionText}>🖼️ Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mode Selector */}
        <Text style={styles.sectionTitle}>What do you want to know?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modesRow}>
          {MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.modeChip, selectedMode === mode.id && styles.modeChipActive]}
              onPress={() => setSelectedMode(mode.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.modeIcon}>{mode.icon}</Text>
              <Text style={[styles.modeLabel, selectedMode === mode.id && styles.modeLabelActive]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeBtn, (!imageUri || loading) && styles.analyzeBtnDisabled]}
          onPress={analyzeImage}
          disabled={!imageUri || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.analyzeBtnText}>🔍 Analyze Image</Text>
          }
        </TouchableOpacity>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>AI is analyzing your image...</Text>
          </View>
        )}

        {/* Result */}
        {result !== '' && !loading && (
          <Animated.View style={[styles.resultCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.resultHeader}>
              <View style={styles.resultTitleRow}>
                <Text style={styles.resultIcon}>{MODES.find((m) => m.id === selectedMode)?.icon || '🤖'}</Text>
                <Text style={styles.resultTitle}>AI Result</Text>
              </View>
              <TouchableOpacity style={styles.speakBtn} onPress={speakResult}>
                <Text style={styles.speakBtnText}>{isSpeaking ? '⏹️ Stop' : '🔊 Speak'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.resultText}>{result}</Text>
            <TouchableOpacity
              style={styles.chatFollowUp}
              onPress={() => navigation.navigate('Chat', { prompt: `About the image: ${result.slice(0, 100)}... Tell me more.` })}
              activeOpacity={0.8}
            >
              <Text style={styles.chatFollowUpText}>💬 Ask AI more about this →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Tips */}
        {!imageUri && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 What can I analyze?</Text>
            {[
              '📄 Read text from documents or signs',
              '🍕 Identify food and get recipes',
              '🌿 Identify plants and animals',
              '🗺️ Translate text in any language',
              '😊 Detect emotions and moods',
              '🛒 Identify products and prices',
            ].map((tip, i) => <Text key={i} style={styles.tipItem}>{tip}</Text>)}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { paddingBottom: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1F1F2E',
  },
  backBtn: { padding: 8 },
  backIcon: { color: '#A78BFA', fontSize: 22, fontWeight: '600' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#F5F3FF', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  pickerArea: {
    margin: 16, backgroundColor: '#111118', borderRadius: 20,
    padding: 32, alignItems: 'center', borderWidth: 2,
    borderColor: '#1F1F2E', borderStyle: 'dashed',
  },
  pickerIcon: { fontSize: 48, marginBottom: 12 },
  pickerTitle: { color: '#F5F3FF', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  pickerSub: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  pickerButtons: { flexDirection: 'row', gap: 12 },
  pickerBtn: {
    backgroundColor: '#1E1030', paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#6D28D9', minWidth: 110,
  },
  pickerBtnIcon: { fontSize: 28, marginBottom: 6 },
  pickerBtnText: { color: '#A78BFA', fontSize: 14, fontWeight: '600' },
  imageContainer: { margin: 16, borderRadius: 20, overflow: 'hidden' },
  image: { width: '100%', height: 220 },
  imageActions: {
    flexDirection: 'row', justifyContent: 'center', gap: 12,
    backgroundColor: '#111118', padding: 12,
  },
  imageActionBtn: {
    backgroundColor: '#1E1030', paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1, borderColor: '#2D1B69',
  },
  imageActionText: { color: '#A78BFA', fontSize: 13, fontWeight: '600' },
  sectionTitle: { color: '#F5F3FF', fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 12 },
  modesRow: { paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  modeChip: {
    backgroundColor: '#111118', borderRadius: 16, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1F1F2E', minWidth: 75,
  },
  modeChipActive: {
    backgroundColor: '#1E1030', borderColor: '#7C3AED',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  modeIcon: { fontSize: 22, marginBottom: 5 },
  modeLabel: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
  modeLabelActive: { color: '#A78BFA' },
  analyzeBtn: {
    marginHorizontal: 16, backgroundColor: '#7C3AED', paddingVertical: 18,
    borderRadius: 16, alignItems: 'center', marginBottom: 16,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  analyzeBtnDisabled: { backgroundColor: '#2D2D3D', shadowOpacity: 0 },
  analyzeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loadingCard: { alignItems: 'center', padding: 24, gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 14 },
  resultCard: {
    marginHorizontal: 16, backgroundColor: '#111118', borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: '#2D1B69',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultIcon: { fontSize: 22 },
  resultTitle: { color: '#F5F3FF', fontSize: 16, fontWeight: '700' },
  speakBtn: {
    backgroundColor: '#1E1030', paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#6D28D9',
  },
  speakBtnText: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },
  resultText: { color: '#E5E7EB', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  chatFollowUp: {
    backgroundColor: '#0F0F1A', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1, borderColor: '#1F1F2E', alignItems: 'center',
  },
  chatFollowUpText: { color: '#A78BFA', fontSize: 13, fontWeight: '600' },
  tipsCard: {
    margin: 16, backgroundColor: '#111118', borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: '#1F1F2E',
  },
  tipsTitle: { color: '#F5F3FF', fontSize: 15, fontWeight: '700', marginBottom: 14 },
  tipItem: { color: '#9CA3AF', fontSize: 13, lineHeight: 28 },
});