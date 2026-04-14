/**
 * HeroSection Component
 * 
 * Hero section component adapted from glassmorphism-trust-hero.tsx pattern.
 * Features dark background, glassmorphism stats card, marquee client logos,
 * and fade-in animations with delays.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { DELAYS } from '../../utils/animations';
import { GLASS, createGlowStyle } from '../../utils/glassmorphism';
import GradientText from './GradientText';
import Button from './Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Marquee Component for scrolling client logos
 */
const Marquee = ({ items, delay = 0 }) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create infinite scroll animation
    const animate = () => {
      Animated.loop(
        Animated.timing(scrollX, {
          toValue: -SCREEN_WIDTH * 1.5,
          duration: 40000,
          easing: Animated.Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    const timeout = setTimeout(animate, delay);
    return () => {
      clearTimeout(timeout);
    };
  }, [delay, scrollX]);

  return (
    <View style={styles.marqueeContainer}>
      <Animated.View
        style={[
          styles.marqueeContent,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
      >
        {/* Triple the items for seamless loop */}
        {[...items, ...items, ...items].map((item, index) => (
          <View key={`${item.name}-${index}`} style={styles.marqueeItem}>
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.marqueeText}>{item.name}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

/**
 * HeroSection Component
 * 
 * @param {Object} props
 * @param {string} props.title - Main heading text
 * @param {string} props.titleGradient - Text to apply gradient to (part of title)
 * @param {string} props.subtitle - Subtitle text
 * @param {string} props.description - Description text
 * @param {string} props.backgroundImage - Optional background image URL
 * @param {Object} props.stats - Stats card data { value, label, icon }
 * @param {Array} props.clients - Array of client objects { name, icon }
 * @param {Function} props.onPrimaryAction - Callback for primary CTA button
 * @param {Function} props.onSecondaryAction - Callback for secondary CTA button
 * @param {string} props.primaryActionLabel - Primary button label
 * @param {string} props.secondaryActionLabel - Secondary button label
 */
const HeroSection = ({
  title = 'Crafting Digital',
  titleGradient = 'Experiences',
  subtitle = 'That Matter',
  description = 'We design interfaces that combine beauty with functionality, creating seamless experiences that users love and businesses thrive on.',
  backgroundImage,
  stats = {
    value: '150+',
    label: 'Projects Delivered',
    icon: 'target',
    satisfaction: '98%',
  },
  clients = [
    { name: 'Acme Corp', icon: 'hexagon' },
    { name: 'Quantum', icon: 'triangle' },
    { name: 'Command+Z', icon: 'code-tags' },
    { name: 'Phantom', icon: 'ghost' },
    { name: 'Ruby', icon: 'diamond-stone' },
    { name: 'Chipset', icon: 'chip' },
  ],
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel = 'View Portfolio',
  secondaryActionLabel = 'Watch Showreel',
  badgeText = 'Award-Winning Design',
}) => {
  const { colors } = useTheme();
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const fadeAnim5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequential fade-in animations with delays
    Animated.parallel([
      Animated.timing(fadeAnim1, {
        toValue: 1,
        duration: 800,
        delay: DELAYS.delay100,
        easing: Animated.Easing.out(Animated.Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 800,
        delay: DELAYS.delay200,
        easing: Animated.Easing.out(Animated.Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim3, {
        toValue: 1,
        duration: 800,
        delay: DELAYS.delay300,
        easing: Animated.Easing.out(Animated.Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim4, {
        toValue: 1,
        duration: 800,
        delay: DELAYS.delay400,
        easing: Animated.Easing.out(Animated.Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim5, {
        toValue: 1,
        duration: 800,
        delay: DELAYS.delay500,
        easing: Animated.Easing.out(Animated.Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only entrance; fadeAnim refs stable
  }, []);

  const glassColors = colors.glassBackground
    ? {
        background: colors.glassBackground,
        border: colors.glassBorder,
        hover: colors.glassHover,
      }
    : GLASS;

  // Memoize glow style so it's stable and never recreated inside Animated.View;
  // avoids "right cannot be cast from string to double" in animation context.
  const glowStyle = useMemo(
    () => createGlowStyle({
      color: glassColors.background,
      size: 256,
      position: 'top-right',
    }),
    [glassColors.background],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.zinc950 || '#18181B' }]}>
      {/* Background Image with Gradient Mask */}
      {backgroundImage && (
        <ImageBackground
          source={{ uri: backgroundImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', '#000000', '#000000', 'transparent']}
            locations={[0, 0, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      )}

      <View style={styles.content}>
        <View style={styles.grid}>
          {/* LEFT COLUMN */}
          <View style={styles.leftColumn}>
            {/* Badge */}
            <Animated.View
              style={[
                styles.badgeContainer,
                {
                  opacity: fadeAnim1,
                  transform: [{ translateY: fadeAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })}],
                },
              ]}
            >
              <View style={[styles.badge, { borderColor: glassColors.border, backgroundColor: glassColors.background }]}>
                {Platform.OS === 'ios' && (
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                <Text style={styles.badgeText}>
                  {badgeText}
                  <MaterialCommunityIcons name="star" size={14} color="#FCD34D" style={styles.badgeIcon} />
                </Text>
              </View>
            </Animated.View>

            {/* Heading */}
            <Animated.View
              style={[
                styles.headingContainer,
                {
                  opacity: fadeAnim2,
                  transform: [{ translateY: fadeAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })}],
                },
              ]}
            >
              <Text style={styles.heading}>
                {title}
                {'\n'}
                <GradientText colors={['#FFFFFF', '#FFCD75']} direction="to-br" style={styles.heading}>
                  {titleGradient}
                </GradientText>
                {'\n'}
                {subtitle}
              </Text>
            </Animated.View>

            {/* Description */}
            <Animated.View
              style={[
                styles.descriptionContainer,
                {
                  opacity: fadeAnim3,
                  transform: [{ translateY: fadeAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })}],
                },
              ]}
            >
              <Text style={styles.description}>{description}</Text>
            </Animated.View>

            {/* CTA Buttons */}
            <Animated.View
              style={[
                styles.ctaContainer,
                {
                  opacity: fadeAnim4,
                  transform: [{ translateY: fadeAnim4.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })}],
                },
              ]}
            >
              {onPrimaryAction && (
                <Button
                  title={primaryActionLabel}
                  variant="primary"
                  icon="arrow-right"
                  iconPosition="right"
                  onPress={onPrimaryAction}
                  style={styles.primaryButton}
                />
              )}
              {onSecondaryAction && (
                <Button
                  title={secondaryActionLabel}
                  variant="glass"
                  icon="play"
                  onPress={onSecondaryAction}
                  style={styles.secondaryButton}
                />
              )}
            </Animated.View>
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.rightColumn}>
            {/* Stats Card */}
            <Animated.View
              style={[
                styles.statsCardContainer,
                {
                  opacity: fadeAnim5,
                  transform: [{ translateY: fadeAnim5.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })}],
                },
              ]}
            >
              <View style={[styles.statsCard, { borderColor: glassColors.border, backgroundColor: Platform.OS === 'android' ? glassColors.background : 'transparent' }]}>
                {Platform.OS === 'ios' && (
                  <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                {/* Glow Effect - use memoized style to avoid type casting in Animated parent */}
                <View style={glowStyle} />
                
                <View style={styles.statsContent}>
                  <View style={styles.statsHeader}>
                    <View style={[styles.statsIconContainer, { backgroundColor: glassColors.hover }]}>
                      <MaterialCommunityIcons name={stats.icon || 'target'} size={24} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.statsValue}>{stats.value}</Text>
                      <Text style={styles.statsLabel}>{stats.label}</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  {stats.satisfaction && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Client Satisfaction</Text>
                        <Text style={styles.progressValue}>{stats.satisfaction}</Text>
                      </View>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: stats.satisfaction }]} />
                      </View>
                    </View>
                  )}

                  <View style={styles.statsDivider} />

                  {/* Mini Stats Grid */}
                  <View style={styles.miniStatsGrid}>
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>5+</Text>
                      <Text style={styles.miniStatLabel}>Years</Text>
                    </View>
                    <View style={styles.miniStatDivider} />
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>24/7</Text>
                      <Text style={styles.miniStatLabel}>Support</Text>
                    </View>
                    <View style={styles.miniStatDivider} />
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>100%</Text>
                      <Text style={styles.miniStatLabel}>Quality</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Marquee Card */}
            <Animated.View
              style={[
                styles.marqueeCardContainer,
                {
                  opacity: fadeAnim5,
                  transform: [{ translateY: fadeAnim5.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })}],
                },
              ]}
            >
              <View style={[styles.marqueeCard, { borderColor: glassColors.border, backgroundColor: Platform.OS === 'android' ? glassColors.background : 'transparent' }]}>
                {Platform.OS === 'ios' && (
                  <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                <Text style={styles.marqueeTitle}>Trusted by Industry Leaders</Text>
                <Marquee items={clients} delay={DELAYS.delay500} />
              </View>
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 600,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    left: Number(0),
    right: Number(0),
    top: Number(0),
    bottom: Number(0),
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 96,
    paddingBottom: 48,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
  },
  leftColumn: {
    flex: 1,
    minWidth: 300,
    gap: 32,
  },
  rightColumn: {
    flex: 1,
    minWidth: 300,
    gap: 24,
    marginTop: 48,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#D4D4D8',
  },
  badgeIcon: {
    marginLeft: 8,
  },
  headingContainer: {
    marginTop: 8,
  },
  heading: {
    fontSize: 48,
    fontWeight: '500',
    letterSpacing: -1,
    lineHeight: 0.9,
    color: '#FFFFFF',
  },
  descriptionContainer: {
    maxWidth: 500,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    color: '#A1A1AA',
  },
  ctaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    minWidth: 150,
  },
  secondaryButton: {
    flex: 1,
    minWidth: 150,
  },
  statsCardContainer: {
    marginTop: 12,
  },
  statsCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  statsContent: {
    position: 'relative',
    zIndex: 10,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsLabel: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(63, 63, 70, 0.5)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  miniStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  miniStatLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#71717A',
  },
  miniStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  marqueeCardContainer: {
    marginTop: 24,
  },
  marqueeCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 32,
    overflow: 'hidden',
  },
  marqueeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A1A1AA',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  marqueeContainer: {
    overflow: 'hidden',
  },
  marqueeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
    paddingHorizontal: 16,
  },
  marqueeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.5,
  },
  marqueeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HeroSection;
