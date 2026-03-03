import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Switch, Alert, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../Context/ThemeContext';

const MenuItem = ({ icon, label, value, onPress, isSwitch, switchValue, onToggle, danger, theme }) => (
  <TouchableOpacity
    style={[styles.menuItem, { borderBottomColor: theme.border }]}
    onPress={onPress}
    activeOpacity={isSwitch ? 1 : 0.7}
    disabled={isSwitch && !onPress}
  >
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={[styles.menuLabel, { color: danger ? theme.red : theme.textPrimary }]}>{label}</Text>
    {isSwitch
      ? <Switch value={switchValue} onValueChange={onToggle} trackColor={{ false: theme.border, true: theme.purple }} thumbColor={switchValue ? theme.purpleLight : theme.textMuted} />
      : value
        ? <Text style={[styles.menuValue, { color: theme.textMuted }]}>{value}</Text>
        : <Text style={[styles.menuArrow, { color: danger ? theme.red : theme.textMuted }]}>›</Text>
    }
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [chatCount, setChatCount] = useState(0);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('chatHistory').then((data) => {
      const history = JSON.parse(data || '[]');
      setChatCount(history.length);
    });
  }, []);

  const handleClearHistory = () => {
    Alert.alert('Clear All History', 'This will delete all your conversations permanently.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('chatHistory');
        setChatCount(0);
        Alert.alert('Done', 'Chat history cleared!');
      }},
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: theme.purpleLight }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Profile & Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarRing, { borderColor: theme.purple, shadowColor: theme.purple }]}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.bgAccent }]}>
              <Text style={styles.avatarEmoji}>🧑</Text>
            </View>
          </View>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>AI User</Text>
          <Text style={[styles.userEmail, { color: theme.textMuted }]}>user@example.com</Text>
          <View style={[styles.planBadge, { backgroundColor: theme.bgAccent, borderColor: theme.borderAccent }]}>
            <Text style={[styles.planText, { color: theme.purpleLight }]}>✦ Free Plan</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          {[['💬', chatCount.toString(), 'Chats'], ['🤖', 'Groq', 'AI Model'], ['⚡', 'Fast', 'Speed']].map(([icon, val, label]) => (
            <View key={label} style={styles.statBox}>
              <Text style={styles.statIcon}>{icon}</Text>
              <Text style={[styles.statVal, { color: theme.purpleLight }]}>{val}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Preferences */}
        <Text style={[styles.section, { color: theme.textMuted }]}>PREFERENCES</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <MenuItem icon={isDark ? '☀️' : '🌙'} label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} isSwitch switchValue={isDark} onToggle={toggleTheme} theme={theme} />
          <MenuItem icon="🔔" label="Notifications" isSwitch switchValue={notifications} onToggle={setNotifications} theme={theme} />
          <MenuItem icon="💾" label="Auto-save Chats" isSwitch switchValue={autoSave} onToggle={setAutoSave} theme={theme} />
        </View>

        {/* App */}
        <Text style={[styles.section, { color: theme.textMuted }]}>APP</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <MenuItem icon="🔔" label="Notifications" onPress={() => navigation.navigate('Notifications')} theme={theme} />
          <MenuItem icon="🗂️" label="Chat History" value={`${chatCount} chats`} onPress={() => navigation.navigate('History')} theme={theme} />
          <MenuItem icon="📊" label="App Version" value="1.0.0" theme={theme} />
        </View>

        {/* Support */}
        <Text style={[styles.section, { color: theme.textMuted }]}>SUPPORT</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <MenuItem icon="🛟" label="Help & Support" onPress={() => navigation.navigate('Support')} theme={theme} />
          <MenuItem icon="⭐" label="Rate the App" onPress={() => Alert.alert('Thank you!', 'Rating coming soon.')} theme={theme} />
          <MenuItem icon="📩" label="Contact Support" onPress={() => navigation.navigate('ContactSupport')} theme={theme} />
          <MenuItem icon="📄" label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} theme={theme} />
        </View>

        {/* Danger */}
        <Text style={[styles.section, { color: theme.textMuted }]}>DANGER ZONE</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <MenuItem icon="🗑️" label="Clear All History" onPress={handleClearHistory} danger theme={theme} />
        </View>

        {/* Upgrade Banner */}
        {/* <TouchableOpacity style={[styles.upgradeBanner, { backgroundColor: theme.bgAccent, borderColor: theme.borderAccent }]} activeOpacity={0.85}>
          <View>
            <Text style={[styles.upgradeTitle, { color: theme.textPrimary }]}>✨ Upgrade to Pro</Text>
            <Text style={[styles.upgradeSubtitle, { color: theme.textSecondary }]}>Unlimited chats · Priority AI · No limits</Text>
          </View>
          <Text style={[styles.upgradePrice, { color: theme.purpleLight }]}>$5/mo →</Text>
        </TouchableOpacity> */}

        <Text style={[styles.footer, { color: theme.textDim }]}>Made with ❤️ using React Native & Groq AI</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8, width: 60 },
  backIcon: { fontSize: 22, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  profileCard: { alignItems: 'center', paddingVertical: 32 },
  avatarRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  avatarCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 38 },
  userName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  planBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  planText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 16, padding: 16, justifyContent: 'space-around', marginBottom: 24, borderWidth: 1 },
  statBox: { alignItems: 'center' },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 3 },
  section: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginHorizontal: 20, marginBottom: 8, marginTop: 8 },
  menuGroup: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 8, borderWidth: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  menuIcon: { fontSize: 20, width: 32 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  menuValue: { fontSize: 13 },
  menuArrow: { fontSize: 22 },
  upgradeBanner: { margin: 16, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  upgradeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  upgradeSubtitle: { fontSize: 12 },
  upgradePrice: { fontSize: 16, fontWeight: '700' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});