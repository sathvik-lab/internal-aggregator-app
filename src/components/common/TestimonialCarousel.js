/**
 * TestimonialCarousel Component
 * 
 * Swipeable carousel adapted from testimonial.tsx pattern.
 * Features drag gestures, layered cards, and glass surfaces.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GLASS } from '../../utils/glassmorphism';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 320;

/**
 * TestimonialCarousel Component
 * 
 * @param {Object} props
 * @param {Array} props.testimonials - Array of { id, name, avatar, description } objects
 * @param {boolean} props.showArrows - Whether to show navigation arrows (default: true)
 * @param {boolean} props.showDots - Whether to show dot indicators (default: true)
 * @param {Object} props.style - Additional styles
 */
const TestimonialCarousel = ({
  testimonials = [],
  showArrows = true,
  showDots = true,
  style,
}) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitX, setExitX] = useState(0);
  
  const glassColors = colors.glassBackground
    ? {
        background: colors.glassBackground,
        border: colors.glassBorder,
      }
    : GLASS;

  const handleSwipeLeft = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handleSwipeRight = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const getCardStyle = (index) => {
    const isCurrentCard = index === currentIndex;
    const isPrevCard = index === (currentIndex + 1) % testimonials.length;
    const isNextCard = index === (currentIndex + 2) % testimonials.length;

    if (!isCurrentCard && !isPrevCard && !isNextCard) {
      return { opacity: 0, transform: [{ scale: 0.8 }] };
    }

    return {
      zIndex: isCurrentCard ? 3 : isPrevCard ? 2 : 1,
      opacity: isCurrentCard ? 1 : isPrevCard ? 0.6 : 0.3,
      transform: [
        { scale: isCurrentCard ? 1 : 0.95 },
        { translateY: isCurrentCard ? 0 : isPrevCard ? 8 : 16 },
      ],
    };
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.carouselContainer}>
        {testimonials.map((testimonial, index) => {
          const cardStyle = getCardStyle(index);
          if (cardStyle.display === 'none') return null;

          return (
            <TouchableOpacity
              key={testimonial.id}
              activeOpacity={0.9}
              onPress={() => {
                if (index === currentIndex) {
                  handleSwipeLeft();
                }
              }}
            >
              <Animated.View
                style={[
                  styles.card,
                  {
                    backgroundColor: Platform.OS === 'android' ? glassColors.background : 'transparent',
                    borderColor: glassColors.border,
                    ...cardStyle,
                  },
                ]}
              >
                {Platform.OS === 'ios' && (
                  <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                

                <View style={styles.cardContent}>
                  {testimonial.avatar && (
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarPlaceholder}>
                        {testimonial.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.name, { color: colors.text?.primary || '#1F2937' }]}>
                    {testimonial.name}
                  </Text>
                  <Text style={[styles.description, { color: colors.text?.secondary || '#6B7280' }]}>
                    {testimonial.description}
                  </Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
        
        {showArrows && (
          <View style={styles.arrowButtons}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={handleSwipeRight}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text?.primary || '#FFFFFF'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={handleSwipeLeft}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text?.primary || '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        )}
        
        {showDots && (
          <View style={styles.dots}>
            {testimonials.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentIndex(index)}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === currentIndex
                          ? colors.primary || '#3B82F6'
                          : colors.border?.default || '#D1D5DB',
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 288,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselContainer: {
    width: CARD_WIDTH,
    height: 256,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  arrowButtons: {
    position: 'absolute',
    top: Number(8),
    left: Number(0),
    right: Number(0),
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardContent: {
    padding: 24,
    flex: 1,
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  dots: {
    position: 'absolute',
    bottom: Number(-32),
    left: Number(0),
    right: Number(0),
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TestimonialCarousel;
