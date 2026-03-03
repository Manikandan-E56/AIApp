import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../Context/ThemeContext';

const { width } = Dimensions.get('window');

const features = [
  { icon: '💬', title: 'Smart Chat', desc: 'Ask anything, get instant AI answers' },
  { icon: '✍️', title: 'Write Better', desc: 'Emails, messages, essays & more' },
  { icon: '🧠', title: 'Solve Problems', desc: 'Get step-by-step explanations' },
  { icon: '🖼️', title: 'Image Analysis', desc: 'Analyze photos with AI vision' },
];

const FeatureCard = ({ icon, title, desc, delay, theme }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.cardIconContainer, { backgroundColor: theme.bgAccent }]}>
        <Text style={styles.cardIcon}>{icon}</Text>
      </View>
      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.cardDesc, { color: theme.textMuted }]}>{desc}</Text>
    </Animated.View>
  );
};

export default function Home({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.timing(contentAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    // ✅ SafeAreaView — handles notch, status bar & home indicator on all devices
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <Text style={[styles.logoIcon, { color: theme.purpleLight }]}>✦</Text>
            <Text style={[styles.appName, { color: theme.textPrimary }]}>AIMind</Text>
          </View>
          <View style={styles.topRight}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={toggleTheme}>
              <Text style={styles.iconText}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.bgAccent, borderColor: theme.borderAccent }]} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.iconText}>🧑</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: headerAnim }]}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Ready to assist</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>What can I help{'\n'}you with today?</Text>
        </Animated.View>

        <Animated.View style={{ opacity: contentAnim }}>

          {/* Quick Prompts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsRow}>
            {['✉️ Draft an email', '📖 Explain a concept', '🍕 Recipe ideas', '💡 Brainstorm'].map((prompt) => (
              <TouchableOpacity key={prompt} style={[styles.promptChip, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => navigation.navigate('Chat', { prompt })} activeOpacity={0.7}>
                <Text style={[styles.promptText, { color: theme.textSecondary }]}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bento Action Grid */}
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.primaryAction, { backgroundColor: theme.purple, shadowColor: theme.purple }]} onPress={() => navigation.navigate('Chat')} activeOpacity={0.85}>
              <View style={styles.primaryActionTextCol}>
                <Text style={styles.primaryActionTitle}>Start Chatting</Text>
                <Text style={styles.primaryActionSub}>Tap to open AI Assistant</Text>
              </View>
              <Animated.View style={[styles.orbInner, { backgroundColor: theme.purpleDark, transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.orbEmoji}>🤖</Text>
              </Animated.View>
            </TouchableOpacity>

            <View style={styles.secondaryActionRow}>
              <TouchableOpacity style={[styles.secondaryAction, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => navigation.navigate('ImageAnalysis')} activeOpacity={0.8}>
                <Text style={styles.secondaryActionIcon}>🖼️</Text>
                <Text style={[styles.secondaryActionTitle, { color: theme.textPrimary }]}>Image AI</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryAction, { backgroundColor: theme.bgCard, borderColor: theme.border }]} onPress={() => navigation.navigate('History')} activeOpacity={0.8}>
                <Text style={styles.secondaryActionIcon}>📜</Text>
                <Text style={[styles.secondaryActionTitle, { color: theme.textPrimary }]}>History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            {[['10M+', 'Users'], ['99%', 'Accuracy'], ['24/7', 'Online']].map(([val, label]) => (
              <View key={label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.purpleLight }]}>{val}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Features */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Explore Features</Text>
          </View>
          <View style={styles.cardsGrid}>
            {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={200 + i * 100} theme={theme} />)}
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 20 },

  // ✅ Reduced paddingTop since SafeAreaView handles the notch/status bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoIcon: { fontSize: 20, fontWeight: '800' },
  appName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconText: { fontSize: 18 },

  hero: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20 },
  greeting: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  title: { fontSize: 36, fontWeight: '800', lineHeight: 42, letterSpacing: -1 },

  promptsRow: { paddingHorizontal: 24, paddingBottom: 24, gap: 10 },
  promptChip: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1 },
  promptText: { fontSize: 14, fontWeight: '500' },

  actionGrid: { paddingHorizontal: 24, gap: 12, marginBottom: 30 },
  primaryAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderRadius: 24, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  primaryActionTextCol: { flex: 1 },
  primaryActionTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  primaryActionSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  orbInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  orbEmoji: { fontSize: 28 },
  secondaryActionRow: { flexDirection: 'row', gap: 12 },
  secondaryAction: { flex: 1, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryActionIcon: { fontSize: 24 },
  secondaryActionTitle: { fontSize: 15, fontWeight: '600' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 24, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 24, marginBottom: 36, borderWidth: 1 },
  statItem: { alignItems: 'flex-start' },
  statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, gap: 12 },
  card: { borderRadius: 20, padding: 20, width: (width - 48) / 2, borderWidth: 1 },
  cardIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardIcon: { fontSize: 22 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
});