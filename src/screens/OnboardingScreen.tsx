import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, PiggyBank, ShieldCheck, TrendingUp, User } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../theme';

const bg = require('../../assets/images/onboarding-bg.jpg');

interface Props {
  onDone: (name: string) => void;
}

const FEATURES = [
  { icon: TrendingUp, color: Colors.incomeLight, label: 'Real-time spending insights' },
  { icon: PiggyBank, color: Colors.sky, label: 'Smart savings goals' },
  { icon: ShieldCheck, color: Colors.violet, label: 'Private & secure by design' },
];

const stagger = (i: number) =>
  FadeInDown.delay(280 + i * 130).springify().damping(17).stiffness(120);

export default function OnboardingScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [name, setName] = useState('');

  // Slow Ken Burns zoom on the background image.
  const zoom = useSharedValue(1.05);
  useEffect(() => {
    zoom.value = withRepeat(withTiming(1.18, { duration: 9000 }), -1, true);
  }, [zoom]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));

  const headlineSize = Math.min(52, width * 0.128);

  const finish = () => onDone(name.trim() || 'User');

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, zoomStyle]}>
        <ImageBackground source={bg} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay]} entering={FadeIn.duration(600)} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.gradientPointer]}
      />

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 18 },
        ]}
        bottomOffset={16}
      >
        <Animated.View entering={FadeIn.duration(500)}>
          <Text
            style={[
              styles.headline,
              { fontSize: headlineSize, lineHeight: Math.round(headlineSize * 1.06) },
            ]}
          >
            Money follow{'\n'}Brother.
          </Text>
        </Animated.View>

        <Animated.View entering={stagger(0)} style={{ marginTop: 18 }}>
          <Text style={styles.sub}>
            Track income, expenses and{'\n'}savings — all in one place.
          </Text>
        </Animated.View>

        <View style={{ height: 34 }} />

        <Animated.View entering={stagger(1)} style={{ gap: 12 }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <View key={f.label} style={styles.pill}>
                <View style={styles.iconTile}>
                  <Icon size={16} color={f.color} strokeWidth={2.2} />
                </View>
                <Text style={styles.pillLabel}>{f.label}</Text>
              </View>
            );
          })}
        </Animated.View>

        <View style={{ flex: 1, minHeight: 30 }} />

        <Animated.View entering={stagger(2)}>
          <Text style={styles.inputLabel}>What should we call you?</Text>
          <View style={styles.inputBox}>
            <User size={18} color="#FFFFFF60" strokeWidth={2} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#FFFFFF66"
              style={styles.input}
              maxLength={32}
              returnKeyType="done"
              onSubmitEditing={finish}
            />
          </View>
        </Animated.View>

        <View style={{ height: 20 }} />

        <Animated.View entering={stagger(3)}>
          <Pressable
            onPress={finish}
            style={({ pressed }) => [styles.ctaWrap, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Get Started</Text>
              <ArrowRight size={18} color={Colors.white} strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={{ height: 22 }} />

        <Animated.Text entering={FadeIn.delay(1300).duration(600)} style={styles.credit}>
          Designed by Toukir Solanki
        </Animated.Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  overlay: {
    backgroundColor: 'rgba(10,10,14,0.82)',
  },
  gradientPointer: {
    pointerEvents: 'none' as const,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  headline: {
    color: Colors.white,
    fontFamily: Fonts.display,
    letterSpacing: -1,
  },
  sub: {
    color: Colors.whiteSub,
    fontSize: 17,
    fontFamily: Fonts.body,
    lineHeight: 26,
  },
  pill: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.whiteSub ? 'rgba(255,255,255,0.08)' : Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillLabel: {
    color: Colors.whiteHi,
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
  },
  inputLabel: {
    color: Colors.whiteSub,
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 10,
  },
  inputBox: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(22,22,28,0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#00000040',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.body,
    paddingVertical: 0,
  },
  ctaWrap: {
    borderRadius: 16,
    shadowColor: '#E15C1540',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  cta: {
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    color: Colors.white,
    fontSize: 17,
    fontFamily: Fonts.display,
  },
  credit: {
    color: Colors.whiteGhost,
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
