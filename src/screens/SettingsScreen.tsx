import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  Vibration,
  View,
} from 'react-native';

const appLogo = require('../../assets/logo.png');
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import {
  Check,
  ChevronRight,
  CloudDownload,
  CloudUpload,
  Coins,
  Mail,
  Moon,
  Trash2,
} from 'lucide-react-native';
import ReacticxSwitch from '../components/ReacticxSwitch';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { CURRENCIES, useCurrency } from '../contexts/CurrencyContext';
import { useCategories } from '../contexts/CategoryContext';
import type { BackupState } from '../types';
import { DRIVE_SCOPE, getGoogleClientIds } from '../utils/drive';
import { useToast } from '../components/Toast';

interface Props {
  backup: BackupState;
  connected: boolean;
  onSignedIn: (token: string, email: string) => void;
  onSignedOut: () => void;
  onBackup: () => Promise<void>;
  onRestore: () => Promise<void>;
}

export default function SettingsScreen({
  backup,
  connected,
  onSignedIn,
  onSignedOut,
  onBackup,
  onRestore,
}: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrencyByCode } = useCurrency();
  const { customCategories, deleteCustomCategory } = useCategories();

  const { webClientId, androidClientId } = getGoogleClientIds();
  const configured = webClientId.length > 0;

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showCurrencyGrid, setShowCurrencyGrid] = useState(false);

  const handleGoogleAuth = useCallback(async () => {
    if (Platform.OS === 'android') Vibration.vibrate(15);
    if (connected) {
      Alert.alert('Sign Out', 'Sign out from Google Drive?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await GoogleSignin.signOut();
            } catch {
              // ignore
            }
            onSignedOut();
          },
        },
      ]);
      return;
    }

    if (!configured) {
      toast('Google sign-in is not configured');
      return;
    }

    setLoadingGoogle(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      GoogleSignin.configure({
        webClientId,
        ...(androidClientId ? { androidClientId } : {}),
        scopes: ['profile', 'email', DRIVE_SCOPE],
      });
      const result = await GoogleSignin.signIn();
      if (!isSuccessResponse(result)) return;
      const tokens = await GoogleSignin.getTokens();
      if (!tokens.accessToken) throw new Error('No access token returned');
      const email = result.data.user.email || 'Google account';
      onSignedIn(tokens.accessToken, email);
    } catch (err) {
      const code = (err as { code?: string | number } | undefined)?.code;
      const message = (err as { message?: string } | undefined)?.message;
      toast(
        code
          ? `Sign-in failed (${code})`
          : message
            ? `Sign-in failed: ${message}`
            : 'Sign-in failed, please try again',
      );
    } finally {
      setLoadingGoogle(false);
    }
  }, [connected, configured, webClientId, androidClientId, onSignedIn, onSignedOut, toast]);

  const handleBackupPress = async () => {
    if (Platform.OS === 'android') Vibration.vibrate(15);
    if (!connected) {
      toast('Sign in with Google first');
      return;
    }
    setBackingUp(true);
    try {
      await onBackup();
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestorePress = async () => {
    if (Platform.OS === 'android') Vibration.vibrate(15);
    if (!connected) {
      toast('Sign in with Google first');
      return;
    }
    Alert.alert(
      'Restore Backup',
      'This will replace transactions with your cloud backup data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'default',
          onPress: async () => {
            setRestoring(true);
            try {
              await onRestore();
            } finally {
              setRestoring(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      {/* Static design gradient (expnese tracker.pen: Settings Page radial #080d4d glow) */}
      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={['#080d4d', '#000000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + Math.max(insets.bottom, 16) },
        ]}
      >
        {/* PAGE HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* TOP WHITE GOOGLE CARD (MATCHING DESIGN) */}
        <View style={styles.googleCard}>
          <Pressable
            onPress={handleGoogleAuth}
            style={styles.googleHeaderRow}
          >
            <View style={styles.googleIconBox}>
              <Mail size={20} color="#0A0A0A" strokeWidth={2} />
            </View>

            <View style={styles.googleTextGroup}>
              <Text style={styles.googleTitle}>
                {connected && backup.googleEmail
                  ? backup.googleEmail
                  : 'Sign in with Google'}
              </Text>
              <Text style={styles.googleSubtitle}>
                {connected
                  ? 'Connected to Google Drive'
                  : 'Backup & restore your data securely'}
              </Text>
            </View>

            <ChevronRight size={18} color="#9CA3AF" />
          </Pressable>

          <Pressable
            onPress={handleGoogleAuth}
            disabled={loadingGoogle}
            style={({ pressed }) => [
              styles.googleCtaBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            {loadingGoogle ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.googleCtaText}>
                {connected ? 'Sign Out' : 'Continue with Google'}
              </Text>
            )}
          </Pressable>
        </View>

        {/* 2-COLUMN GRID: BACKUP & RESTORE CARDS */}
        <View style={styles.gridRow}>
          {/* BACKUP CARD */}
          <Pressable
            onPress={handleBackupPress}
            disabled={backingUp}
            style={({ pressed }) => [
              styles.actionCard,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            {backingUp ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <CloudUpload size={24} color="#FFFFFF" strokeWidth={2.2} />
            )}
            <View style={styles.actionCardTextGroup}>
              <Text style={styles.actionCardTitle}>Backup</Text>
              <Text style={styles.actionCardSub}>Save to Drive</Text>
            </View>
          </Pressable>

          {/* RESTORE CARD */}
          <Pressable
            onPress={handleRestorePress}
            disabled={restoring}
            style={({ pressed }) => [
              styles.actionCard,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <CloudDownload size={24} color="#FFFFFF" strokeWidth={2.2} />
            )}
            <View style={styles.actionCardTextGroup}>
              <Text style={styles.actionCardTitle}>Restore</Text>
              <Text style={styles.actionCardSub}>From backup</Text>
            </View>
          </Pressable>
        </View>

        {/* PREFERENCES CARD */}
        <View style={styles.preferencesCard}>
          {/* CURRENCY ROW */}
          <Pressable
            onPress={() => setShowCurrencyGrid((v) => !v)}
            style={styles.prefRow}
          >
            <View style={styles.prefLeft}>
              <Coins size={20} color="#FFFFFF" strokeWidth={2} />
              <View style={styles.prefTextGroup}>
                <Text style={styles.prefTitle}>Currency</Text>
                <Text style={styles.prefSub}>Payment unit</Text>
              </View>
            </View>
            <Text style={styles.prefValue}>
              {currency.code} ({currency.symbol})
            </Text>
          </Pressable>

          {showCurrencyGrid && (
            <View style={styles.currencyGrid}>
              {CURRENCIES.map((c) => {
                const isSelected = c.code === currency.code;
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => {
                      setCurrencyByCode(c.code);
                      setShowCurrencyGrid(false);
                    }}
                    style={[
                      styles.currencyChip,
                      isSelected && styles.currencyChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyChipSymbol,
                        isSelected && styles.currencyChipTextSelected,
                      ]}
                    >
                      {c.symbol}
                    </Text>
                    <Text
                      style={[
                        styles.currencyChipCode,
                        isSelected && styles.currencyChipTextSelected,
                      ]}
                    >
                      {c.code}
                    </Text>
                    {isSelected && <Check size={14} color="#0A0A0A" strokeWidth={2.5} />}
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.separator} />

          {/* DARK MODE ROW */}
          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Moon size={20} color="#FFFFFF" strokeWidth={2} />
              <View style={styles.prefTextGroup}>
                <Text style={styles.prefTitle}>Dark Mode</Text>
                <Text style={styles.prefSub}>Appearance</Text>
              </View>
            </View>
            <ReacticxSwitch
              active={theme === 'dark'}
              onToggle={toggleTheme}
              size={48}
              activeColor="#0A0A0A"
              inactiveColor="#FFFFFF"
              trackActiveColor="#FFFFFF"
              trackInactiveColor="#3A3A3C"
            />
          </View>
        </View>

        {/* CUSTOM CATEGORIES (IF ANY) */}
        {customCategories.length > 0 && (
          <View style={styles.preferencesCard}>
            {customCategories.map((c, i) => (
              <React.Fragment key={c.id}>
                {i > 0 && <View style={styles.separator} />}
                <View style={styles.prefRow}>
                  <View style={styles.prefLeft}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: c.color },
                      ]}
                    />
                    <View style={styles.prefTextGroup}>
                      <Text style={styles.prefTitle}>{c.name}</Text>
                      <Text style={styles.prefSub}>
                        {c.type === 'income' ? 'Income source' : 'Expense category'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => deleteCustomCategory(c.id)}
                    hitSlop={8}
                  >
                    <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                  </Pressable>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* ABOUT CARD */}
        <View style={styles.aboutCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Image source={appLogo} style={{ width: 44, height: 44, borderRadius: 12 }} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.aboutTitle}>MoneyFlow</Text>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </View>
          <Text style={styles.aboutText}>
            MoneyFlow — a smart money tracker and create by Toukir
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#02030A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: Fonts.display,
  },
  googleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  googleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  googleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleTextGroup: {
    flex: 1,
    gap: 2,
  },
  googleTitle: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: Fonts.displaySemi,
  },
  googleSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  googleCtaBtn: {
    height: 48,
    backgroundColor: '#0A0A0A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleCtaText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: Fonts.displaySemi,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    height: 120,
    backgroundColor: '#121212',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    justifyContent: 'center',
    gap: 12,
  },
  actionCardTextGroup: {
    gap: 2,
  },
  actionCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Fonts.displaySemi,
  },
  actionCardSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  preferencesCard: {
    backgroundColor: '#121212',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 16,
  },
  prefRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prefLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  prefTextGroup: {
    flex: 1,
    gap: 2,
  },
  prefTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.displaySemi,
  },
  prefSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: Fonts.body,
  },
  prefValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.displaySemi,
  },
  separator: {
    height: 1,
    backgroundColor: '#2A2A2A',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  currencyChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  currencyChipSymbol: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonts.displaySemi,
  },
  currencyChipCode: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
  },
  currencyChipTextSelected: {
    color: '#0A0A0A',
  },
  categoryDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  aboutCard: {
    backgroundColor: '#121212',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    gap: 10,
  },
  aboutTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Fonts.display,
  },
  aboutText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    letterSpacing: 0.5,
  },
});
