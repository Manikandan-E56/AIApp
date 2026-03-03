import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const AI_TIPS = [
  { title: '🌅 Good Morning!', body: 'Start your day right — ask AI anything you need help with today!' },
  { title: '💡 Did you know?', body: 'You can speak in Tamil, Hindi or any language and AI replies back!' },
  { title: '🖼️ Try Image Analysis!', body: 'Take a photo and let AI describe, read text, or identify objects!' },
  { title: '🎤 Voice Mode is here!', body: 'Tap the mic in chat — speak your question for instant answers!' },
  { title: '✍️ Need writing help?', body: 'Ask AI to write emails, messages, essays or anything for you!' },
  { title: '🌍 Multilingual AI!', body: 'Type in any language — your AI replies in the same language!' },
  { title: '🧠 Stuck on something?', body: 'Your AI assistant is ready to help solve any problem. Just ask!' },
  { title: '⚡ Quick tip!', body: 'Use the quick prompts on the home screen for instant ideas!' },
  { title: '🌙 Still working hard?', body: 'Take a break! Ask AI a fun question or a quick joke 😄' },
  { title: '🔥 Stay productive!', body: 'Your AI assistant is always ready. What will you create today?' },
  { title: '📖 Learning something?', body: 'Ask AI to explain any topic in simple words — it loves teaching!' },
  { title: '🤖 AI is waiting!', body: "You haven't chatted in a while. Come say hello to your AI assistant!" },
];

const STORAGE_KEY = 'notifSettings';
const AUTO_KEY    = 'autoNotifScheduled';

const randomTip = () => AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)];

// ── Request Permission ────────────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AIMind Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
      sound: 'default',
    });
  }
  return true;
};

// ── AUTO: Every 4 Hours ───────────────────────────────────────────────────────
// Called on app start. Skipped if user already set a manual schedule.
export const scheduleAutoNotifications = async () => {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    // Don't override manual schedule
    const settings = await loadNotifSettings();
    if (settings.enabled) return false;

    // Already scheduled — skip
    const already = await AsyncStorage.getItem(AUTO_KEY);
    if (already === 'true') return true;

    await Notifications.cancelAllScheduledNotificationsAsync();

    // 4 fixed daily times = every 4 hours
    const times = [
      { hour: 8,  minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 16, minute: 0 },
      { hour: 20, minute: 0 },
    ];

    for (const t of times) {
      const tip = randomTip();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: tip.title,
          body: tip.body,
          sound: 'default',
          data: { screen: 'Chat' },
        },
        trigger: { type: 'daily', hour: t.hour, minute: t.minute },
      });
    }

    await AsyncStorage.setItem(AUTO_KEY, 'true');
    return true;
  } catch (e) {
    console.error('Auto notification error:', e);
    return false;
  }
};

// ── MANUAL: Daily at user's chosen time ──────────────────────────────────────
export const scheduleDailyNotifications = async (hour = 9, minute = 0, model = '') => {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    // Cancel auto + any previous manual
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(AUTO_KEY); // Auto is now replaced

    const tip = randomTip();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: tip.title,
        body: tip.body,
        sound: 'default',
        data: { screen: 'Chat', model },
      },
      trigger: { type: 'daily', hour, minute },
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      enabled: true, hour, minute, model,
      scheduledAt: new Date().toISOString(),
    }));

    return true;
  } catch (e) {
    console.error('Notification schedule error:', e);
    return false;
  }
};

// ── Cancel All ────────────────────────────────────────────────────────────────
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: false }));
  await AsyncStorage.removeItem(AUTO_KEY);
};

// ── Test Notification (shows in 3s) ──────────────────────────────────────────
export const sendTestNotification = async () => {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🤖 AIMind is ready!',
      body: 'Your AI assistant is here. Tap to start chatting!',
      sound: 'default',
      data: { screen: 'Chat' },
    },
    trigger: { type: 'timeInterval', seconds: 3 },
  });
  return true;
};

// ── Load Settings ─────────────────────────────────────────────────────────────
export const loadNotifSettings = async () => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { enabled: false, hour: 9, minute: 0, model: '' };
};

// ── Is Auto Active? ───────────────────────────────────────────────────────────
export const isAutoNotifActive = async () => {
  const val = await AsyncStorage.getItem(AUTO_KEY);
  return val === 'true';
};

// ── Notification Tap Listener ─────────────────────────────────────────────────
export const setupNotificationListeners = (navigation) => {
  const foreground = Notifications.addNotificationReceivedListener(() => {});
  const tap = Notifications.addNotificationResponseReceivedListener((res) => {
    const screen = res.notification.request.content.data?.screen;
    if (screen && navigation) navigation.navigate(screen);
  });
  return () => { foreground.remove(); tap.remove(); };
};