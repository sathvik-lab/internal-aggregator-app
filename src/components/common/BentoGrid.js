/**
 * BentoGrid Component
 * 
 * Grid layout component adapted from bento-grid.tsx pattern.
 * Features glass cards with hover/press effects and icon-based feature cards.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GLASS } from '../../utils/glassmorphism';

/**
 * BentoCard Component
 * 
 * @param {Object} props
 * @param {string} props.name - Card title
 * @param {string} props.description - Card description
 * @param {string} props.icon - Icon name from MaterialCommunityIcons
 * @param {Function} props.onPress - Callback when card is pressed
 * @param {Object} props.style - Additional styles
 * @param {React.ReactNode} props.background - Background element (optional)
 */
const BentoCard = ({
  name,
  description,
  icon,
  onPress,
  style,
  background,
  cta,
  href,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const glassColors = colors.glassBackground
    ? {
        background: colors.glassBackground,
        border: colors.glassBorder,
        hover: colors.glassHover,
      }
    : GLASS;

  const handlePressIn = () => {
    if (onPress) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 400,
          friction: 15,
        }),
        Animated.spring(translateYAnim, {
          toValue: -10,
          useNativeDriver: true,
          tension: 400,
          friction: 15,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 400,
          friction: 15,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 400,
          friction: 15,
        }),
      ]).start();
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
        style,
      ]}
    >
      <CardComponent
        style={[
          styles.card,
          {
            backgroundColor: Platform.OS === 'android' ? glassColors.background : 'transparent',
            borderColor: glassColors.border,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={!onPress}
      >
        {Platform.OS === 'ios' && (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        {background && <View style={styles.backgroundContainer}>{background}</View>}
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            {icon && (
              <View style={[styles.iconContainer, { backgroundColor: glassColors.hover }]}>
                <MaterialCommunityIcons
                  name={icon}
                  size={48}
                  color={colors.text?.primary || '#FFFFFF'}
                />
              </View>
            )}
            <Text style={[styles.cardTitle, { color: colors.text?.primary || '#FFFFFF' }]}>
              {name}
            </Text>
          </View>
          {description && (
            <Text style={[styles.cardDescription, { color: colors.text?.secondary || '#A1A1AA' }]}>
              {description}
            </Text>
          )}
        </View>

        {cta && (
          <Animated.View
            style={[
              styles.ctaContainer,
              {
                opacity: translateYAnim.interpolate({
                  inputRange: [-10, 0],
                  outputRange: [1, 0],
                }),
                transform: [
                  {
                    translateY: translateYAnim.interpolate({
                      inputRange: [-10, 0],
                      outputRange: [0, 10],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={onPress}
            >
              <Text style={styles.ctaText}>{cta}</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </CardComponent>
    </Animated.View>
  );
};

/**
 * BentoGrid Component
 * 
 * @param {Object} props
 * @param {Array} props.children - Array of BentoCard elements or data objects
 * @param {number} props.numColumns - Number of columns (default: 3)
 * @param {Object} props.style - Additional styles
 */
const BentoGrid = ({ children, numColumns = 3, style, data }) => {
  // If data prop is provided, render cards from data
  if (data) {
    return (
      <View style={[styles.grid, style]}>
        <FlatList
          data={data}
          numColumns={numColumns}
          keyExtractor={(item, index) => `bento-${index}`}
          renderItem={({ item }) => (
            <BentoCard
              name={item.name}
              description={item.description}
              icon={item.icon}
              onPress={item.onPress}
              background={item.background}
              cta={item.cta}
              style={item.style}
            />
          )}
          contentContainerStyle={styles.gridContent}
          scrollEnabled={false}
        />
      </View>
    );
  }

  // Otherwise render children directly
  return (
    <View style={[styles.grid, style]}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === BentoCard) {
          return React.cloneElement(child, { key: `bento-${index}` });
        }
        return child;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  gridContent: {
    gap: 16,
  },
  cardContainer: {
    flex: 1,
    margin: 8,
    minHeight: 352, // 22rem equivalent
  },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    padding: 24,
    justifyContent: 'space-between',
  },
  backgroundContainer: {
    position: 'absolute',
    left: Number(0),
    right: Number(0),
    top: Number(0),
    bottom: Number(0),
    opacity: 0.6,
  },
  cardContent: {
    zIndex: 10,
    gap: 8,
  },
  cardHeader: {
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    maxWidth: 300,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: Number(16),
    left: Number(16),
    right: Number(16),
    zIndex: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

BentoGrid.Card = BentoCard;

export { BentoCard };
export default BentoGrid;
