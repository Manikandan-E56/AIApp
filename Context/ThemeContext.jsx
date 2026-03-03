import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Color Tokens ─────────────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    name: 'dark',
    // Backgrounds
    bg: '#0A0A0F',
    bgCard: '#111118',
    bgInput: '#111118',
    bgAccent: '#1E1030',
    bgBanner: '#0F0F1A',

    // Borders
    border: '#1F1F2E',
    borderAccent: '#6D28D9',
    borderInput: '#2D2D3D',

    // Text
    textPrimary: '#F5F3FF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    textDim: '#374151',

    // Brand
    purple: '#7C3AED',
    purpleLight: '#A78BFA',
    purpleDark: '#2D1B69',

    // Status
    green: '#10B981',
    red: '#EF4444',

    // Chat bubbles
    userBubble: '#7C3AED',
    userBubbleText: '#FFFFFF',
    aiBubble: '#111118',
    aiBubbleText: '#E5E7EB',
  },
  light: {
    name: 'light',
    // Backgrounds
    bg: '#F8F7FF',
    bgCard: '#FFFFFF',
    bgInput: '#F3F4F6',
    bgAccent: '#EDE9FE',
    bgBanner: '#F5F3FF',

    // Borders
    border: '#E5E7EB',
    borderAccent: '#7C3AED',
    borderInput: '#D1D5DB',

    // Text
    textPrimary: '#111118',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    textDim: '#D1D5DB',

    // Brand
    purple: '#7C3AED',
    purpleLight: '#6D28D9',
    purpleDark: '#EDE9FE',

    // Status
    green: '#059669',
    red: '#DC2626',

    // Chat bubbles
    userBubble: '#7C3AED',
    userBubbleText: '#FFFFFF',
    aiBubble: '#F3F4F6',
    aiBubbleText: '#111118',
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? THEMES.dark : THEMES.light;

  // Load saved theme on startup
  useEffect(() => {
    AsyncStorage.getItem('appTheme').then((saved) => {
      if (saved !== null) setIsDark(saved === 'dark');
    });
  }, []);

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('appTheme', newVal ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useTheme = () => useContext(ThemeContext);