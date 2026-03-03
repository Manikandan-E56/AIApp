import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StatusBar, Animated, Linking, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../Context/ThemeContext';

const CATEGORIES = [
  { id: 'bug',     icon: '🐛', label: 'Bug Report' },
  { id: 'feature', icon: '💡', label: 'Feature Request' },
  { id: 'ai',      icon: '🤖', label: 'AI Problem' },
  { id: 'voice',   icon: '🎤', label: 'Voice Issue' },
  { id: 'other',   icon: '💬', label: 'Other' },
];

// ── Quick Contact Card ────────────────────────────────────────────────────────
const QuickCard = ({ icon, title, subtitle, badge, color, onPress, theme }) => (
  <TouchableOpacity
    className="flex-1 rounded-2xl p-3.5 border items-center gap-1.5"
    style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: theme.bgAccent }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
    <Text className="text-xs font-bold text-center" style={{ color: theme.textPrimary }}>{title}</Text>
    <Text className="text-[10px] text-center" style={{ color: theme.textMuted }}>{subtitle}</Text>
    {badge && (
      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '22' }}>
        <Text className="text-[10px] font-bold" style={{ color }}>{badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ContactSupport({ navigation }) {
  const { theme, isDark } = useTheme();
  const [category, setCategory] = useState('bug');
  const [subject, setSubject]   = useState('');
  const [message, setMessage]   = useState('');
  const [email, setEmail]       = useState('');
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sentAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleSend = async () => {
    if (!subject.trim()) { Alert.alert('Missing Subject', 'Please enter a subject.'); return; }
    if (!message.trim()) { Alert.alert('Missing Message', 'Please describe your issue.'); return; }

    setSending(true);
    const cat     = CATEGORIES.find(c => c.id === category);
    const body    = `Category: ${cat?.label}\n\nMessage:\n${message}${email ? `\n\nReply to: ${email}` : ''}`;
    const mailto  = `mailto:support@aimind.app?subject=[${cat?.label}] ${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(mailto);
      setSending(false);
      setSent(true);
      Animated.parallel([
        Animated.spring(sentAnim,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      ]).start();
    } catch {
      setSending(false);
      Alert.alert('Error', 'Could not open email.\nContact: support@aimind.app');
    }
  };

  const resetForm = () => {
    setSubject(''); setMessage(''); setEmail('');
    setCategory('bug'); setSent(false);
    sentAnim.setValue(0); scaleAnim.setValue(0.9);
  };

  const inputStyle = { backgroundColor: theme.bgInput, borderColor: theme.borderInput, color: theme.textPrimary };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-[52px] pb-4 border-b" style={{ borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Text className="text-[22px] font-semibold" style={{ color: theme.purpleLight }}>←</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>Contact Support</Text>
          <Text className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>We reply within 24 hours</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ╔══ SUCCESS STATE ════════════════════════════════════════╗ */}
            {sent ? (
              <Animated.View
                className="m-5 rounded-3xl p-8 items-center border"
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: '#10B981',
                  opacity: sentAnim,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                {/* Checkmark */}
                <View
                  className="w-24 h-24 rounded-full items-center justify-center mb-5"
                  style={{ backgroundColor: '#10B98120', borderWidth: 2, borderColor: '#10B981' }}
                >
                  <Text style={{ fontSize: 46 }}>✅</Text>
                </View>

                <Text className="text-2xl font-bold mb-2" style={{ color: theme.textPrimary }}>Message Sent!</Text>
                <Text className="text-sm text-center leading-6 mb-1" style={{ color: theme.textSecondary }}>
                  Your email app opened with your message ready to send.
                </Text>
                <Text className="text-sm text-center leading-6 mb-6" style={{ color: theme.textSecondary }}>
                  We'll respond within{' '}
                  <Text className="font-bold" style={{ color: '#10B981' }}>24 hours</Text>. 🙏
                </Text>

                {/* What happens next */}
                <View className="w-full rounded-2xl p-4 mb-5 border" style={{ backgroundColor: theme.bgAccent, borderColor: theme.border }}>
                  <Text className="text-xs font-bold mb-3" style={{ color: theme.textMuted }}>WHAT HAPPENS NEXT</Text>
                  {[
                    ['1️⃣', 'Our team reviews your message'],
                    ['2️⃣', 'We investigate the issue'],
                    ['3️⃣', 'You receive a reply via email'],
                  ].map(([num, step]) => (
                    <View key={step} className="flex-row items-center gap-3 mb-2">
                      <Text style={{ fontSize: 16 }}>{num}</Text>
                      <Text className="text-sm" style={{ color: theme.textSecondary }}>{step}</Text>
                    </View>
                  ))}
                </View>

                <View className="w-full gap-3">
                  <TouchableOpacity
                    className="py-4 rounded-2xl items-center"
                    style={{ backgroundColor: theme.purple, shadowColor: theme.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                  >
                    <Text className="text-white font-bold text-base">← Back to Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-4 rounded-2xl items-center border"
                    style={{ borderColor: theme.border }}
                    onPress={resetForm}
                    activeOpacity={0.8}
                  >
                    <Text className="text-sm font-semibold" style={{ color: theme.textSecondary }}>📝 Send Another Message</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

            ) : (
              <>
                {/* ╔══ QUICK CONTACT ═════════════════════════════════╗ */}
                <Text className="text-[11px] font-bold tracking-[1.5px] mx-5 mt-5 mb-3" style={{ color: theme.textMuted }}>REACH US DIRECTLY</Text>
                <View className="flex-row gap-2.5 mx-4 mb-5">
                  <QuickCard icon="📧" title="Email" subtitle="emanidon123@gmail.com" badge="Recommended" color="#10B981"
                    onPress={() => Linking.openURL('mailto:emanidon123@gmail.com')} theme={theme} />
                  {/* <QuickCard icon="💬" title="WhatsApp" subtitle="+91 98765 43210" badge="Fast reply" color="#25D366"
                    onPress={() => Linking.openURL('https://wa.me/919876543210?text=Hi, I need help with AIMind')} theme={theme} />
                  <QuickCard icon="🌐" title="Website" subtitle="aimind.app/help" badge={null} color={theme.purple}
                    onPress={() => Linking.openURL('https://aimind.app/help')} theme={theme} /> */}
                </View>

                {/* ── Response time ─────────────────────────────────── */}
                <View className="mx-4 mb-5 rounded-2xl p-4 flex-row items-center gap-3 border" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                  <Text style={{ fontSize: 26 }}>⏱️</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold mb-1.5" style={{ color: theme.textPrimary }}>Typical Response Time</Text>
                    <View className="flex-row gap-5">
                      {[['📧', '< 24 hrs'], ['💬', '< 2 hrs']].map(([ico, t]) => (
                        <View key={t} className="flex-row items-center gap-1.5">
                          <Text style={{ fontSize: 13 }}>{ico}</Text>
                          <Text className="text-xs font-bold" style={{ color: theme.purpleLight }}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {/* Online dot */}
                  <View className="items-center gap-1">
                    <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                    <Text className="text-[10px] font-semibold" style={{ color: '#10B981' }}>Online</Text>
                  </View>
                </View>

                {/* ╔══ FORM ══════════════════════════════════════════╗ */}
                <Text className="text-[11px] font-bold tracking-[1.5px] mx-5 mb-3" style={{ color: theme.textMuted }}>SEND A MESSAGE</Text>
                <View className="mx-4 rounded-2xl border mb-5" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
                  <View className="p-4 gap-5">

                    {/* Category */}
                    <View>
                      <Text className="text-xs font-bold mb-2.5" style={{ color: theme.textMuted }}>ISSUE TYPE</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {CATEGORIES.map((cat) => (
                          <TouchableOpacity
                            key={cat.id}
                            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border"
                            style={{
                              backgroundColor: category === cat.id ? theme.purple : theme.bgInput,
                              borderColor: category === cat.id ? theme.purple : theme.border,
                            }}
                            onPress={() => setCategory(cat.id)}
                          >
                            <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                            <Text className="text-xs font-semibold" style={{ color: category === cat.id ? '#fff' : theme.textSecondary }}>
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Subject */}
                    <View>
                      <Text className="text-xs font-bold mb-2" style={{ color: theme.textMuted }}>
                        SUBJECT <Text style={{ color: '#EF4444' }}>*</Text>
                      </Text>
                      <TextInput
                        className="rounded-xl px-4 py-3 text-sm border"
                        style={inputStyle}
                        placeholder="Brief description of your issue..."
                        placeholderTextColor={theme.textMuted}
                        value={subject}
                        onChangeText={setSubject}
                        maxLength={100}
                      />
                    </View>

                    {/* Message */}
                    <View>
                      <Text className="text-xs font-bold mb-2" style={{ color: theme.textMuted }}>
                        MESSAGE <Text style={{ color: '#EF4444' }}>*</Text>
                      </Text>
                      <TextInput
                        className="rounded-xl px-4 py-3 text-sm border"
                        style={[inputStyle, { height: 130, textAlignVertical: 'top' }]}
                        placeholder="Describe your issue in detail. What happened? What did you expect?"
                        placeholderTextColor={theme.textMuted}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        maxLength={1000}
                      />
                      <Text className="text-[10px] mt-1 text-right" style={{ color: theme.textDim }}>{message.length}/1000</Text>
                    </View>

                    {/* Optional Email */}
                    <View>
                      <Text className="text-xs font-bold mb-2" style={{ color: theme.textMuted }}>
                        YOUR EMAIL <Text style={{ color: theme.textDim }}>(optional — for direct reply)</Text>
                      </Text>
                      <TextInput
                        className="rounded-xl px-4 py-3 text-sm border"
                        style={inputStyle}
                        placeholder="your@email.com"
                        placeholderTextColor={theme.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        maxLength={100}
                      />
                    </View>

                    {/* Device info pills */}
                    <View>
                      <Text className="text-xs font-bold mb-2" style={{ color: theme.textMuted }}>AUTO-INCLUDED IN REPORT</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {[
                          ['📱', 'AIMind v1.0.0'],
                          ['📋', Platform.OS === 'ios' ? 'iOS' : 'Android'],
                          ['🤖', 'Groq AI'],
                        ].map(([ico, lbl]) => (
                          <View key={lbl} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ backgroundColor: theme.bgAccent, borderColor: theme.border }}>
                            <Text style={{ fontSize: 12 }}>{ico}</Text>
                            <Text className="text-xs font-medium" style={{ color: theme.textSecondary }}>{lbl}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Divider */}
                  <View className="h-px" style={{ backgroundColor: theme.border }} />

                  {/* Submit */}
                  <TouchableOpacity
                    className="m-4 py-4 rounded-2xl items-center"
                    style={{
                      backgroundColor: (!subject.trim() || !message.trim() || sending) ? theme.bgAccent : theme.purple,
                      shadowColor: theme.purple,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: (!subject.trim() || !message.trim()) ? 0 : 0.4,
                      shadowRadius: 12,
                      elevation: (!subject.trim() || !message.trim()) ? 0 : 8,
                      opacity: sending ? 0.7 : 1,
                    }}
                    onPress={handleSend}
                    disabled={sending || !subject.trim() || !message.trim()}
                    activeOpacity={0.85}
                  >
                    <Text className="text-base font-bold" style={{ color: (!subject.trim() || !message.trim()) ? theme.textMuted : '#fff' }}>
                      {sending ? '⏳ Opening Email App...' : '📤 Send Message'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-xs text-center mb-10 px-8 leading-5" style={{ color: theme.textDim }}>
                  We read every message and take all feedback seriously.{'\n'}
                  Thank you for helping improve AIMind! 🙏
                </Text>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}