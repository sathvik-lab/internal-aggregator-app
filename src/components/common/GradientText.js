/**
 * GradientText Component
 * 
 * Text component with gradient color effects.
 * Uses expo-linear-gradient with MaskedView to create gradient text.
 * Adapts web CSS gradient text patterns to React Native.
 */

import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

// Try to import MaskedView, but fallback to regular text if not available
let MaskedView = null;
try {
  MaskedView = require('@react-native-masked-view/masked-view').default;
} catch (e) {
  // MaskedView not available, will use fallback
}

/**
 * GradientText Component
 * 
 * @param {Object} props
 * @param {string} props.children - Text content
 * @param {Array<string>} props.colors - Gradient colors array (default: white to zinc-400)
 * @param {string} props.direction - Gradient direction: 'to-r', 'to-br', 'to-b', 'to-bl', 'to-l', 'to-tl', 'to-t', 'to-tr' (default: 'to-br')
 * @param {Object} props.style - Additional text styles
 * @param {string} props.fallbackColor - Fallback color if gradient fails (default: white)
 */
const GradientText = ({
  children,
  colors = ['#FFFFFF', '#A1A1AA'], // white to zinc-400
  direction = 'to-br',
  style,
  fallbackColor = '#FFFFFF',
  ...textProps
}) => {
  const { colors: themeColors } = useTheme();
  
  // Calculate gradient angle based on direction
  const getGradientProps = () => {
    const angleMap = {
      'to-r': { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },      // Left to right
      'to-br': { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },     // Top-left to bottom-right
      'to-b': { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },      // Top to bottom
      'to-bl': { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },     // Top-right to bottom-left
      'to-l': { start: { x: 1, y: 0 }, end: { x: 0, y: 0 } },      // Right to left
      'to-tl': { start: { x: 1, y: 1 }, end: { x: 0, y: 0 } },     // Bottom-right to top-left
      'to-t': { start: { x: 0, y: 1 }, end: { x: 0, y: 0 } },      // Bottom to top
      'to-tr': { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },     // Bottom-left to top-right
    };
    
    return angleMap[direction] || angleMap['to-br'];
  };

  const gradientProps = getGradientProps();

  // Use theme gradient colors if available
  const gradientColors = themeColors.gradient?.whiteToZinc || colors;

  // Fallback to solid color if MaskedView is not available
  if (!MaskedView) {
    return (
      <Text style={[styles.text, style, { color: fallbackColor }]} {...textProps}>
        {children}
      </Text>
    );
  }

  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style]} {...textProps}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={gradientColors}
        start={gradientProps.start}
        end={gradientProps.end}
      >
        <Text style={[styles.text, style, { opacity: 0 }]} {...textProps}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  text: {
    backgroundColor: 'transparent',
  },
});

export default GradientText;
