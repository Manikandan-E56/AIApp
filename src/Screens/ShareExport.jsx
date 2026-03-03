import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Alert, Share, ActivityIndicator,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

export default function ShareExportScreen({ navigation, route }) {
  const { messages = [] } = route?.params || {};
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('share'); // share | export

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Helper: safely get message text regardless of field name
  const getText = (m) => m.text ?? m.content ?? m.message ?? '';

  // ── Share as Plain Text ────────────────────────────────────────────────────
  const shareAsText = async () => {
    try {
      const chatText = messages
        .map((m) => `${m.role === 'user' ? '👤 You' : '🤖 AI'}: ${getText(m)}`)
        .join('\n\n');

      await Share.share({
        message: `💬 AI Chat — ${formattedDate}\n\n${chatText}\n\n— Shared from AIMind App`,
        title: 'AI Chat Conversation',
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // ── Export as .txt File ────────────────────────────────────────────────────
  const exportAsTxt = async () => {
    setLoading(true);
    try {
      const chatText = messages
        .map((m) => {
          const time = m.timestamp
            ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--';
          return `[${time}] ${m.role === 'user' ? 'You' : 'AI Assistant'}:\n${getText(m)}`;
        })
        .join('\n\n─────────────────────\n\n');

      const content = `AIMind Chat Export\nDate: ${formattedDate}\n${'═'.repeat(40)}\n\n${chatText}\n\n${'═'.repeat(40)}\nExported from AIMind App`;

      const fileName = `AIMind_Chat_${Date.now()}.txt`;
      const file = new File(Paths.document, fileName);
      await file.write(content);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Chat as TXT',
        });
      } else {
        Alert.alert('Saved!', `Chat saved to:\n${file.uri}`);
      }
    } catch (e) {
      Alert.alert('Export Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Copy to Clipboard ──────────────────────────────────────────────────────
  const copyToClipboard = async () => {
    try {
      const chatText = messages
        .map((m) => `${m.role === 'user' ? 'You' : 'AI'}: ${getText(m)}`)
        .join('\n\n');
      await Clipboard.setStringAsync(chatText);
      Alert.alert('✅ Copied!', 'Chat copied to clipboard!');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* Header */}
      <View className="flex-row items-center px-4 pt-14 pb-4 border-b border-[#1F1F2E]">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2">
          <Text className="text-[#A78BFA] text-2xl font-semibold">←</Text>
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-[#F5F3FF] text-lg font-bold">Share & Export</Text>
          <Text className="text-[#6B7280] text-xs mt-0.5">{messages.length} messages</Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Tabs */}
      <View className="flex-row mx-4 mt-4 bg-[#111118] rounded-2xl p-1 border border-[#1F1F2E]">
        {['share', 'export'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === tab ? 'bg-[#7C3AED]' : ''}`}
          >
            <Text className={`font-semibold text-sm ${activeTab === tab ? 'text-white' : 'text-[#6B7280]'}`}>
              {tab === 'share' ? '📤 Share' : '💾 Export'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Chat Preview Card */}
        <View className="mx-4 mt-4 bg-[#111118] rounded-2xl p-4 border border-[#1F1F2E]">
          {/* Preview Header */}
          <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-[#1F1F2E]">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">🤖</Text>
              <View>
                <Text className="text-[#F5F3FF] font-bold text-sm">AIMind Chat</Text>
                <Text className="text-[#6B7280] text-xs">{formattedDate}</Text>
              </View>
            </View>
            <View className="bg-[#1E1030] px-3 py-1 rounded-full border border-[#6D28D9]">
              <Text className="text-[#A78BFA] text-xs font-semibold">✦ AI</Text>
            </View>
          </View>

          {/* Messages Preview (last 4) */}
          {messages.slice(-4).map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <View key={i} className={`flex-row mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[80%] rounded-2xl px-3 py-2 ${isUser ? 'bg-[#7C3AED]' : 'bg-[#1A1A26]'}`}>
                  <Text className={`text-xs ${isUser ? 'text-white' : 'text-[#E5E7EB]'}`} numberOfLines={3}>
                    {getText(msg)}
                  </Text>
                </View>
              </View>
            );
          })}

          {messages.length > 4 && (
            <Text className="text-[#4B5563] text-xs text-center mt-1">
              +{messages.length - 4} more messages
            </Text>
          )}

          {/* Footer watermark */}
          <View className="mt-3 pt-3 border-t border-[#1F1F2E] items-center">
            <Text className="text-[#374151] text-xs">Shared from AIMind App 🤖</Text>
          </View>
        </View>

        {/* SHARE TAB */}
        {activeTab === 'share' && (
          <View className="mx-4 mt-4 gap-3">
            <Text className="text-[#6B7280] text-xs font-bold tracking-widest uppercase mb-1">
              Share Options
            </Text>

            {/* Share as Text */}
            <TouchableOpacity
              onPress={shareAsText}
              className="flex-row items-center bg-[#111118] rounded-2xl p-4 border border-[#1F1F2E]"
              activeOpacity={0.75}
            >
              <View className="w-12 h-12 rounded-2xl bg-[#1E1030] items-center justify-center mr-4">
                <Text className="text-2xl">💬</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#F5F3FF] font-bold text-sm">Share as Text</Text>
                <Text className="text-[#6B7280] text-xs mt-0.5">Send via WhatsApp, Telegram, SMS & more</Text>
              </View>
              <Text className="text-[#4B5563] text-xl">›</Text>
            </TouchableOpacity>

            {/* Copy to Clipboard */}
            <TouchableOpacity
              onPress={copyToClipboard}
              className="flex-row items-center bg-[#111118] rounded-2xl p-4 border border-[#1F1F2E]"
              activeOpacity={0.75}
            >
              <View className="w-12 h-12 rounded-2xl bg-[#1E1030] items-center justify-center mr-4">
                <Text className="text-2xl">📋</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#F5F3FF] font-bold text-sm">Copy to Clipboard</Text>
                <Text className="text-[#6B7280] text-xs mt-0.5">Copy entire conversation as text</Text>
              </View>
              <Text className="text-[#4B5563] text-xl">›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <View className="mx-4 mt-4 gap-3">
            <Text className="text-[#6B7280] text-xs font-bold tracking-widest uppercase mb-1">
              Export Options
            </Text>

            {/* Export TXT */}
            <TouchableOpacity
              onPress={exportAsTxt}
              disabled={loading}
              className="flex-row items-center bg-[#111118] rounded-2xl p-4 border border-[#1F1F2E]"
              activeOpacity={0.75}
            >
              <View className="w-12 h-12 rounded-2xl bg-[#1E1030] items-center justify-center mr-4">
                <Text className="text-2xl">📄</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#F5F3FF] font-bold text-sm">Export as .TXT</Text>
                <Text className="text-[#6B7280] text-xs mt-0.5">Save full conversation as text file</Text>
              </View>
              {loading ? <ActivityIndicator size="small" color="#A78BFA" /> : <Text className="text-[#4B5563] text-xl">›</Text>}
            </TouchableOpacity>

            {/* Stats card */}
            <View className="bg-[#111118] rounded-2xl p-4 border border-[#1F1F2E]">
              <Text className="text-[#F5F3FF] font-bold text-sm mb-3">📊 Chat Stats</Text>
              <View className="flex-row justify-around">
                {[
                  ['💬', messages.length, 'Messages'],
                  ['👤', messages.filter(m => m.role === 'user').length, 'From You'],
                  ['🤖', messages.filter(m => m.role === 'assistant').length, 'From AI'],
                ].map(([icon, val, label]) => (
                  <View key={label} className="items-center">
                    <Text className="text-xl mb-1">{icon}</Text>
                    <Text className="text-[#A78BFA] font-bold text-lg">{val}</Text>
                    <Text className="text-[#6B7280] text-xs">{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}