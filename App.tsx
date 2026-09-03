import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { NavigationBar } from 'expo-navigation-bar';
import { Colors } from './src/theme';
import type { UserProfile } from './src/types';
import { loadUser, saveBackup, saveUser } from './src/utils/storage';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import { ToastProvider } from './src/components/Toast';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { CurrencyProvider } from './src/contexts/CurrencyContext';
import { CategoryProvider } from './src/contexts/CategoryContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Stage = 'boot' | 'onboarding' | 'home';

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stage, setStage] = useState<Stage>('boot');

  useEffect(() => {
    (async () => {
      const u = await loadUser();
      setUser(u);
      setStage(u && u.onboarded ? 'home' : 'onboarding');
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded && stage !== 'boot') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, stage]);

  const [googleCred, setGoogleCred] = useState<{ token: string; email: string } | null>(null);

  const handleOnboard = useCallback(
    (google?: { token: string; email: string }) => {
      if (google) {
        saveBackup({ googleConnected: true, googleEmail: google.email, lastBackup: null });
        setGoogleCred(google);
      }
      const u: UserProfile = { onboarded: true };
      saveUser(u);
      setUser(u);
      setStage('home');
    },
    [],
  );

  if (!fontsLoaded || stage === 'boot') return null;

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <CategoryProvider>
          <SafeAreaProvider>
            <KeyboardProvider>
              <ToastProvider>
                <StatusBar style="light" />
                {/* Full-bleed UI: Android already uses gesture navigation, so
                    the system navigation bar is hidden (a swipe up from the
                    bottom briefly reveals it). This removes the nav-bar
                    scrim/gesture strip that sat over the bottom of every
                    popup; RN syncs modal windows with the activity, so sheets
                    stay full-bleed too. No-op on iOS/web. */}
                <NavigationBar hidden style="light" />
                <View style={styles.root}>
                  {stage === 'onboarding' && (
                    <Animated.View
                      key="onboarding"
                      entering={FadeIn.duration(400)}
                      exiting={FadeOut.duration(300)}
                      style={StyleSheet.absoluteFill}
                    >
                      <OnboardingScreen onDone={handleOnboard} />
                    </Animated.View>
                  )}
                  {stage === 'home' && user && (
                    <Animated.View
                      key="home"
                      entering={FadeIn.duration(450)}
                      style={StyleSheet.absoluteFill}
                    >
                      <HomeScreen user={user} initialGoogleToken={googleCred?.token ?? null} />
                    </Animated.View>
                  )}
                </View>
              </ToastProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        </CategoryProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgSolid,
  },
});
