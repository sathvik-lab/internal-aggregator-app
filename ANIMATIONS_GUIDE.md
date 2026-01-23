# Animations & Micro-interactions Guide

## Overview
This document outlines all animations and micro-interactions implemented throughout the Internal Aggregator App to enhance user experience and provide delightful feedback.

## Animation Philosophy
- **Subtle & Performant**: All animations are subtle and use native driver when possible
- **Purposeful**: Every animation serves a purpose (feedback, state change, loading)
- **Consistent**: Similar interactions have consistent animation patterns
- **Accessible**: Animations respect user preferences and don't interfere with accessibility

## Implemented Animations

### 1. Button Press Feedback

#### Components with Press Animations
- ✅ **Button** (`src/components/common/Button.js`)
- ✅ **QuickActionButton** (`src/components/common/QuickActionButton.js`)
- ✅ **StatCard** (`src/components/common/StatCard.js`)

#### Implementation
- **Scale Animation**: Buttons scale down to 0.95 on press, then spring back to 1.0
- **Spring Physics**: Uses `Animated.spring` with tension: 300, friction: 10
- **Native Driver**: All animations use `useNativeDriver: true` for 60 FPS

#### Code Pattern
```javascript
const scaleAnim = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
    Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
    }).start();
};

const handlePressOut = () => {
    Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
    }).start();
};
```

### 2. Success Checkmark Animation

#### Components
- ✅ **ChecklistItem** - Animated checkmark when task is completed
- ✅ **UploadDocumentModal** - Success animation after document upload

#### ChecklistItem Checkmark
- **Scale Animation**: Checkmark scales from 0 to 1 with spring physics
- **Pulse Effect**: Brief pulse animation (1.15x scale) when item is completed
- **Timing**: 200ms for checkmark appearance, 500ms total pulse sequence

#### UploadDocumentModal Success
- **Multi-stage Animation**:
  1. Container scales and fades in (300ms)
  2. Checkmark icon scales in with bounce (spring animation)
  3. Success message slides up and fades in
- **Auto-close**: Modal closes automatically after 1.5 seconds

#### Code Pattern
```javascript
// Checkmark scale animation
Animated.spring(checkmarkScale, {
    toValue: 1,
    useNativeDriver: true,
    tension: 200,
    friction: 5,
}).start();

// Success pulse
Animated.sequence([
    Animated.timing(successPulse, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
    }),
    Animated.timing(successPulse, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
    }),
]).start();
```

### 3. List Item Enter/Exit Animations

#### Components
- ✅ **DocumentCard** - Fade-in and slide-up animation
- ✅ **ChecklistItem** - Fade-in and slide-up animation

#### Implementation
- **Fade-in**: Opacity animates from 0 to 1 (300ms)
- **Slide-up**: Items slide up from 20px below (300ms)
- **Staggered**: Items appear with slight delays for visual interest
- **Parallel Animation**: Fade and slide happen simultaneously

#### Code Pattern
```javascript
const fadeAnim = useRef(new Animated.Value(0)).current;
const slideAnim = useRef(new Animated.Value(20)).current;

useEffect(() => {
    Animated.parallel([
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }),
    ]).start();
}, [fadeAnim, slideAnim]);
```

### 4. Loading Skeleton Shimmer

#### Component
- ✅ **LoadingSkeleton** (`src/components/common/LoadingSkeleton.js`)

#### Implementation
- **Shimmer Effect**: Opacity animates between 0.3 and 0.7
- **Loop Animation**: Continuous loop for loading state
- **Staggered Delay**: Each skeleton item has a 100ms delay for wave effect
- **Smooth Transition**: 1 second fade in, 1 second fade out

#### Code Pattern
```javascript
const shimmerAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
    Animated.loop(
        Animated.sequence([
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1000,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(shimmerAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
        ])
    ).start();
}, [shimmerAnim, delay]);

const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
});
```

### 5. Pull-to-Refresh Enhancements

#### Screens
- ✅ **DocumentsScreen**
- ✅ **DashboardScreen**
- ✅ **ChecklistScreen**

#### Enhancements
- **Custom Colors**: Uses app primary color for spinner
- **Progress Background**: Custom background color for Android
- **Offset**: Proper offset for Android status bar
- **Smooth Animation**: Native RefreshControl animations

#### Implementation
```javascript
<RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    tintColor={COLORS.primary}
    colors={[COLORS.primary]}
    progressViewOffset={Platform.OS === 'android' ? 20 : 0}
    progressBackgroundColor={COLORS.surface}
/>
```

### 6. Swipe Gesture Feedback

#### Component
- ✅ **ChecklistItem** - Swipe left to complete, swipe right to snooze

#### Implementation
- **Action Reveal**: Swipe actions fade in as user swipes
- **Threshold**: 100px swipe distance triggers action
- **Spring Back**: Smooth spring animation when threshold not met
- **Action Animation**: Card slides off screen when action triggered

#### Code Pattern
```javascript
const swipeAnimation = useRef(new Animated.Value(0)).current;

// Swipe left to complete
if (dx < -SWIPE_THRESHOLD && onToggleComplete) {
    Animated.spring(swipeAnimation, {
        toValue: -SCREEN_WIDTH,
        useNativeDriver: true,
    }).start(() => {
        onToggleComplete(item);
        swipeAnimation.setValue(0);
    });
}
```

### 7. Page Transition Animations

#### Navigation
- ✅ **AuthNavigator** - Enhanced spring transitions
- ✅ **MainNavigator** - Smooth stack transitions

#### Implementation
- **Spring Physics**: Uses spring animations instead of timing
- **Slide Animation**: Cards slide in from right
- **Overlay Fade**: Backdrop fades in/out smoothly
- **Config**: Stiffness: 1000, Damping: 500, Mass: 3

#### Code Pattern
```javascript
transitionSpec: {
    open: {
        animation: 'spring',
        config: {
            stiffness: 1000,
            damping: 500,
            mass: 3,
            overshootClamping: true,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
        },
    },
    close: {
        animation: 'spring',
        config: {
            stiffness: 1000,
            damping: 500,
            mass: 3,
            overshootClamping: true,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
        },
    },
},
```

### 8. Expandable Card Animations

#### Component
- ✅ **ChecklistItem** - Expand/collapse animation

#### Implementation
- **Height Animation**: Content height animates smoothly
- **Spring Physics**: Natural spring animation
- **Chevron Rotation**: Chevron icon rotates 180° when expanded
- **Duration**: ~300ms for smooth feel

#### Code Pattern
```javascript
const expandAnimation = useRef(new Animated.Value(0)).current;

React.useEffect(() => {
    Animated.spring(expandAnimation, {
        toValue: expanded ? 1 : 0,
        useNativeDriver: false, // Height requires layout animation
        tension: 100,
        friction: 8,
    }).start();
}, [expanded]);
```

## Animation Performance

### Best Practices
1. **Use Native Driver**: Always use `useNativeDriver: true` when possible
2. **Avoid Layout Animations**: Only use layout animations when necessary (height, width)
3. **Debounce Rapid Actions**: Prevent animation conflicts from rapid taps
4. **Clean Up Animations**: Stop animations on unmount
5. **Optimize Spring Config**: Tune spring parameters for smooth 60 FPS

### Performance Metrics
- **Button Press**: < 16ms (60 FPS)
- **List Item Enter**: 300ms (smooth)
- **Checkmark Animation**: 200ms (snappy)
- **Page Transition**: ~400ms (natural)

## Animation Timing

### Duration Guidelines
- **Micro-interactions**: 100-200ms (button press, hover)
- **State Changes**: 200-300ms (checkmark, expand)
- **Page Transitions**: 300-400ms (navigation)
- **Loading States**: Continuous (skeleton shimmer)

### Easing Functions
- **Spring**: Natural, bouncy feel (buttons, checkmarks)
- **Ease-in-out**: Smooth acceleration/deceleration (transitions)
- **Linear**: Constant speed (loading indicators)

## Accessibility Considerations

### Reduced Motion
- Animations respect `prefers-reduced-motion` (future implementation)
- Critical animations remain but are simplified
- Loading states always visible regardless of motion preference

### Screen Readers
- Animations don't interfere with screen reader announcements
- Success animations include haptic feedback (future)
- Visual feedback is supplemented with audio cues

## Future Enhancements

### Planned Animations
1. **Haptic Feedback**: Add vibration on button press (iOS/Android)
2. **Lottie Animations**: Replace some icons with Lottie animations
3. **Shared Element Transitions**: Smooth transitions between screens
4. **Gesture Animations**: Enhanced swipe feedback with haptics
5. **Loading States**: More sophisticated loading animations
6. **Error Animations**: Shake animation for error states
7. **Success Confetti**: Celebration animation for major achievements

### Performance Improvements
1. **React Native Reanimated**: Migrate to Reanimated 3 for better performance
2. **Worklets**: Use worklets for gesture-driven animations
3. **Layout Animations**: Use LayoutAnimation for list updates
4. **Interaction Manager**: Defer non-critical animations

## Testing Checklist

### Animation Testing
- [ ] Test all button press animations
- [ ] Verify checkmark animations trigger correctly
- [ ] Test list item enter animations
- [ ] Verify loading skeleton shimmer
- [ ] Test pull-to-refresh on both platforms
- [ ] Verify swipe gestures work smoothly
- [ ] Test page transitions between screens
- [ ] Verify expand/collapse animations

### Performance Testing
- [ ] Monitor FPS during animations (target: 60 FPS)
- [ ] Test on low-end devices
- [ ] Verify no jank during rapid interactions
- [ ] Check memory usage during animations
- [ ] Test with multiple animations running simultaneously

### Accessibility Testing
- [ ] Verify animations don't interfere with screen readers
- [ ] Test with reduced motion preferences
- [ ] Ensure all feedback is accessible
- [ ] Verify haptic feedback (if implemented)

## Common Issues & Solutions

### Issue 1: Animation Jank
**Symptoms**: Animations stutter or drop frames
**Solution**: 
- Use `useNativeDriver: true`
- Reduce animation complexity
- Avoid layout animations when possible
- Use `InteractionManager` for non-critical animations

### Issue 2: Animation Not Triggering
**Symptoms**: Animation doesn't start
**Solution**:
- Check animation value initialization
- Verify `useEffect` dependencies
- Ensure animation is not already running
- Check for conflicting animations

### Issue 3: Animation Too Fast/Slow
**Symptoms**: Animation feels unnatural
**Solution**:
- Adjust spring parameters (tension, friction)
- Tune timing duration
- Test on real devices (simulators may differ)
- Get user feedback

### Issue 4: Memory Leaks
**Symptoms**: App slows down over time
**Solution**:
- Clean up animations on unmount
- Stop animations before starting new ones
- Use `useRef` for animation values
- Avoid creating new animations in render

## Resources

### Documentation
- [React Native Animated API](https://reactnative.dev/docs/animated)
- [React Navigation Transitions](https://reactnavigation.org/docs/stack-navigator/#animations)
- [Spring Animation Guide](https://reactnative.dev/docs/animated#spring)

### Tools
- React Native Performance Monitor
- Flipper Animation Inspector
- Chrome DevTools Performance Tab

## Notes

- All animations use React Native's built-in `Animated` API
- No external animation libraries required
- Animations are optimized for 60 FPS
- All animations respect platform conventions (iOS/Android)
- Future: Consider migrating to `react-native-reanimated` for complex gestures
