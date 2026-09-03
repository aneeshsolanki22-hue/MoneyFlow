import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  active: boolean;
  onToggle: (next: boolean) => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  trackActiveColor?: string;
  trackInactiveColor?: string;
}

export default function ReacticxSwitch({
  active,
  onToggle,
  size = 48,
  activeColor = '#0A0A0A',
  inactiveColor = '#FFFFFF',
  trackActiveColor = '#FFFFFF',
  trackInactiveColor = '#3A3A3C',
}: Props) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(active ? 1 : 0, {
      damping: 18,
      stiffness: 240,
      mass: 0.8,
    });
  }, [active, progress]);

  const height = size * 0.58;
  const knobSize = height - 6;
  const travelDist = size - knobSize - 6;

  const trackAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [trackInactiveColor, trackActiveColor],
    );
    return { backgroundColor };
  });

  const knobAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, travelDist]);
    const scaleX = interpolate(
      progress.value,
      [0, 0.5, 1],
      [1, 1.2, 1],
    );
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor],
    );

    return {
      transform: [{ translateX }, { scaleX }],
      backgroundColor,
    };
  });

  return (
    <Pressable
      onPress={() => onToggle(!active)}
      hitSlop={8}
      style={({ pressed }) => [
        pressed && { opacity: 0.85 },
      ]}
    >
      <Animated.View
        style={[
          styles.track,
          { width: size, height, borderRadius: height / 2 },
          trackAnimatedStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            { width: knobSize, height: knobSize, borderRadius: knobSize / 2 },
            knobAnimatedStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  knob: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
