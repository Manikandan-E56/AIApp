import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { useTheme } from '../../Context/ThemeContext';
import {
  scheduleDailyNotifications,
  cancelAllNotifications,
  sendTestNotification,
  loadNotifSettings,
  requestNotificationPermission,
  isAutoNotifActive,
} from '../services/NotificationService.js';

const AVAILABLE_MODELS = ['Gemini', 'GPT-4', 'Claude'];

// ── Time & Model Picker ───────────────────────────────────────────────────────
const TimeAndModelPicker = ({ hour, minute, selectedModel, onTimeChange, onModelChange, theme }) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const isPM = hour >= 12;

  const handleHourSelect = (h12) => {
    let h24 = h12;
    if (isPM && h12 !== 12) h24 += 12;
    if (!isPM && h12 === 12) h24 = 0;
    onTimeChange(h24, minute);
  };

  const handleAmPmSelect = (selectedPM) => {
    if (selectedPM === isPM) return;
    onTimeChange(selectedPM ? (hour % 12) + 12 : hour % 12, minute);
  };

  return (
    <View className="flex-col">
      <View className="flex-row items-center justify-center gap-4 mb-6">

        {/* Hour */}
        <View className="items-center">
          <Text className="text-xs font-semibold tracking-widest mb-2" style={{ color: theme.textMuted }}>Hr</Text>
          <ScrollView className="h-[180px] w-[60px]" showsVerticalScrollIndicator={false} snapToInterval={44}>
            {hours.map((h) => (
              <TouchableOpacity
                key={`h-${h}`}
                className={`h-[44px] items-center justify-center px-3 ${displayHour === h ? 'rounded-xl' : ''}`}
                style={displayHour === h ? { backgroundColor: theme.purple } : {}}
                onPress={() => handleHourSelect(h)}
              >
                <Text className="text-xl font-semibold" style={{ color: displayHour === h ? '#fff' : theme.textSecondary }}>
                  {h.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text className="text-3xl font-extrabold mt-5" style={{ color: theme.purple }}>:</Text>

        {/* Minute */}
        <View className="items-center">
          <Text className="text-xs font-semibold tracking-widest mb-2" style={{ color: theme.textMuted }}>Min</Text>
          <ScrollView className="h-[180px] w-[60px]" showsVerticalScrollIndicator={false} snapToInterval={44}>
            {minutes.map((m) => (
              <TouchableOpacity
                key={`m-${m}`}
                className={`h-[44px] items-center justify-center px-3 ${minute === m ? 'rounded-xl' : ''}`}
                style={minute === m ? { backgroundColor: theme.purple } : {}}
                onPress={() => onTimeChange(hour, m)}
              >
                <Text className="text-xl font-semibold" style={{ color: minute === m ? '#fff' : theme.textSecondary }}>
                  {m.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AM / PM */}
        <View className="items-center justify-center gap-3 mt-5 ml-2">
          {[['AM', false], ['PM', true]].map(([label, pm]) => (
            <TouchableOpacity
              key={label}
              className="px-4 py-2.5 rounded-xl border"
              style={{ backgroundColor: isPM === pm ? theme.purple : theme.bgCard, borderColor: isPM === pm ? theme.purple : theme.border }}
              onPress={() => handleAmPmSelect(pm)}
            >
              <Text className="text-sm font-bold" style={{ color: isPM === pm ? '#fff' : theme.textSecondary }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Model Selector */}
      <View className="pt-4 border-t" style={{ borderColor: theme.border }}>
        <Text className="text-sm font-semibold mb-3" style={{ color: theme.textPrimary }}>🤖 Switch AI Model at this time:</Text>
        <View className="flex-row gap-2">
          {AVAILABLE_MODELS.map((model) => (
            <TouchableOpacity
              key={model}
              onPress={() => onModelChange(model)}
              className="flex-1 py-3 rounded-xl border items-center"
              style={{ backgroundColor: selectedModel === model ? theme.purple : theme.bgCard, borderColor: selectedModel === model ? theme.purple : theme.border }}
            >
              <Text className="font-semibold text-sm" style={{ color: selectedModel === model ? '#fff' : theme.textSecondary }}>{model}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

// ── Notification Preview Card ─────────────────────────────────────────────────
const NotifPreview = ({ theme }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <Animated.View className="rounded-2xl p-4 border-[1.5px] shadow-sm mb-2" style={{ backgroundColor: theme.bgCard, borderColor: theme.borderAccent, opacity }}>
      <View className="flex-row items-center mb-2.5 gap-2.5">
        <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: theme.bgAccent }}>
          <Text className="text-base">🤖</Text>
        </View>
        <Text className="text-xs font-medium" style={{ color: theme.textMuted }}>AIMind · now</Text>
      </View>
      <Text className="text-[15px] font-bold mb-1.5" style={{ color: theme.textPrimary }}>🌅 Time to switch!</Text>
      <Text className="text-[13px] leading-5" style={{ color: theme.textSecondary }}>Your requested AI model is now active. Start your day right!</Text>
    </Animated.View>
  );
};

// ── 🆕 Auto Schedule Banner ───────────────────────────────────────────────────
const AutoScheduleBanner = ({ autoActive, theme }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!autoActive) return;
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, [autoActive]);

  return (
    <View
      className="mx-4 mb-4 rounded-2xl p-4 border"
      style={{
        backgroundColor: autoActive ? '#0D1F16' : theme.bgCard,
        borderColor: autoActive ? '#10B981' : theme.border,
      }}
    >
      {/* Status row */}
      <View className="flex-row items-center gap-3 mb-3">
        <Animated.View
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: autoActive ? '#10B981' : theme.textDim, transform: [{ scale: pulseAnim }] }}
        />
        <Text className="font-bold text-sm flex-1" style={{ color: autoActive ? '#10B981' : theme.textPrimary }}>
          {autoActive ? 'Auto Notifications Active' : 'Auto Notifications Paused'}
        </Text>
        <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: autoActive ? '#10B98122' : theme.bgAccent }}>
          <Text className="text-xs font-bold" style={{ color: autoActive ? '#10B981' : theme.textMuted }}>
            {autoActive ? 'RUNNING' : 'OFF'}
          </Text>
        </View>
      </View>

      <Text className="text-xs leading-5 mb-3" style={{ color: autoActive ? '#6EE7B7' : theme.textMuted }}>
        {autoActive
          ? "You'll automatically receive AI tips every 4 hours. Set a custom time below to override."
          : "Auto notifications are paused because you set a custom schedule. Disable custom to re-enable auto."}
      </Text>

      {/* 4-hour timeline */}
      <View className="flex-row justify-between">
        {[['🌅', '8 AM'], ['☀️', '12 PM'], ['🌤️', '4 PM'], ['🌙', '8 PM']].map(([icon, time]) => (
          <View key={time} className="items-center gap-1">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center border"
              style={{
                backgroundColor: autoActive ? '#10B98120' : theme.bgAccent,
                borderColor: autoActive ? '#10B981' : theme.border,
              }}
            >
              <Text style={{ fontSize: 16 }}>{icon}</Text>
            </View>
            <Text className="text-[10px] font-semibold" style={{ color: autoActive ? '#6EE7B7' : theme.textMuted }}>{time}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoActive, setAutoActive] = useState(false); // 🆕

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    loadNotifSettings().then((s) => {
      setEnabled(s.enabled);
      setHour(s.hour ?? 9);
      setMinute(s.minute ?? 0);
      if (s.model) setSelectedModel(s.model);
    });
    // 🆕 Check if auto is running
    isAutoNotifActive().then(setAutoActive);
  }, [fadeAnim]);

  const formatTime = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 === 0 ? 12 : h % 12;
    return `${dh}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const handleToggle = async (val) => {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Please allow notifications in your phone settings.');
        return;
      }
    } else {
      await cancelAllNotifications();
      // 🆕 When manual is turned off, auto resumes on next app open
      setAutoActive(false);
    }
    setEnabled(val);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (enabled) {
        const success = await scheduleDailyNotifications(hour, minute, selectedModel);
        if (success) {
          setSaved(true);
          setAutoActive(false); // 🆕 Manual overrides auto
          setTimeout(() => setSaved(false), 3000);
          Alert.alert(
            '✅ Saved!',
            `${selectedModel} will notify you daily at ${formatTime(hour, minute)}.\n\nAuto (every 4hrs) has been replaced with your custom schedule.`
          );
        } else {
          Alert.alert('Error', 'Could not schedule notifications. Check permissions.');
        }
      } else {
        await cancelAllNotifications();
        Alert.alert('Notifications Off', 'Daily reminders disabled.\n\nAuto notifications (every 4hrs) will resume next time you open the app.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    const success = await sendTestNotification();
    if (success) {
      Alert.alert('📬 Sent!', 'Test notification will appear in 3 seconds. Lock your screen!');
    } else {
      Alert.alert('Error', 'Could not send test notification.');
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-[52px] pb-4 border-b" style={{ borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Text className="text-[22px] font-semibold" style={{ color: theme.purpleLight }}>←</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>Model Schedule</Text>
          <Text className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>Daily AI routines</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Hero Banner */}
          <View className="flex-row items-center m-4 rounded-2xl p-5 border gap-4" style={{ backgroundColor: theme.bgAccent, borderColor: theme.borderAccent }}>
            <Text className="text-[40px]">⏱️</Text>
            <View className="flex-1">
              <Text className="text-[17px] font-bold mb-1" style={{ color: theme.textPrimary }}>Automate Your AI</Text>
              <Text className="text-[13px] leading-5" style={{ color: theme.textSecondary }}>
                Auto-notified every 4 hours by default. Set a custom time to override!
              </Text>
            </View>
          </View>

          {/* 🆕 Auto Schedule Banner */}
          <Text className="text-[11px] font-bold tracking-[1.5px] mx-5 mb-2.5" style={{ color: theme.textMuted }}>AUTO SCHEDULE</Text>
          <AutoScheduleBanner autoActive={autoActive && !enabled} theme={theme} />

          {/* Notification Preview */}
          <Text className="text-[11px] font-bold tracking-[1.5px] mx-5 mb-2.5 mt-1.5" style={{ color: theme.textMuted }}>PREVIEW</Text>
          <View className="px-4 mb-2">
            <NotifPreview theme={theme} />
          </View>

          {/* Enable Toggle */}
          <Text className="text-[11px] font-bold tracking-[1.5px] mx-5 mb-2.5 mt-1.5" style={{ color: theme.textMuted }}>CUSTOM SCHEDULE</Text>
          <View className="mx-4 rounded-2xl p-4 border mb-3" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3.5 flex-1">
                <Text className="text-[26px]">🔔</Text>
                <View>
                  <Text className="text-base font-semibold mb-1" style={{ color: theme.textPrimary }}>Enable Custom Time</Text>
                  <Text className="text-xs" style={{ color: theme.textMuted }}>
                    {enabled
                      ? `Active: ${selectedModel} at ${formatTime(hour, minute)}`
                      : 'Auto (every 4hrs) is running'}
                  </Text>
                </View>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggle}
                trackColor={{ false: theme.border, true: theme.purple }}
                thumbColor={enabled ? theme.purpleLight : theme.textMuted}
              />
            </View>
          </View>

          {/* Time & Model Picker */}
          {enabled && (
            <View className="mx-4 rounded-2xl p-4 border mb-3" style={{ backgroundColor: theme.bgCard, borderColor: theme.border }}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>⏰ Time to switch</Text>
                <View className="px-3.5 py-1.5 rounded-full border" style={{ backgroundColor: theme.bgAccent, borderColor: theme.borderAccent }}>
                  <Text className="text-sm font-bold" style={{ color: theme.purpleLight }}>{formatTime(hour, minute)}</Text>
                </View>
              </View>
              <TimeAndModelPicker
                hour={hour}
                minute={minute}
                selectedModel={selectedModel}
                theme={theme}
                onTimeChange={(h, m) => { setHour(h); setMinute(m); }}
                onModelChange={(model) => setSelectedModel(model)}
              />
            </View>
          )}

          {/* Buttons */}
          <View className="px-4 gap-3 mt-2">
            <TouchableOpacity
              className={`py-4 rounded-2xl items-center shadow-lg ${loading ? 'opacity-70' : ''}`}
              style={{ backgroundColor: theme.purple, shadowColor: theme.purple }}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text className="text-white text-[17px] font-bold">
                {loading ? '⏳ Saving...' : saved ? '✅ Saved!' : enabled ? '💾 Save Custom Schedule' : '🔕 Keep Auto (Every 4hrs)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 rounded-2xl items-center border-[1.5px]"
              style={{ backgroundColor: theme.bgCard, borderColor: theme.borderAccent }}
              onPress={handleTest}
              activeOpacity={0.8}
            >
              <Text className="text-[15px] font-semibold" style={{ color: theme.purpleLight }}>
                📬 Send Test Notification
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-center mt-4 px-8 leading-5 mb-10" style={{ color: theme.textDim }}>
            Auto notifications fire every 4 hours by default.{'\n'}Toggle above to set your own custom time.
          </Text>

        </Animated.View>
      </ScrollView>
    </View>
  );
}