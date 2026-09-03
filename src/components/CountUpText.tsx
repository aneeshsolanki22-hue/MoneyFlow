import React, { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

interface Props {
  value: number;
  format: (n: number) => string;
  style?: StyleProp<TextStyle>;
}

/** Eased count-up number that animates between value changes. */
export default function CountUpText({ value, format, style }: Props) {
  const [display, setDisplay] = useState(() => format(value));
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    if (from === value) {
      // Value unchanged — re-render with the current formatter so a
      // currency/locale switch is reflected immediately.
      setDisplay(format(value));
      return;
    }

    const start = performance.now();
    const duration = 700;
    let raf = 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (value - from) * eased;
      setDisplay(format(current));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prev.current = value;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, format]);

  return <Text style={style}>{display}</Text>;
}
