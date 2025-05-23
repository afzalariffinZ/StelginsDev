import React, { useRef, useState, useEffect } from 'react';
import { Text, Animated } from 'react-native';

type AnimatedNumberProps = {
  toValue: number;
  duration?: number;
  style?: any;
  prefix?: string;
  suffix?: string;
  decimals?: number;
};

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ toValue, duration = 1500, style, prefix = "", suffix = "", decimals = 0 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayText, setDisplayText] = useState(toValue.toFixed(decimals));

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: toValue,
      duration: duration,
      useNativeDriver: false,
    }).start();

    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayText(value.toFixed(decimals));
    });

    return () => {
      animatedValue.removeAllListeners();
    };
  }, [toValue, duration, animatedValue, decimals]);

  return <Text style={style}>{prefix}{displayText}{suffix}</Text>;
};

export default AnimatedNumber; 