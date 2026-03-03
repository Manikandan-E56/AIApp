import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Animated, Linking,
} from 'react-native';
import { useTheme } from '../Context/ThemeContext';

// ── Policy Sections ───────────────────────────────────────────────────────────
const SECTIONS = [
  {
    icon: '📋',
    title: 'Information We Collect',
    content: [
      { heading: 'What we DO collect', body: 'We collect nothing from you. AIMind does not require an account, email, phone number, or any personal information to use the app.' },
      { heading: 'Local storage only', body: 'Your chat history, preferences (like dark/light theme), and notification settings are stored locally on your device using AsyncStorage. This data never leaves your phone.' },
      { heading: 'API requests', body: 'When you send a message or analyze an image, the content is sent to the Groq AI API to generate a response. We do not store or log these requests on our servers.' },
    ],
  },
  {
    icon: '🔒',
    title: 'How We Use Your Data',
    content: [
      { heading: 'We don\'t use your data', body: 'Since we collect no personal information, there is nothing to use. Your conversations are between you and the Groq AI service.' },
      { heading: 'No advertising profiles', body: 'We do not build advertising profiles, track your behavior, or sell any information to third parties. AIMind has no ads.' },
      { heading: 'No analytics tracking', body: 'We do not use analytics tools that track individual users, session recordings, or behavioral data collection.' },
    ],
  },
  {
    icon: '🤝',
    title: 'Third-Party Services',
    content: [
      { heading: 'Groq AI API', body: 'Your chat messages and images are sent to Groq (groq.com) to generate AI responses. Groq\'s own privacy policy applies to how they handle API requests. Groq does not use API inputs to train models.' },
      { heading: 'Expo Notifications', body: 'If you enable push notifications, Expo\'s push notification service is used to deliver them. No personal data is shared with Expo beyond what is necessary for delivery.' },
      { heading: 'No other third parties', body: 'We do not integrate with Facebook, Google Analytics, Firebase, or any other tracking or advertising SDKs.' },
    ],
  },
  {
    icon: '📱',
    title: 'Device Permissions',
    content: [
      { heading: 'Microphone', body: 'Used only when you tap the mic button to record voice input. Audio is sent to Groq Whisper for transcription and is not stored.' },
      { heading: 'Camera & Photos', body: 'Used only when you choose to take a photo or pick from gallery for Image Analysis. Images are converted to base64 and sent to Groq Vision API only when you tap Analyze.' },
      { heading: 'Notifications', body: 'Used only if you grant permission for daily AI reminders. You can disable this anytime in your phone settings or inside the app.' },
    ],
  },
  {
    icon: '👶',
    title: 'Children\'s Privacy',
    content: [
      { heading: 'Age requirement', body: 'AIMind is not intended for children under the age of 13. We do not knowingly collect any information from children.' },
      { heading: 'Parental guidance', body: 'If you believe a child has used this app and provided personal information, please contact us immediately at support@aimind.app.' },
    ],
  },
  {
    icon: '🔄',
    title: 'Data Deletion',
    content: [
      { heading: 'Delete your data anytime', body: 'All your chat history and settings are stored on your device. You can delete them at any time by going to Profile → Clear All History, or by uninstalling the app.' },
      { heading: 'Uninstalling the app', body: 'Uninstalling AIMind from your device completely removes all locally stored data including chat history, settings, and cached preferences.' },
    ],
  },
  {
    icon: '📝',
    title: 'Changes to This Policy',
    content: [
      { heading: 'Policy updates', body: 'We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date at the top of this page and notify users through an in-app notice.' },
      { heading: 'Continued use', body: 'Your continued use of AIMind after any changes to this Privacy Policy constitutes your acceptance of the updated terms.' },
    ],
  },
];

// ── Policy Section Component ──────────────────────────────────────────────────
const PolicySection = ({ icon, title, content, index, theme }) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      className="mx-4 mb-4 rounded-2xl border overflow-hidden"
      style={{ backgroundColor: theme.bgCard, borderColor: theme.border, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      {/* Section header */}
      <View className="flex-row items-center gap-3 px-4 py-4 border-b" style={{ borderBottomColor: theme.border }}>
        <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: theme.bgAccent }}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>{title}</Text>
      </View>

      {/* Content items */}
      <View className="px-4 py-3 gap-4">
        {content.map((item, i) => (
          <View key={i}>
            <Text className="text-sm font-bold mb-1" style={{ color: theme.purpleLight }}>{item.heading}</Text>
            <Text className="text-sm leading-6" style={{ color: theme.textSecondary }}>{item.body}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PrivacyPolicy({ navigation }) {
  const { theme, isDark } = useTheme();
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-[52px] pb-4 border-b" style={{ borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Text className="text-[22px] font-semibold" style={{ color: theme.purpleLight }}>←</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>Privacy Policy</Text>
          <Text className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>Last updated: Jan 2025</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Animated.View
          className="m-4 rounded-3xl p-6 items-center border"
          style={{ backgroundColor: theme.bgAccent, borderColor: theme.borderAccent, opacity: headerAnim }}
        >
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: theme.bgCard }}>
            <Text style={{ fontSize: 34 }}>🔐</Text>
          </View>
          <Text className="text-xl font-bold mb-2" style={{ color: theme.textPrimary }}>Your Privacy Matters</Text>
          <Text className="text-sm text-center leading-6" style={{ color: theme.textSecondary }}>
            AIMind is built with a <Text className="font-bold" style={{ color: theme.purpleLight }}>privacy-first</Text> approach.
            {'\n'}No accounts. No tracking. No ads. Ever.
          </Text>

          {/* Privacy badges */}
          <View className="flex-row gap-2 mt-4 flex-wrap justify-center">
            {['🚫 No Ads', '🔒 No Tracking', '✅ No Account', '📵 No Data Sale'].map((badge) => (
              <View key={badge} className="px-3 py-1.5 rounded-full border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                <Text className="text-xs font-semibold" style={{ color: theme.textSecondary }}>{badge}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Quick Summary */}
        <Text className="text-[11px] font-bold tracking-[1.5px] mx-5 mb-3" style={{ color: theme.textMuted }}>QUICK SUMMARY</Text>
        <View className="mx-4 mb-6 rounded-2xl border overflow-hidden" style={{ borderColor: theme.border }}>
          {[
            ['✅', 'Chats stored on YOUR device only'],
            ['✅', 'No personal info collected ever'],
            ['✅', 'No third-party ad trackers'],
            ['✅', 'Delete data anytime by uninstalling'],
            ['⚠️', 'Messages sent to Groq AI API for processing'],
          ].map(([icon, text], i, arr) => (
            <View
              key={text}
              className="flex-row items-center px-4 py-3 gap-3"
              style={{
                backgroundColor: theme.bgCard,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 16, width: 24 }}>{icon}</Text>
              <Text className="text-sm flex-1" style={{ color: theme.textPrimary }}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Full Policy */}
        <Text className="text-[11px] font-bold tracking-[1.5px] mx-5 mb-3" style={{ color: theme.textMuted }}>FULL POLICY</Text>
        {SECTIONS.map((section, i) => (
          <PolicySection key={i} {...section} index={i} theme={theme} />
        ))}

        {/* Contact */}
        <View className="mx-4 mb-4 rounded-2xl p-5 border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
          <Text className="text-base font-bold mb-2" style={{ color: theme.textPrimary }}>📬 Questions about Privacy?</Text>
          <Text className="text-sm leading-6 mb-4" style={{ color: theme.textSecondary }}>
            If you have any questions about this Privacy Policy or how your data is handled, please contact us directly.
          </Text>
          <TouchableOpacity
            className="py-3.5 rounded-2xl items-center"
            style={{ backgroundColor: theme.purple }}
            onPress={() => Linking.openURL('mailto:privacy@aimind.app?subject=Privacy Policy Question')}
            activeOpacity={0.85}
          >
            <Text className="text-white text-sm font-bold">📧 Contact Privacy Team</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text className="text-xs text-center mb-10 px-8 leading-5" style={{ color: theme.textDim }}>
          This policy applies to the AIMind mobile application.{'\n'}
          © 2025 AIMind. All rights reserved.
        </Text>

      </ScrollView>
    </View>
  );
}