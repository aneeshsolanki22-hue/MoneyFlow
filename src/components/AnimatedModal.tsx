import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Floating popup modal positioned right above the navbar + button.
 * Morphs and expands in place from the + button origin.
 */
export default function AnimatedModal({
  visible,
  onClose,
  children,
}: AnimatedModalProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withSpring(1, {
        damping: 20,
        stiffness: 240,
        mass: 0.8,
      });
    } else {
      progress.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
    }
  }, [visible, progress]);

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const popupAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.2, 1]);
    const translateX = interpolate(progress.value, [0, 1], [120, 0]);
    const translateY = interpolate(progress.value, [0, 1], [140, 0]);
    const opacity = interpolate(progress.value, [0, 0.25, 1], [0, 1, 1]);

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
    };
  });

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <View
        style={[
          styles.popupWrapper,
          { paddingBottom: 86 + Math.max(insets.bottom, 16) },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.popupCard,
            popupAnimatedStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  popupWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  popupCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    maxHeight: '82%',
    // Solid surface per expnese tracker.pen (Income/Expense Popup = #0A0A0E) —
    // no liquid-glass blur, the sheet is fully opaque.
    backgroundColor: '#0A0A0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
});
