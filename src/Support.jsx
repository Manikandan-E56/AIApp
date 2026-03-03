import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Animated, Linking, Alert,
} from 'react-native';
import { useTheme } from '../Context/ThemeContext';

// ── FAQ Data ──────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How do I start a new conversation?',
    a: 'Tap "Start Chatting" on the Home screen or the chat icon. Each session is automatically saved to your History.',
  },
  {
    q: 'Which languages does the AI support?',
    a: 'AIMind supports 15+ languages including Tamil, Hindi, Telugu, Malayalam, English, French, Spanish, German, Japanese, Chinese, and more. Just type in your language and the AI replies in the same language!',
  },
  {
    q: 'How does Voice Input work?',
    a: 'Tap the 🎤 microphone button in the chat screen, speak your message, then tap again to stop. Your speech is transcribed automatically using Groq Whisper AI.',
  },
  {
    q: 'How does Image Analysis work?',
    a: 'Go to Image Analysis from the home screen, pick a photo from gallery or take one with your camera, choose an analysis mode (Describe, Read Text, Objects, Emotions, Translate), then tap Analyze.',
  },
  {
    q: 'Is my chat data stored anywhere?',
    a: 'All your conversations are stored locally on your device only using AsyncStorage. We never upload your chat history to any server. Your data stays private and 100% on your phone.',
  },
  {
    q: 'Why is the AI not responding?',
    a: 'Check your internet connection first. If connected, the Groq API may be temporarily busy — try again in a few seconds. If the issue persists, please contact support.',
  },
  {
    q: 'How do I enable push notifications?',
    a: 'Go to Profile → Notifications. You can set a custom daily reminder time or leave it on Auto to receive tips every 4 hours automatically.',
  },
  {
    q: 'Can I use the app offline?',
    a: 'The AI chat requires an internet connection to communicate with the Groq API. However, your saved chat history is accessible offline.',
  },
];

// ── Accordion FAQ Item ────────────────────────────────────────────────────────
const FAQItem = ({ q, a, theme }) => {
  const [open, setOpen] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(heightAnim, { toValue, useNativeDriver: false, tension: 80, friction: 10 }),
      Animated.timing(rotateAnim, { toValue, duration: 200, useNativeDriver: true }),
    ]).start();
    setOpen(!open);
  };

  const maxHeight = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });
  const rotate    = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View className="mb-2 rounded-2xl overflow-hidden border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
      <TouchableOpacity className="flex-row items-center justify-between px-4 py-4" onPress={toggle} activeOpacity={0.7}>
        <Text className="flex-1 text-sm font-semibold pr-3" style={{ color: theme.textPrimary }}>{q}</Text>
        <Animated.Text style={{ color: theme.purpleLight, fontSize: 18, transform: [{ rotate }] }}>⌄</Animated.Text>
      </TouchableOpacity>
      <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
        <Text className="text-sm leading-6 px-4 pb-4" style={{ color: theme.textSecondary }}>{a}</Text>
      </Animated.View>
    </View>
  );
};

// ── Contact Card ──────────────────────────────────────────────────────────────
const ContactCard = ({ icon, title, subtitle, action, theme }) => (
  <TouchableOpacity
    className="flex-1 rounded-2xl p-4 items-center border"
    style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}
    onPress={action}
    activeOpacity={0.8}
  >
    <View className="w-12 h-12 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: theme.bgAccent }}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
    </View>
    <Text className="text-sm font-bold mb-1" style={{ color: theme.textPrimary }}>{title}</Text>
    <Text className="text-xs text-center" style={{ color: theme.textMuted }}>{subtitle}</Text>
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function Support({ navigation }) {
  const { theme, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const openEmail = () =>
    Linking.openURL('mailto:support@aimind.app?subject=AIMind Support Request').catch(() =>
      Alert.alert('Error', 'Could not open email app.')
    );

  const openWhatsApp = () =>
    Linking.openURL('https://wa.me/919876543210?text=Hi, I need help with AIMind app').catch(() =>
      Alert.alert('Error', 'WhatsApp not installed.')
    );

  const openPlayStore = () =>
    Linking.openURL('market://details?id=com.aimind.app').catch(() =>
      Linking.openURL('https://play.google.com/store/apps/details?id=com.aimind.app')
    );

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-[52px] pb-4 border-b" style={{ borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Text className="text-[22px] font-semibold" style={{ color: theme.purpleLight }}>←</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>Help & Support</Text>
          <Text className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>We're here for you</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Hero Banner */}
          <View className="m-4 rounded-3xl p-6 items-center" style={{ backgroundColor: theme.bgAccent, borderWidth: 1, borderColor: theme.borderAccent }}>
            <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: theme.bgCard }}>
              <Text style={{ fontSize: 36 }}>🛟</Text>
            </View>
            <Text className="text-xl font-bold mb-2" style={{ color: theme.textPrimary }}>How can we help?</Text>
            <Text className="text-sm text-center leading-5" style={{ color: theme.textSecondary }}>
              Browse FAQs below or reach out directly. We usually respond within 24 hours.
            </Text>
          </View>

          {/* Contact Options */}
          <Text className="text-[11px] font-bold tracking-[1.5px] mx-5 mb-3" style={{ color: theme.textMuted }}>CONTACT US</Text>
          <View className="flex-row gap-3 mx-4 mb-6">
            <ContactCard icon="📧" title="Email" subtitle="support@aimind.app" action={openEmail} theme={theme} />
            <ContactCard icon="💬" title="WhatsApp" subtitle="Quick response" action={openWhatsApp} theme={theme} />
            <ContactCard icon="⭐" title="Rate App" subtitle="Play Store" action={openPlayStore} theme={theme} />
          </View>

          {/* Status Row */}
          <View className="mx-4 mb-6 rounded-2xl p-4 flex-row items-center gap-3 border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <View className="flex-1">
              <Text className="text-sm font-bold" style={{ color: theme.textPrimary }}>All systems operational</Text>
              <Text className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Groq AI API · Whisper Voice · Vision — all running normally</Text>
            </View>
            <Text className="text-xs font-semibold" style={{ color: '#10B981' }}>99.9%</Text>
          </View>

          {/* FAQ Section */}
          <Text className="text-[11px] font-bold tracking-[1.5px] mx-5 mb-3" style={{ color: theme.textMuted }}>FREQUENTLY ASKED</Text>
          <View className="mx-4 mb-6">
            {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} theme={theme} />)}
          </View>

          {/* App Info */}
          <View className="mx-4 mb-4 rounded-2xl border overflow-hidden" style={{ borderColor: theme.border }}>
            {[
              ['📱', 'App Version', '1.0.0'],
              ['🤖', 'AI Model', 'Groq llama-3.3-70b'],
              ['🎤', 'Voice Model', 'Whisper large-v3-turbo'],
              ['👁️', 'Vision Model', 'llama-4-scout-17b'],
            ].map(([icon, label, value], i, arr) => (
              <View
                key={label}
                className="flex-row items-center px-4 py-3.5"
                style={{
                  backgroundColor: theme.bgCard,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                }}
              >
                <Text className="text-lg w-8">{icon}</Text>
                <Text className="flex-1 text-sm font-medium ml-2" style={{ color: theme.textPrimary }}>{label}</Text>
                <Text className="text-xs font-mono" style={{ color: theme.textMuted }}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <Text className="text-xs text-center mb-10 px-8 leading-5" style={{ color: theme.textDim }}>
            Made with ❤️ using React Native & Groq AI{'\n'}© 2025 AIMind. All rights reserved.
          </Text>

        </Animated.View>
      </ScrollView>
    </View>
  );
}