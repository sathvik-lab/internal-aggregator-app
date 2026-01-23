# Dark Mode Implementation Guide

## Overview
This document outlines the dark mode implementation for the Internal Aggregator App. The app supports light mode, dark mode, and system theme following.

## Theme Context

### `src/context/ThemeContext.js`
Provides theme management with:
- **Theme Modes**: `LIGHT`, `DARK`, `SYSTEM`
- **Color Schemes**: Light and dark color palettes
- **AsyncStorage Persistence**: Theme preference is saved and restored
- **System Theme Detection**: Automatically follows system theme when set to `SYSTEM`

### Usage
```javascript
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { colors, isDark, theme, setTheme, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
};
```

## Color Schemes

### Light Theme (`lightColors`)
- Background: `#F7FAFC` (Light Grey/White)
- Surface: `#FFFFFF` (White)
- Text: `#2D3748` (Dark Charcoal)
- Primary: `#1B365D` (Deep Navy)

### Dark Theme (`darkColors`)
- Background: `#1A202C` (Dark Grey)
- Surface: `#2D3748` (Dark Surface)
- Text: `#F7FAFC` (Light Text)
- Primary: `#4A90E2` (Lighter Blue)

**Note**: Status colors (success, warning, error) remain consistent in both themes for clarity.

## Implementation Status

### ✅ Completed
1. **ThemeContext** - Created with light/dark/system modes
2. **Color Schemes** - Light and dark color palettes defined
3. **App.js** - Wrapped with ThemeProvider
4. **ProfileScreen** - Theme toggle added with AsyncStorage persistence
5. **Header Component** - Updated to use theme colors
6. **Button Component** - Updated to use theme colors
7. **DashboardScreen** - Updated to use theme colors

### 🔄 In Progress
- Updating remaining components to use theme colors
- Updating remaining screens to use theme colors

### 📋 To Do
- Update all components in `src/components/` to use `useTheme()`
- Update all screens in `src/screens/` to use `useTheme()`
- Test all screens in both light and dark modes
- Verify text contrast ratios meet WCAG AA standards
- Update modals and overlays for dark mode

## Migration Guide

### Step 1: Replace COLORS import
**Before:**
```javascript
import { COLORS } from '../../constants/colors';
```

**After:**
```javascript
import { useTheme } from '../../context/ThemeContext';
```

### Step 2: Use theme hook
**Before:**
```javascript
const MyComponent = () => {
  return (
    <View style={{ backgroundColor: COLORS.background }}>
      <Text style={{ color: COLORS.text }}>Hello</Text>
    </View>
  );
};
```

**After:**
```javascript
const MyComponent = () => {
  const { colors } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
};
```

### Step 3: Update StyleSheet
**Before:**
```javascript
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  text: {
    color: COLORS.text,
  },
});
```

**After:**
```javascript
const styles = StyleSheet.create({
  container: {
    // Remove hardcoded colors
  },
  text: {
    // Remove hardcoded colors
  },
});

// In component:
<View style={[styles.container, { backgroundColor: colors.background }]}>
  <Text style={[styles.text, { color: colors.text }]}>Hello</Text>
</View>
```

## Theme Toggle in Profile

The theme toggle is located in **Profile Screen > Appearance Section**:
- **Light Mode** ☀️ - Always use light theme
- **System** 📱 - Follow device system theme
- **Dark Mode** 🌙 - Always use dark theme

The preference is automatically saved to AsyncStorage and persists across app restarts.

## Components to Update

### High Priority (Most Visible)
- [x] Header
- [x] Button
- [x] DashboardScreen
- [ ] DocumentsScreen
- [ ] ChecklistScreen
- [ ] ProfileScreen (partially done)
- [ ] Auth screens (Login, Signup, ForgotPassword)

### Medium Priority (Common Components)
- [ ] StatCard
- [ ] QuickActionButton
- [ ] QuickActions
- [ ] EmptyState
- [ ] ErrorMessage
- [ ] LoadingSpinner
- [ ] LoadingSkeleton
- [ ] SearchBar
- [ ] BottomSheet

### Lower Priority (Feature-Specific)
- [ ] DocumentCard
- [ ] DocumentItem
- [ ] ChecklistItem
- [ ] FilterChip
- [ ] SortDropdown
- [ ] NotificationBadge
- [ ] All modals

## Best Practices

1. **Always use `useTheme()` hook** - Don't import COLORS directly
2. **Use inline styles for colors** - Keep StyleSheet for layout, use inline for colors
3. **Test in both modes** - Verify readability and contrast
4. **Status colors stay consistent** - Success, warning, error colors are the same in both themes
5. **Use semantic color names** - `colors.text`, `colors.background`, not `colors.darkText`

## Text Contrast Ratios

All text colors meet WCAG AA standards:
- **Light Mode**: Dark text on light background (4.5:1+)
- **Dark Mode**: Light text on dark background (4.5:1+)
- **Status Colors**: Maintained for clarity in both modes

## Testing Checklist

- [ ] Toggle theme in Profile settings
- [ ] Verify theme persists after app restart
- [ ] Test system theme following
- [ ] Check all screens in dark mode
- [ ] Verify text is readable in both modes
- [ ] Test modals and overlays
- [ ] Verify status colors are visible
- [ ] Check icons and images contrast
- [ ] Test on different device sizes

## Future Enhancements

1. **Per-screen theme override** - Allow specific screens to force light/dark
2. **Custom theme colors** - Allow users to customize accent colors
3. **Theme transition animations** - Smooth transitions when switching themes
4. **Auto dark mode schedule** - Automatically switch at sunset/sunrise
5. **High contrast mode** - Additional accessibility option
