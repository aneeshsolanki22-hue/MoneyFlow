import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Colors, Fonts } from '../theme';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastOptions {
  action?: ToastAction;
}

type ShowToast = (message: string, options?: ToastOptions) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<ToastAction | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setMessage(null);
    setAction(null);
  }, []);

  const show = useCallback<ShowToast>(
    (msg, options) => {
      setMessage(msg);
      setAction(options?.action ?? null);
      if (timer.current) clearTimeout(timer.current);
      // Give more time to react when the toast carries an action.
      timer.current = setTimeout(dismiss, options?.action ? 4000 : 2400);
    },
    [dismiss],
  );

  const handleAction = useCallback(() => {
    action?.onPress();
    dismiss();
  }, [action, dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message !== null && (
        <Animated.View
          entering={FadeInDown.springify().damping(18).stiffness(200)}
          exiting={FadeOutDown.duration(180)}
          style={[
            styles.toast,
            action ? styles.toastInteractive : styles.toastPointer,
          ]}
        >
          <Text style={styles.text} numberOfLines={1}>
            {message}
          </Text>
          {action && (
            <Pressable
              onPress={handleAction}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionPressed,
              ]}
              hitSlop={8}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastPointer: {
    pointerEvents: 'none' as const,
  },
  toastInteractive: {
    pointerEvents: 'auto' as const,
  },
  toast: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#23232C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    maxWidth: '85%',
  },
  text: {
    color: Colors.whiteHi,
    fontSize: 13,
    fontFamily: Fonts.bodySemi,
    textAlign: 'center',
    flexShrink: 1,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionText: {
    color: Colors.accent,
    fontSize: 13,
    fontFamily: Fonts.displaySemi,
  },
});