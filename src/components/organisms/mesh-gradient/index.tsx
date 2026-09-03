import React, { memo, useCallback, useMemo } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { DEFAULT_INITIAL_COLORS, DEFAULT_PERFORMANCE } from "./const";
import type { IAnimatedMeshGradient, IMeshGradientColor } from "./types";
import { useFrameTime } from "./useFrameTime";

export const AnimatedMeshGradient: React.FC<IAnimatedMeshGradient> = memo(
  ({
    colors = DEFAULT_INITIAL_COLORS,
    speed = 1,
    noise = 0.15,
    blur = 0.4,
    contrast = 1,
    animated = true,
    style,
    width: paramsWidth = Dimensions.get("window").width,
    height: paramsHeight = Dimensions.get("window").height,
    performance,
    children,
  }) => {
    const width = useSharedValue<number>(paramsWidth ?? 1);
    const height = useSharedValue<number>(paramsHeight ?? 1);
    const scale =
      performance?.undersampling ?? DEFAULT_PERFORMANCE.undersampling;

    const time = useFrameTime({
      fpsLock: performance?.fpsLock ?? DEFAULT_PERFORMANCE.fpsLock,
      animated,
      speed,
    });

    const safeColors = useMemo<IMeshGradientColor[]>(() => {
      const result = [...colors];
      while (result.length < 4) {
        result.push(
          DEFAULT_INITIAL_COLORS[result.length % DEFAULT_INITIAL_COLORS.length],
        );
      }
      return result.slice(0, 4);
    }, [colors]);

    const onLayout = useCallback(
      (e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        const h = e.nativeEvent.layout.height;
        width.value = w < 1 ? 1 : w;
        height.value = h < 1 ? 1 : h;
      },
      [width, height],
    );

    if (Platform.OS === "web") {
      const c1 = safeColors[0] ? `rgb(${Math.round(safeColors[0].r * 255)}, ${Math.round(safeColors[0].g * 255)}, ${Math.round(safeColors[0].b * 255)})` : '#0A0A14';
      const c2 = safeColors[1] ? `rgb(${Math.round(safeColors[1].r * 255)}, ${Math.round(safeColors[1].g * 255)}, ${Math.round(safeColors[1].b * 255)})` : '#02030A';
      return (
        <View style={[styles.container, style, { width: paramsWidth, height: paramsHeight }]} onLayout={onLayout}>
          <LinearGradient
            colors={[c1, c2, '#02030A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {children}
        </View>
      );
    }

    // Native Skia execution
    const { Canvas, Shader, Skia, Fill, vec } = require("@shopify/react-native-skia");
    const { SHADER: MESH_GRADIENT_SHADER } = require("./conf");
    const shader = Skia.RuntimeEffect.Make(MESH_GRADIENT_SHADER);

    const uniforms = useDerivedValue(() => {
      return {
        resolution: vec(
          Math.round(width.value * scale),
          Math.round(height.value * scale),
        ),
        time: time.value,
        noise: Math.max(0, Math.min(1, noise)),
        blur: Math.max(0, Math.min(1, blur)),
        contrast: Math.max(0, Math.min(2, contrast)),
        color1: [safeColors[0].r, safeColors[0].g, safeColors[0].b, 1],
        color2: [safeColors[1].r, safeColors[1].g, safeColors[1].b, 1],
        color3: [safeColors[2].r, safeColors[2].g, safeColors[2].b, 1],
        color4: [safeColors[3].r, safeColors[3].g, safeColors[3].b, 1],
      };
    }, [width, height, noise, blur, contrast, safeColors, time]);

    const canvasWrapperStyle = useAnimatedStyle<
      Required<
        Partial<
          Pick<
            ViewStyle,
            | "position"
            | "top"
            | "left"
            | "width"
            | "height"
            | "transform"
            | "transformOrigin"
            | "zIndex"
          >
        >
      >
    >(() => ({
      position: "absolute",
      top: 0,
      left: 0,
      width: Math.round(width.value * scale),
      height: Math.round(height.value * scale),
      transform: [{ scale: 1 / scale }],
      transformOrigin: "left top",
      zIndex: -9999,
    }));

    if (!shader) {
      return (
        <View
          style={[
            styles.container,
            style,
            { width: width.value, height: height.value },
          ]}
        />
      );
    }

    return (
      <View
        style={[
          styles.container,
          style,
          {
            width: paramsWidth,
            height: paramsHeight,
          },
        ]}
        onLayout={onLayout}
      >
        {children}
        <Animated.View style={canvasWrapperStyle}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Fill>
              <Shader source={shader} uniforms={uniforms} />
            </Fill>
          </Canvas>
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});

export default memo(AnimatedMeshGradient);
