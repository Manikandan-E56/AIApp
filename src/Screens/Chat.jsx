import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Animated,
  Alert,
  ScrollView,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { sendMessageStream, detectLanguage } from '../services/groqAPI';

const LANG_FLAGS = {
  English: '🇬🇧',
  Tamil: '🇮🇳',
  Hindi: '🇮🇳',
  Telugu: '🇮🇳',
  Malayalam: '🇮🇳',
  Kannada: '🇮🇳',
  French: '🇫🇷',
  Spanish: '🇪🇸',
  German: '🇩🇪',
  Japanese: '🇯🇵',
  Chinese: '🇨🇳',
  Arabic: '🇸🇦',
  Korean: '🇰🇷',
  Portuguese: '🇵🇹',
  Italian: '🇮🇹',
};

const LANG_LABELS = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'React JSX',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  py: 'Python',
  python: 'Python',
  java: 'Java',
  kotlin: 'Kotlin',
  swift: 'Swift',
  dart: 'Dart',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  sql: 'SQL',
  bash: 'Bash',
  sh: 'Shell',
  cpp: 'C++',
  c: 'C',
  cs: 'C#',
  go: 'Go',
  rust: 'Rust',
  rb: 'Ruby',
};

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 CODE BLOCK COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const CodeBlock = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const label = LANG_LABELS[lang?.toLowerCase()] || lang || 'Code';

  const handleCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="my-2 overflow-hidden rounded-xl" style={{ backgroundColor: '#0D1117' }}>
      <View
        className="flex-row items-center justify-between px-3 py-2"
        style={{ backgroundColor: '#161B22', borderBottomWidth: 1, borderBottomColor: '#30363D' }}>
        <View className="flex-row items-center gap-1.5">
          <View className="h-3 w-3 rounded-full" style={{ backgroundColor: '#FF5F57' }} />
          <View className="h-3 w-3 rounded-full" style={{ backgroundColor: '#FEBC2E' }} />
          <View className="h-3 w-3 rounded-full" style={{ backgroundColor: '#28C840' }} />
          <Text className="ml-2 text-xs font-semibold" style={{ color: '#8B949E' }}>
            {label}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleCopy}
          className="flex-row items-center gap-1 rounded-md px-2 py-1"
          style={{ backgroundColor: copied ? '#1F4C2D' : '#21262D' }}>
          <Text className="text-xs font-semibold" style={{ color: copied ? '#3FB950' : '#8B949E' }}>
            {copied ? '✓ Copied' : '⎘ Copy'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text
          className="p-4 text-sm leading-6"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#E6EDF3' }}
          selectable>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📝 INLINE TEXT RENDERER
// ─────────────────────────────────────────────────────────────────────────────
const InlineText = ({ text, style }) => {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) });
    const raw = match[0];
    if (raw.startsWith('**')) {
      parts.push({ type: 'bold', value: raw.slice(2, -2) });
    } else if (raw.startsWith('`')) {
      parts.push({ type: 'inline_code', value: raw.slice(1, -1) });
    }
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.type === 'bold')
          return (
            <Text key={i} style={{ fontWeight: '700' }}>
              {part.value}
            </Text>
          );
        if (part.type === 'inline_code')
          return (
            <Text
              key={i}
              style={{
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                backgroundColor: '#1E1E2E',
                color: '#C9A9FF',
                fontSize: 13,
              }}>
              {' '}
              {part.value}{' '}
            </Text>
          );
        return <Text key={i}>{part.value}</Text>;
      })}
    </Text>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧠 RICH MESSAGE RENDERER
// ─────────────────────────────────────────────────────────────────────────────
const RichMessage = ({ text, isUser, isStreaming }) => {
  if (isUser) {
    return (
      <Text className="text-[18px] leading-7" style={{ color: '#fff' }}>
        {text}
        {isStreaming && <Text style={{ color: '#C9A9FF' }}>▋</Text>}
      </Text>
    );
  }

  const blocks = [];
  const lines = text.split('\n');
  let i = 0;
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: [...listItems] });
      listItems = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith('```')) {
      flushList();
      const lang = line.replace(/```/, '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      i++;
      continue;
    }

    if (/^#{1}\s/.test(line)) {
      flushList();
      blocks.push({ type: 'h1', text: line.replace(/^#+\s/, '') });
      i++;
      continue;
    }

    if (/^#{2,3}\s/.test(line)) {
      flushList();
      blocks.push({ type: 'h2', text: line.replace(/^#+\s/, '') });
      i++;
      continue;
    }

    if (/^[-*•]\s/.test(line)) {
      listItems.push({ type: 'bullet', text: line.replace(/^[-*•]\s/, '') });
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      listItems.push({ type: 'numbered', text: line.replace(/^\d+\.\s/, ''), num });
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushList();
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (line.trim() === '') {
      flushList();
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'spacer') {
        blocks.push({ type: 'spacer' });
      }
      i++;
      continue;
    }

    flushList();
    blocks.push({ type: 'paragraph', text: line });
    i++;
  }

  flushList();

  const aiTextColor = { color: '#E5E7EB' };

  return (
    <View>
      {blocks.map((block, idx) => {
        if (block.type === 'code')
          return <CodeBlock key={idx} code={block.code} lang={block.lang} />;
        if (block.type === 'h1')
          return (
            <Text key={idx} className="mb-1 mt-2 text-lg font-bold" style={{ color: '#F5F3FF' }}>
              {block.text}
            </Text>
          );
        if (block.type === 'h2')
          return (
            <Text
              key={idx}
              className="mb-0.5 mt-2 text-base font-bold"
              style={{ color: '#D8B4FE' }}>
              {block.text}
            </Text>
          );
        if (block.type === 'list')
          return (
            <View key={idx} className="my-1 gap-1">
              {block.items.map((item, j) => (
                <View key={j} className="flex-row items-start gap-2">
                  <Text
                    className="mt-0.5 text-sm font-bold"
                    style={{ color: '#A78BFA', minWidth: 16 }}>
                    {item.type === 'numbered' ? `${item.num}.` : '•'}
                  </Text>
                  <InlineText
                    text={item.text}
                    style={{ flex: 1, fontSize: 14, lineHeight: 21, ...aiTextColor }}
                  />
                </View>
              ))}
            </View>
          );
        if (block.type === 'hr')
          return <View key={idx} className="my-2 h-px" style={{ backgroundColor: '#2D2D3D' }} />;
        if (block.type === 'spacer') return <View key={idx} className="h-2" />;
        if (block.type === 'paragraph')
          return (
            <InlineText
              key={idx}
              text={block.text}
              style={{ fontSize: 15, lineHeight: 23, ...aiTextColor }}
            />
          );
        return null;
      })}
      {isStreaming && <Text style={{ color: '#A78BFA', fontSize: 15 }}>▋</Text>}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 💬 TYPING INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
const TypingIndicator = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    dots.forEach((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            delay: i * 150,
            useNativeDriver: true,
          }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(300),
        ])
      ).start()
    );
  }, []);
  return (
    <View className="flex-row items-center gap-1.5 p-4">
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: '#7C3AED', transform: [{ translateY: dot }] }}
        />
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 💬 MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────
const MessageBubble = ({ item, onSpeak, isSpeaking, speakingId, isStreaming }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const isUser = item.role === 'user';
  const isThisSpeaking = isSpeaking && speakingId === item.id;
  const isThisStreaming = isStreaming && item.streaming;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      className={`mb-4 flex-row items-end ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View
        className={`rounded-2xl px-4 py-3 ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
        style={{
          maxWidth: '82%',
          backgroundColor: isUser ? '#7C3AED' : '#111118',
          borderWidth: isUser ? 0 : 1,
          borderColor: '#1F1F2E',
        }}>
        <RichMessage text={item.text} isUser={isUser} isStreaming={isThisStreaming} />

        {/* Speak button for AI messages only */}
        {!isUser && !isThisStreaming && (
          <View className="mt-2 flex-row justify-end">
            <TouchableOpacity onPress={() => onSpeak(item)}>
              <Text className="text-sm">{isThisSpeaking ? '⏹️' : '🔊'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🏠 MAIN CHAT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function Chat({ navigation, route }) {
  const [messages, setMessages] = useState(
    route?.params?.messages || [
      {
        id: '0',
        role: 'assistant',
        timestamp: Date.now(),
        text: "Hi! I'm your **AI Assistant** 🤖\n\nType or speak in **ANY language**!\n\n## What I can do:\n- Answer any question\n- Write and explain **code**\n- Translate languages\n- Analyze images\n\nTap 🔊 to enable **Real-time Speaking**!",
      },
    ]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [detectedLang, setDetectedLang] = useState('English');
  const [realtimeSpeak, setRealtimeSpeak] = useState(false);

  const shouldStopRef = useRef(false);
  const wordQueueRef = useRef([]);
  const isSpeakingWordRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const speakBtnAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);

  useEffect(() => {
    if (route?.params?.prompt && !route?.params?.messages) handleSend(route.params.prompt);
    return () => {
      Speech.stop();
      shouldStopRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else pulseAnim.setValue(1);
  }, [isRecording]);

  useEffect(() => {
    if (realtimeSpeak && isStreaming) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(speakBtnAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(speakBtnAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else speakBtnAnim.setValue(1);
  }, [realtimeSpeak, isStreaming]);

  const processWordQueue = useCallback(() => {
    if (isSpeakingWordRef.current || wordQueueRef.current.length === 0) return;
    if (shouldStopRef.current) {
      wordQueueRef.current = [];
      return;
    }
    const word = wordQueueRef.current.shift();
    isSpeakingWordRef.current = true;
    Speech.speak(word, {
      language: 'en-US',
      rate: 1.1,
      pitch: 1.0,
      onDone: () => {
        isSpeakingWordRef.current = false;
        processWordQueue();
      },
      onError: () => {
        isSpeakingWordRef.current = false;
        processWordQueue();
      },
    });
  }, []);

  const enqueueWord = useCallback(
    (word) => {
      if (!realtimeSpeak || shouldStopRef.current) return;
      const cleaned = word.replace(/[*_~`#]/g, '').trim();
      if (!cleaned) return;
      wordQueueRef.current.push(cleaned);
      processWordQueue();
    },
    [realtimeSpeak, processWordQueue]
  );

  const stopAllSpeech = () => {
    shouldStopRef.current = true;
    wordQueueRef.current = [];
    isSpeakingWordRef.current = false;
    Speech.stop();
    setIsSpeaking(false);
    setSpeakingId(null);
  };

  const toggleRealtimeSpeak = () => {
    if (realtimeSpeak) stopAllSpeech();
    setRealtimeSpeak((prev) => !prev);
  };

  const handleSend = async (customText) => {
    const text = customText || input.trim();
    if (!text || loading || isStreaming) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    shouldStopRef.current = false;
    wordQueueRef.current = [];
    isSpeakingWordRef.current = false;

    try {
      const lang = await detectLanguage(text);
      setDetectedLang(lang);

      const aiMsgId = (Date.now() + 1).toString();
      setMessages([
        ...updatedMessages,
        { id: aiMsgId, role: 'assistant', text: '', timestamp: Date.now(), streaming: true },
      ]);
      setLoading(false);
      setIsStreaming(true);

      if (realtimeSpeak) {
        setIsSpeaking(true);
        setSpeakingId(aiMsgId);
      }

      await sendMessageStream(
        updatedMessages,
        lang,
        (streamedText) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, text: streamedText } : m))
          );
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        },
        async (fullText) => {
          const finalMsg = {
            id: aiMsgId,
            role: 'assistant',
            text: fullText,
            timestamp: Date.now(),
            streaming: false,
          };
          const finalMessages = [...updatedMessages, finalMsg];
          setMessages(finalMessages);
          setIsStreaming(false);

          const waitForQueue = setInterval(() => {
            if (wordQueueRef.current.length === 0 && !isSpeakingWordRef.current) {
              clearInterval(waitForQueue);
              setIsSpeaking(false);
              setSpeakingId(null);
            }
          }, 200);

          const history = JSON.parse((await AsyncStorage.getItem('chatHistory')) || '[]');
          history.unshift({
            id: Date.now().toString(),
            preview: text.slice(0, 60),
            date: new Date().toLocaleDateString(),
            messages: finalMessages,
          });
          await AsyncStorage.setItem('chatHistory', JSON.stringify(history.slice(0, 50)));
        },
        (word) => enqueueWord(word),
        () => shouldStopRef.current
      );
    } catch (e) {
      setLoading(false);
      setIsStreaming(false);
      stopAllSpeech();
      Alert.alert('Error', e.message || 'Failed to get response.');
    }
  };

  const speakBubble = (item) => {
    if (isSpeaking && speakingId === item.id) {
      stopAllSpeech();
      return;
    }
    stopAllSpeech();
    shouldStopRef.current = false;
    setSpeakingId(item.id);
    setIsSpeaking(true);
    Speech.speak(item.text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.95,
      onDone: () => {
        setIsSpeaking(false);
        setSpeakingId(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setSpeakingId(null);
      },
    });
  };

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required.');
        return;
      }
      await audioRecorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      audioRecorder.record();
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) await transcribeAudio(uri);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const transcribeAudio = async (uri) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' });
      formData.append('model', 'whisper-large-v3-turbo');
      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}` },
        body: formData,
      });
      const data = await res.json();
      setLoading(false);
      if (data?.text) await handleSend(data.text);
      else Alert.alert('Could not understand', 'Please try again.');
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message);
    }
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const flag = LANG_FLAGS[detectedLang] || '🌍';

  return (
    // ✅ FIX: KeyboardAvoidingView now wraps the ENTIRE screen
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A0A0F' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />

      {/* ── Header ── */}
      <View
        className="flex-row items-center border-b px-4 pb-4 pt-[52px]"
        style={{ borderBottomColor: '#1F1F2E' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-1 p-2">
          <Text className="text-[22px] font-semibold" style={{ color: '#A78BFA' }}>
            ←
          </Text>
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="text-[17px] font-bold" style={{ color: '#F5F3FF' }}>
            AI Assistant
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <Text className="text-[11px] font-medium" style={{ color: '#10B981' }}>
              Online
            </Text>
          </View>
        </View>

        <View className="flex-row gap-1">
          <TouchableOpacity
            className="rounded-xl p-2"
            onPress={() =>
              navigation.navigate('ShareExport', { messages, preview: messages[1]?.text || 'Chat' })
            }>
            <Text className="text-xl">📤</Text>
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: speakBtnAnim }] }}>
            <TouchableOpacity
              className="rounded-xl border p-2"
              style={{
                backgroundColor: realtimeSpeak ? '#1E1030' : 'transparent',
                borderColor: realtimeSpeak ? '#7C3AED' : 'transparent',
              }}
              onPress={toggleRealtimeSpeak}>
              <Text className="text-xl">{realtimeSpeak ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* ── Real-time speak banner ── */}
      {realtimeSpeak && (
        <View
          className="items-center border-b px-4 py-2"
          style={{ backgroundColor: '#1E1030', borderBottomColor: '#2D1B69' }}>
          <Text className="text-xs font-medium" style={{ color: '#A78BFA' }}>
            {isStreaming ? '🔊 Speaking in real-time...' : '🔊 Real-time speaking ON'}
          </Text>
        </View>
      )}

      {/* ── Language banner ── */}
      <View
        className="flex-row items-center justify-between border-b px-4 py-2"
        style={{ backgroundColor: '#0F0F1A', borderBottomColor: '#1F1F2E' }}>
        <Text className="text-xs" style={{ color: '#9CA3AF' }}>
          {flag}{' '}
          <Text className="font-bold" style={{ color: '#A78BFA' }}>
            {detectedLang}
          </Text>{' '}
          detected
        </Text>
        <Text className="text-[11px]" style={{ color: '#374151' }}>
          🌍 Auto replies in your language
        </Text>
      </View>

      {/* ── Messages ── */}
      {/* ✅ FIX: Added keyboardShouldPersistTaps and keyboardDismissMode */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            item={item}
            onSpeak={speakBubble}
            isSpeaking={isSpeaking}
            speakingId={speakingId}
            isStreaming={isStreaming}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListFooterComponent={loading ? <TypingIndicator /> : null}
      />

      {/* ── Streaming banner ── */}
      {isStreaming && (
        <View
          className="flex-row items-center justify-center gap-2 border-t py-2"
          style={{ backgroundColor: '#0F0F1A', borderTopColor: '#1F1F2E' }}>
          <ActivityIndicator size="small" color="#7C3AED" />
          <Text className="flex-1 text-center text-xs font-medium" style={{ color: '#A78BFA' }}>
            {realtimeSpeak ? '🔊 AI is speaking...' : 'AI is typing...'}
          </Text>
          <TouchableOpacity
            onPress={stopAllSpeech}
            className="mr-2 rounded-xl px-3 py-1.5"
            style={{ backgroundColor: '#1F1F2E' }}>
            <Text className="text-xs font-bold" style={{ color: '#EF4444' }}>
              ⏹ Stop
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Recording banner ── */}
      {isRecording && (
        <View
          className="flex-row items-center justify-center gap-2.5 border-t py-2.5"
          style={{ backgroundColor: '#1E1030', borderTopColor: '#2D1B69' }}>
          <Animated.View
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: '#EF4444', transform: [{ scale: pulseAnim }] }}
          />
          <Text className="text-[13px] font-semibold" style={{ color: '#A78BFA' }}>
            Listening... Tap 🎤 to stop
          </Text>
        </View>
      )}

      {/* ── Input ── */}
      {/* ✅ FIX: Removed inner KeyboardAvoidingView, input row is now a plain View */}
      <View
        className="flex-row items-end gap-2.5 border-t px-3 py-3"
        style={{ paddingBottom: Platform.OS === 'ios' ? 28 : 16, borderTopColor: '#1F1F2E' }}>
        {/* Mic button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-full border"
            style={{
              backgroundColor: isRecording ? '#1E1030' : '#111118',
              borderColor: isRecording ? '#7C3AED' : '#2D2D3D',
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isRecording ? 0.8 : 0,
              shadowRadius: 10,
              elevation: isRecording ? 8 : 0,
            }}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}>
            <Text className="text-[22px]">{isRecording ? '⏹️' : '🎤'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Text input */}
        <TextInput
          className="flex-1 rounded-3xl border px-5 py-3 text-[15px]"
          style={{
            backgroundColor: '#111118',
            color: '#F5F3FF',
            borderColor: '#2D2D3D',
            maxHeight: 120,
          }}
          placeholder={isRecording ? 'Listening...' : 'Type in any language...'}
          placeholderTextColor={isRecording ? '#7C3AED' : '#4B5563'}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!isRecording && !isStreaming}
        />

        {/* Send button */}
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: !input.trim() || loading || isStreaming ? '#2D2D3D' : '#7C3AED',
            shadowColor: '#7C3AED',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: !input.trim() || loading || isStreaming ? 0 : 0.5,
            shadowRadius: 8,
            elevation: !input.trim() || loading || isStreaming ? 0 : 8,
          }}
          onPress={() => handleSend()}
          disabled={!input.trim() || loading || isStreaming}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-xl font-bold text-white">↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
