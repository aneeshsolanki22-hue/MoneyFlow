import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Wallet,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { Fonts } from '../theme';
import { CURRENCIES, useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../components/Toast';
import { DRIVE_SCOPE, getGoogleClientIds } from '../utils/drive';

interface GoogleCred {
  token: string;
  email: string;
}

interface Props {
  onDone: (google?: GoogleCred) => void;
}

/** Official multi-color Google "G" mark (24x24). */
function GoogleG() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

const stepDots = (current: number) => (
  <View style={styles.dots}>
    <View style={[styles.dot, current === 0 && styles.dotActive]} />
    <View style={[styles.dot, current === 1 && styles.dotActive]} />
  </View>
);

export default function OnboardingScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { currency, setCurrencyByCode } = useCurrency();

  const [step, setStep] = useState<'welcome' | 'currency'>('welcome');
  const [selectedCode, setSelectedCode] = useState(currency.code);
  const [googleCred, setGoogleCred] = useState<GoogleCred | null>(null);
  const [busy, setBusy] = useState(false);

  // Android hardware back: currency step returns to welcome.
  useEffect(() => {
    if (step !== 'currency') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep('welcome');
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const handleGoogle = async () => {
    if (busy) return;
    const { webClientId, androidClientId } = getGoogleClientIds();
    if (!webClientId) {
      toast('Google sign-in is not configured');
      return;
    }
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      GoogleSignin.configure({
        webClientId,
        ...(androidClientId ? { androidClientId } : {}),
        scopes: ['profile', 'email', DRIVE_SCOPE],
      });
      const result = await GoogleSignin.signIn();
      if (!isSuccessResponse(result)) return; // user cancelled
      const tokens = await GoogleSignin.getTokens();
      if (!tokens.accessToken) throw new Error('No access token returned');
      const email = result.data.user.email || 'Google account';
      setGoogleCred({ token: tokens.accessToken, email });
      setStep('currency');
    } catch (err) {
      const code = (err as { code?: string | number } | undefined)?.code;
      if (code === 'SIGN_IN_CANCELLED') return;
      toast(code ? `Google sign-in failed (${code})` : 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    setCurrencyByCode(selectedCode);
    onDone(googleCred ?? undefined);
  };

  return (
    <View style={styles.root}>
      {/* Brand gradient background per design: #9e0f0d → #e15c15 */}
      <LinearGradient
        colors={['#9e0f0d', '#e15c15']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 18 },
        ]}
      >
        {/* BRAND */}
        <Animated.View entering={FadeIn.duration(450)} style={styles.brandRow}>
          <View style={styles.logoTile}>
            <Wallet size={20} color="#7a0c0a" strokeWidth={2.4} />
          </View>
          <Text style={styles.brandText}>moneyflow</Text>
        </Animated.View>

        {step === 'welcome' ? (
          <Animated.View key="welcome" entering={FadeInDown.duration(420)} style={styles.stepWrap}>
            <Text style={styles.headline}>
              Welcome{'\n'}to moneyflow.
            </Text>
            <Text style={styles.sub}>
              The simple way to track your income{'\n'}and expenses.
            </Text>

            <View style={styles.featureRow}>
              <Text style={styles.featurePill}>✦ No ads</Text>
              <Text style={styles.featurePill}>✦ Private</Text>
              <Text style={styles.featurePill}>✦ Free</Text>
            </View>

            <View style={{ flex: 1, minHeight: 24 }} />

            {/* SIGN UP WITH GOOGLE */}
            <Pressable
              onPress={handleGoogle}
              disabled={busy}
              style={({ pressed }) => [
                styles.googleBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
              ]}
            >
              <GoogleG />
              <Text style={styles.googleBtnText}>
                {busy ? 'Connecting…' : 'Continue with Google'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setStep('currency')}
              disabled={busy}
              hitSlop={8}
              style={styles.skipBtn}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View
            key="currency"
            entering={SlideInRight.duration(300)}
            style={styles.stepWrap}
          >
            <Pressable
              onPress={() => setStep('welcome')}
              hitSlop={10}
              style={styles.backBtn}
            >
              <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <Text style={styles.currencyTitle}>Select your currency</Text>
            <Text style={styles.currencySub}>
              {googleCred
                ? `Signed in as ${googleCred.email}`
                : 'Pick the currency you use every day.'}
              {'\n'}You can change this later in Settings.
            </Text>

            <View style={styles.currencyList}>
              {CURRENCIES.map((c) => {
                const selected = c.code === selectedCode;
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => setSelectedCode(c.code)}
                    style={[styles.currencyRow, selected && styles.currencyRowSelected]}
                  >
                    <View style={[styles.currencyTile, selected && styles.currencyTileSelected]}>
                      <Text style={[styles.currencySymbol, selected && styles.currencySymbolSelected]}>
                        {c.symbol}
                      </Text>
                    </View>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyName}>{c.name}</Text>
                      <Text style={styles.currencyCode}>{c.code}</Text>
                    </View>
                    {selected && (
                      <View style={styles.currencyCheck}>
                        <Check size={14} color="#0A0A0E" strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={finish}
              style={({ pressed }) => [
                styles.continueBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
              ]}
            >
              <Text style={styles.continueText}>Get Started</Text>
              <ArrowRight size={18} color="#0A0A0E" strokeWidth={2.5} />
            </Pressable>
          </Animated.View>
        )}

        {stepDots(step === 'welcome' ? 0 : 1)}

        <Animated.Text
          entering={FadeIn.delay(1200).duration(600)}
          style={styles.credit}
        >
          Designed by Toukir Solanki
        </Animated.Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#9e0f0d',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: Fonts.display,
    letterSpacing: -0.4,
  },
  stepWrap: {
    flex: 1,
    paddingTop: 46,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 44,
    fontFamily: Fonts.display,
    letterSpacing: -1.2,
    lineHeight: 50,
  },
  sub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontFamily: Fonts.body,
    lineHeight: 24,
    marginTop: 14,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
    flexWrap: 'wrap',
  },
  featurePill: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12.5,
    fontFamily: Fonts.bodySemi,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 13,
    overflow: 'hidden',
  },
  googleBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  googleBtnText: {
    color: '#0A0A0E',
    fontSize: 16,
    fontFamily: Fonts.displaySemi,
  },
  skipBtn: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  skipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bodyMedium,
  },
  currencyTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: Fonts.display,
    letterSpacing: -0.6,
  },
  currencySub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontFamily: Fonts.body,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 20,
  },
  currencyList: {
    gap: 10,
  },
  currencyRow: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  currencyRowSelected: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: '#FFFFFF',
  },
  currencyTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyTileSelected: {
    backgroundColor: '#FFFFFF',
  },
  currencySymbol: {
    color: '#7a0c0a',
    fontSize: 17,
    fontFamily: Fonts.displaySemi,
  },
  currencySymbolSelected: {
    color: '#7a0c0a',
  },
  currencyInfo: {
    flex: 1,
    gap: 1,
  },
  currencyName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bodySemi,
  },
  currencyCode: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: Fonts.body,
    letterSpacing: 0.6,
  },
  currencyCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  continueText: {
    color: '#0A0A0E',
    fontSize: 16,
    fontFamily: Fonts.display,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 26,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  credit: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11.5,
    fontFamily: Fonts.bodyMedium,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 16,
  },
});
