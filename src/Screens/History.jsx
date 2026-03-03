import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, Alert, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../Context/ThemeContext';

// ─── Animated History Card ───────────────────────────────────────────────────
const HistoryCard = ({ item, index, onPress, onDelete, theme }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.historyCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.cardLeft, { backgroundColor: theme.bgAccent }]}>
          <Text style={styles.chatIcon}>💬</Text>
        </View>
        
        <View style={styles.cardCenter}>
          <Text style={[styles.preview, { color: theme.textPrimary }]} numberOfLines={2}>
            {item.preview || 'Empty conversation...'}
          </Text>
          <Text style={[styles.date, { color: theme.textMuted }]}>{item.date}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.deleteBtn, { backgroundColor: theme.bg }]} 
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main History Screen ─────────────────────────────────────────────────────
export default function HistoryScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('chatHistory').then((data) => {
      setHistory(JSON.parse(data || '[]'));
      setLoading(false);
    });
  }, []));

  const deleteItem = (id) => {
    Alert.alert('Delete Chat', 'Are you sure you want to remove this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = history.filter((h) => h.id !== id);
        setHistory(updated);
        await AsyncStorage.setItem('chatHistory', JSON.stringify(updated));
      }},
    ]);
  };

  const clearAll = () => {
    Alert.alert('Clear History', 'This will permanently delete all your conversations.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: async () => {
        setHistory([]);
        await AsyncStorage.removeItem('chatHistory');
      }},
    ]);
  };

  // ─── Floating Empty State ──────────────────────────────────────────────────
  const EmptyState = () => {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])).start();
    }, []);

    return (
      <View style={styles.emptyContainer}>
        <Animated.View style={[styles.emptyIconWrapper, { transform: [{ translateY: floatAnim }] }]}>
          <Text style={styles.emptyIcon}>🗂️</Text>
        </Animated.View>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No History Yet</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Your conversations with Nexus AI will automatically be saved here.
        </Text>
        <TouchableOpacity 
          style={[styles.startBtn, { backgroundColor: theme.purple, shadowColor: theme.purple }]} 
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnText}>Start a Conversation</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: theme.bgCard }]}>
          <Text style={[styles.headerIcon, { color: theme.textPrimary }]}>❮</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>History</Text>
          {history.length > 0 && (
            <Text style={[styles.countText, { color: theme.purpleLight }]}>
              {history.length} Saved
            </Text>
          )}
        </View>

        {history.length > 0 ? (
          <TouchableOpacity onPress={clearAll} style={[styles.clearBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 42 }} /> // Placeholder to balance flex header
        )}
      </View>

      {/* Content List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <HistoryCard 
            item={item} 
            index={index} 
            theme={theme}
            onPress={() => navigation.navigate('Chat', { messages: item.messages })}
            onDelete={() => deleteItem(item.id)}
          />
        )}
        contentContainerStyle={[styles.list, history.length === 0 && { flex: 1, justifyContent: 'center' }]}
        ListEmptyComponent={!loading ? <EmptyState /> : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 16 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  countText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  clearBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  clearBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '700' },

  // List
  list: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  
  // Card
  historyCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardLeft: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  chatIcon: { fontSize: 20 },
  cardCenter: { flex: 1, paddingRight: 10 },
  preview: { fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 6 },
  date: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  // Delete Button
  deleteBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  deleteIcon: { fontSize: 16, opacity: 0.8 },

  // Empty State
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyIconWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(139, 92, 246, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 36, paddingHorizontal: 20 },
  startBtn: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 24, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});