/**
 * StackingNavbar Component
 * 
 * Navbar with stacking animation adapted from stacking-navbar.tsx pattern.
 * Features translateX animations with staggered delays on press/hover.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { GLASS } from '../../utils/glassmorphism';

/**
 * StackingNavbarItem Component
 */
const StackingNavbarItem = ({
  href,
  children,
  expanded,
  index,
  onPress,
}) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(-100 * index)).current;
  const glassColors = colors.glassBackground
    ? {
        background: colors.glassBackground,
        border: colors.glassBorder,
        hover: colors.glassHover,
      }
    : GLASS;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: expanded ? 0 : -100 * index,
      useNativeDriver: true,
      delay: 0.1 * index,
      tension: 100,
      friction: 8,
    }).start();
  }, [expanded, index, translateX]);

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        {
          transform: [{ translateX }],
          zIndex: 100 - index,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.item,
          {
            backgroundColor: Platform.OS === 'android' ? glassColors.background : 'transparent',
            borderColor: glassColors.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {Platform.OS === 'ios' && (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <Text style={[styles.itemText, { color: colors.text?.primary || '#FFFFFF' }]}>
          {children}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * StackingNavbar Component
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of { href, label } objects
 * @param {Function} props.onItemPress - Callback when item is pressed
 */
const StackingNavbar = ({ items = [], onItemPress }) => {
  const [expanded, setExpanded] = useState(false);

  const handleItemPress = (item, index) => {
    if (onItemPress) {
      onItemPress(item, index);
    }
  };

  return (
    <View
      style={styles.container}
      onTouchStart={() => setExpanded(true)}
      onTouchEnd={() => setTimeout(() => setExpanded(false), 2000)}
    >
      {items.map((item, index) => (
        <StackingNavbarItem
          key={index}
          href={item.href}
          expanded={expanded}
          index={index}
          onPress={() => handleItemPress(item, index)}
        >
          {item.label}
        </StackingNavbarItem>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemContainer: {
    position: 'relative',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StackingNavbar;
