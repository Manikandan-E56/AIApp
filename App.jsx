import './global.css';
import React, { useEffect, useRef } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './Context/ThemeContext';
import {
  setupNotificationListeners,
  requestNotificationPermission,
} from './src/services/NotificationService';

// Ignore the warning about remote notifications being removed from Expo Go in SDK 53
// Your app only uses local notifications (Daily AI tips), which still work perfectly in Expo Go.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
]);

import HomeScreen from './src/Screens/Home';
import ChatScreen from './src/Screens/Chat';
import HistoryScreen from './src/Screens/History';
import ProfileScreen from './src/Screens/ProfileScreen';
import ShareExportScreen from './src/Screens/ShareExport';
import ImageAnalysisScreen from './src/Screens/ImageAnalysis';
import NotificationsScreen from './src/Screens/NotificationScreen';
import SupportScreen from './src/Support';
import PrivacyPolicy from './src/PrivacyPolicy';
import ContactSupport from './src/ContactSupport';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // 1. Ask notification permission on app startup
    requestNotificationPermission();

    // 2. Listen for notification taps and navigate to correct screen
    const cleanup = setupNotificationListeners(navigationRef.current);
    return cleanup;
  }, []);

  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ShareExport" component={ShareExportScreen} />
          <Stack.Screen name="ImageAnalysis" component={ImageAnalysisScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
          <Stack.Screen name="ContactSupport" component={ContactSupport} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
