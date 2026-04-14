/**
 * ContainerScroll Component
 * 
 * Scroll-based animation container adapted from container-scroll-animation.tsx pattern.
 * Features 3D transforms, perspective effects, and scroll-based animations.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * ContainerScroll Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.titleComponent - Title component or string
 * @param {React.ReactNode} props.children - Content to display in the scrollable card
 * @param {Object} props.style - Additional styles
 */
export const ContainerScroll = ({
  titleComponent,
  children,
  style,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isMobile, setIsMobile] = useState(SCREEN_WIDTH <= 768);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsMobile(window.width <= 768);
    });
    return () => subscription?.remove();
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = scrollY.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [20, 0],
    extrapolate: 'clamp',
  });

  const scale = scrollY.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: scaleDimensions(),
    extrapolate: 'clamp',
  });

  const translate = scrollY.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <Header translate={translate} titleComponent={titleComponent} />
          <Card rotate={rotate} translate={translate} scale={scale}>
            {children}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Header Component
 */
const Header = ({ translate, titleComponent }) => {
  return (
    <Animated.View
      style={[
        styles.header,
        {
          transform: [{ translateY: translate }],
        },
      ]}
    >
      {titleComponent}
    </Animated.View>
  );
};

/**
 * Card Component with 3D transforms
 */
const Card = ({ rotate, scale, children }) => {
  const { colors } = useTheme();
  
  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.zinc900 || '#27272A',
          borderColor: colors.glassBorder || 'rgba(108, 108, 108, 1)',
          transform: [
            { rotateX: rotate },
            { scale },
          ],
        },
      ]}
    >
      <View style={styles.cardContent}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  scrollView: {
    width: '100%',
  },
  content: {
    paddingVertical: 160,
    width: '100%',
  },
  header: {
    maxWidth: 1280,
    alignSelf: 'center',
    marginBottom: 48,
  },
  card: {
    maxWidth: 1280,
    alignSelf: 'center',
    height: 480,
    width: '100%',
    borderWidth: 4,
    borderRadius: 30,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: Number(0), height: Number(9) },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  cardContent: {
    flex: 1,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
});

export default ContainerScroll;
