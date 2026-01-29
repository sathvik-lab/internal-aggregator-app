/**
 * BottomSheet Component
 * 
 * Reusable bottom sheet component that slides up from the bottom with backdrop.
 * Supports draggable handle, customizable content, smooth animations, and various height modes.
 * Used for action sheets, filters, forms, and modals throughout the app.
 */

import React, { useEffect, useRef, memo, useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Animated,
    PanResponder,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { GLASS, sanitizeStyleForGestures } from '../../utils/glassmorphism';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * BottomSheet Component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the bottom sheet is visible
 * @param {Function} props.onClose - Callback when sheet is closed
 * @param {React.ReactNode} props.children - Content to display in the sheet
 * @param {string} props.height - Height mode: 'full', 'half', 'auto' (default: 'auto')
 * @param {boolean} props.dismissible - Whether backdrop tap dismisses the sheet (default: true)
 * @param {boolean} props.showHandle - Whether to show drag handle (default: true)
 * @param {string} props.title - Optional title text
 * @param {Object} props.style - Additional styles for the sheet container
 */
const BottomSheet = ({
    visible = false,
    onClose,
    children,
    height = 'auto',
    dismissible = true,
    showHandle = true,
    title,
    style,
    useGlass = true,
}) => {
    const { colors } = useTheme();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const panY = useRef(new Animated.Value(0)).current;
    const lastGestureDy = useRef(0);
    const [internalVisible, setInternalVisible] = useState(false);
    
    const glassColors = colors.glassBackground
        ? {
            background: colors.glassBackground,
            border: colors.glassBorder,
        }
        : GLASS;

    // Memoize sheet height calculation
    const sheetHeight = useMemo(() => {
        switch (height) {
            case 'full':
                return SCREEN_HEIGHT * 0.9; // 90% of screen height
            case 'half':
                return SCREEN_HEIGHT * 0.5; // 50% of screen height
            case 'auto':
            default:
                return null; // Auto height based on content
        }
    }, [height]);

    // Ref for mutable onClose dependency
    const latestOnCloseRef = useRef(onClose);
    
    useEffect(() => {
        latestOnCloseRef.current = onClose;
    }, [onClose]);

    const closeSheetRef = useCallback(() => {
        if (latestOnCloseRef.current) {
            latestOnCloseRef.current();
        }
    }, []);

    // Pan responder for drag gestures
    const panOffsetRef = useRef(0);
    
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to vertical swipes
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderGrant: () => {
                panY.extractOffset();
                panOffsetRef.current = panY._value || 0;
            },
            onPanResponderMove: (_, gestureState) => {
                // Only allow downward dragging
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                    lastGestureDy.current = gestureState.dy;
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                panY.flattenOffset();
                const shouldClose = gestureState.dy > 100 || gestureState.vy > 0.5;
                
                if (shouldClose) {
                    closeSheetRef();
                } else {
                    // Snap back to original position
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 65,
                        friction: 11,
                    }).start();
                }
            },
        })
    ).current;

    // Animate sheet in/out
    useEffect(() => {
        if (visible) {
            setInternalVisible(true);
            // Reset pan value
            panY.setValue(0);
            
            // Animate backdrop fade in
            Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Animate sheet slide up
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else if (internalVisible) {
            // Animate backdrop fade out
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Animate sheet slide down
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start(() => {
                setInternalVisible(false);
            });
        }
    }, [visible, internalVisible]);

    const closeSheet = useCallback(() => {
        if (latestOnCloseRef.current) {
            latestOnCloseRef.current();
        }
    }, []);

    const handleBackdropPress = useCallback(() => {
        if (dismissible) {
            closeSheet();
        }
    }, [dismissible, closeSheet]);

    // Combine slide animation with pan gesture
    const translateY = Animated.add(slideAnim, panY);

    if (!internalVisible) {
        return null;
    }

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={closeSheet}
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Backdrop */}
                <TouchableWithoutFeedback 
                    onPress={handleBackdropPress}
                    accessibilityLabel="Close bottom sheet"
                    accessibilityRole="button"
                >
                    <Animated.View
                        style={[
                            styles.backdrop,
                            {
                                opacity: backdropOpacity,
                            },
                        ]}
                        accessible={false}
                    >
                        {useGlass && Platform.OS === 'ios' && (
                            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        )}
                    </Animated.View>
                </TouchableWithoutFeedback>

                {/* Bottom Sheet */}
                <Animated.View
                    style={[
                        styles.sheet,
                        sheetHeight && { height: sheetHeight },
                        {
                            transform: [{ translateY }],
                        },
                        useGlass && {
                            backgroundColor: Platform.OS === 'android' ? glassColors.background : 'transparent',
                            borderTopWidth: 1,
                            borderTopColor: glassColors.border,
                        },
                        // Sanitize style prop to ensure numeric positioning values
                        style ? sanitizeStyleForGestures(style) : null,
                    ].filter(Boolean)}
                    {...(showHandle ? panResponder.panHandlers : {})}
                >
                    {useGlass && Platform.OS === 'ios' && (
                        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    )}
                    {/* Handle */}
                    {showHandle && (
                        <View 
                            style={styles.handleContainer}
                            accessibilityLabel="Drag handle"
                            accessibilityHint="Drag down to close the bottom sheet"
                            accessibilityRole="none"
                        >
                            <View 
                                style={styles.handle}
                                accessibilityElementsHidden={true}
                                importantForAccessibility="no-hide-descendants"
                            />
                        </View>
                    )}

                    {/* Title (optional) */}
                    {title && (
                        <View style={styles.titleContainer}>
                            <View style={styles.titleContent}>
                                {showHandle && (
                                    <MaterialCommunityIcons
                                        name="drag-horizontal"
                                        size={20}
                                        color={COLORS.textLight}
                                    />
                                )}
                                <View style={styles.titleTextContainer}>
                                    <Text style={styles.titleText}>{title}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={closeSheet}
                                    style={styles.closeButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    accessibilityLabel="Close"
                                    accessibilityHint="Double tap to close the bottom sheet"
                                    accessibilityRole="button"
                                >
                                    <MaterialCommunityIcons
                                        name="close"
                                        size={24}
                                        color={COLORS.textSecondary}
                                        accessibilityElementsHidden={true}
                                        importantForAccessibility="no-hide-descendants"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Content */}
                    <View style={styles.content}>{children}</View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.overlay,
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
        maxHeight: SCREEN_HEIGHT * 0.9,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.border,
        borderRadius: 2,
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    titleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleTextContainer: {
        flex: 1,
        marginLeft: 8,
    },
    titleText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Safe area for iOS
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(BottomSheet);
