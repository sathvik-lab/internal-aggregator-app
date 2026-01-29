/**
 * Animation Utilities
 * 
 * Reusable animation presets and helpers for glassmorphism design system.
 * Adapts web animations (framer-motion, CSS @keyframes) to React Native Animated API.
 */

import { Animated, Easing } from 'react-native';

// Animation timing presets
export const TIMING = {
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 800,
};

// Animation easing presets
export const EASING = {
  easeOut: Easing.out(Easing.ease),
  easeIn: Easing.in(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  spring: Easing.elastic(1),
  bounce: Easing.bounce(1),
};

/**
 * Creates a fadeSlideIn animation
 * Matches CSS: @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(20px); } }
 * 
 * Note: This returns an object with opacity and translateY animated values.
 * Use it like: const { opacity, translateY } = fadeSlideIn({ delay: 100 });
 * 
 * @param {Object} options
 * @param {number} options.duration - Animation duration in ms (default: 800)
 * @param {number} options.delay - Delay before animation starts in ms (default: 0)
 * @param {number} options.translateY - Initial translateY offset (default: 20)
 * @param {Function} options.easing - Easing function (default: easeOut)
 * @returns {Object} Object with { opacity: Animated.Value, translateY: Animated.Value, start: Function }
 */
export const fadeSlideIn = ({
  duration = 800,
  delay = 0,
  translateY = 20,
  easing = EASING.easeOut,
} = {}) => {
  const opacity = new Animated.Value(0);
  const translateYValue = new Animated.Value(translateY);

  const start = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(translateYValue, {
        toValue: 0,
        duration,
        delay,
        easing,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { opacity, translateY: translateYValue, start };
};

/**
 * Creates a marquee animation for horizontal scrolling
 * Infinite scroll pattern for client logos, testimonials, etc.
 * 
 * @param {Object} animatedValue - Animated.Value instance
 * @param {Object} options
 * @param {number} options.duration - Duration for one cycle in ms (default: 40000)
 * @param {number} options.translateX - Distance to translate (default: -50%)
 * @returns {Animated.CompositeAnimation} Animation instance
 */
export const marquee = (
  animatedValue,
  {
    duration = 40000,
    translateX = -50,
  } = {}
) => {
  animatedValue.setValue(0);

  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: translateX,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Creates a scale animation (for button press, hover effects)
 * Matches CSS: scale-[1.02] on hover, scale-[0.98] on active
 * 
 * @param {Object} animatedValue - Animated.Value instance
 * @param {Object} options
 * @param {number} options.toValue - Target scale value (default: 1.02)
 * @param {number} options.duration - Animation duration (default: 200)
 * @returns {Animated.CompositeAnimation} Animation instance
 */
export const scaleAnimation = (
  animatedValue,
  {
    toValue = 1.02,
    duration = 200,
  } = {}
) => {
  animatedValue.setValue(1);

  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.easeOut,
    useNativeDriver: true,
  });
};

/**
 * Creates a spring animation for smooth, natural motion
 * Useful for card transitions, drag releases, etc.
 * 
 * @param {Object} animatedValue - Animated.Value instance
 * @param {Object} options
 * @param {number} options.toValue - Target value
 * @param {number} options.tension - Spring tension (default: 300)
 * @param {number} options.friction - Spring friction (default: 20)
 * @returns {Animated.CompositeAnimation} Animation instance
 */
export const springAnimation = (
  animatedValue,
  {
    toValue,
    tension = 300,
    friction = 20,
  } = {}
) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  });
};

/**
 * Creates a stacking animation (for navbar items)
 * TranslateX with staggered delays
 * 
 * @param {Object} animatedValue - Animated.Value instance
 * @param {Object} options
 * @param {number} options.index - Item index for delay calculation
 * @param {number} options.baseDelay - Base delay in ms (default: 100)
 * @param {number} options.translateX - Initial translateX offset (default: -100)
 * @param {number} options.duration - Animation duration (default: 600)
 * @returns {Animated.CompositeAnimation} Animation instance
 */
export const stackingAnimation = (
  animatedValue,
  {
    index = 0,
    baseDelay = 100,
    translateX = -100,
    duration = 600,
  } = {}
) => {
  animatedValue.setValue(translateX * index);

  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay: baseDelay * index,
    easing: EASING.easeInOut,
    useNativeDriver: true,
  });
};

/**
 * Creates delay utility for sequential animations
 * 
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Animation delay constants (matching CSS delay classes)
 */
export const DELAYS = {
  delay100: 100,
  delay200: 200,
  delay300: 300,
  delay400: 400,
  delay500: 500,
};

/**
 * Creates an animated value with initial values
 * Helper for components that need multiple animated values
 * 
 * @param {Object} initialValues - Initial values object
 * @returns {Object} Object with Animated.Value instances
 */
export const createAnimatedValues = (initialValues = {}) => {
  const values = {};
  Object.keys(initialValues).forEach((key) => {
    values[key] = new Animated.Value(initialValues[key]);
  });
  return values;
};

/**
 * Helper to create scroll-based animations
 * For use with Animated.ScrollView
 * 
 * @param {Object} scrollY - Animated.Value from scroll event
 * @param {Object} options
 * @param {number} options.inputRange - Input range array [min, max]
 * @param {number} options.outputRange - Output range array [min, max]
 * @returns {Animated.AnimatedInterpolation} Interpolated value
 */
export const createScrollAnimation = (
  scrollY,
  {
    inputRange = [0, 1],
    outputRange = [0, 1],
  } = {}
) => {
  return scrollY.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  });
};

export default {
  TIMING,
  EASING,
  DELAYS,
  fadeSlideIn,
  marquee,
  scaleAnimation,
  springAnimation,
  stackingAnimation,
  delay,
  createAnimatedValues,
  createScrollAnimation,
};
