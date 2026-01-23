/**
 * LoadingSkeleton Component
 * 
 * Skeleton loading component for displaying while data is being fetched.
 * Provides visual feedback during loading states.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { COLORS } from '../../constants/colors';

/**
 * Shimmer Skeleton Item Component
 * Individual skeleton item with shimmer animation
 */
const ShimmerSkeletonItem = ({ style, delay = 0 }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
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
        };

        startAnimation();
    }, [shimmerAnim, delay]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View style={[style, { opacity }]} />
    );
};

/**
 * LoadingSkeleton Component
 * 
 * @param {Object} props
 * @param {string} props.type - Type of skeleton ('card', 'list', 'stat')
 * @param {number} props.count - Number of skeleton items to show
 */
const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
    if (type === 'stat') {
        return (
            <View style={styles.statsSkeleton}>
                {[...Array(count)].map((_, index) => (
                    <ShimmerSkeletonItem
                        key={index}
                        style={styles.statCardSkeleton}
                        delay={index * 100}
                    />
                ))}
            </View>
        );
    }

    if (type === 'list') {
        return (
            <View>
                {[...Array(count)].map((_, index) => (
                    <ShimmerSkeletonItem
                        key={index}
                        style={styles.listItemSkeleton}
                        delay={index * 100}
                    />
                ))}
            </View>
        );
    }

    // Default card skeleton
    return (
        <View style={styles.cardSkeleton}>
            <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
    );
};

const styles = StyleSheet.create({
    statsSkeleton: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCardSkeleton: {
        width: '48%',
        height: 160,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        opacity: 0.6,
    },
    listItemSkeleton: {
        height: 80,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        opacity: 0.6,
    },
    cardSkeleton: {
        height: 200,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.6,
    },
});

export default LoadingSkeleton;
