/**
 * ProgressIndicator Component
 * 
 * Multi-step progress indicator adapted from progress-indicator.tsx pattern.
 * Features animated progress bar, expandable buttons, and step indicators.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

/**
 * ProgressIndicator Component
 * 
 * @param {Object} props
 * @param {number} props.totalSteps - Total number of steps (default: 3)
 * @param {Function} props.onStepChange - Callback when step changes
 * @param {Function} props.onContinue - Callback for continue button
 * @param {Function} props.onBack - Callback for back button
 * @param {string} props.continueLabel - Continue button label (default: 'Continue')
 * @param {string} props.finishLabel - Finish button label (default: 'Finish')
 */
const ProgressIndicator = ({
  totalSteps = 3,
  onStepChange,
  onContinue,
  onBack,
  continueLabel = 'Continue',
  finishLabel = 'Finish',
}) => {
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const progressWidth = useRef(new Animated.Value(24)).current;
  const backButtonOpacity = useRef(new Animated.Value(0)).current;
  const backButtonWidth = useRef(new Animated.Value(0)).current;
  const continueButtonFlex = useRef(new Animated.Value(1)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar width
    const widthMap = {
      1: 24,
      2: 60,
      3: 96,
    };
    
    Animated.spring(progressWidth, {
      toValue: widthMap[step] || 24,
      useNativeDriver: false,
      tension: 300,
      friction: 20,
      mass: 0.8,
    }).start();

    // Animate button states
    if (step > 1 && !isExpanded) {
      Animated.parallel([
        Animated.spring(backButtonOpacity, {
          toValue: 1,
          useNativeDriver: false,
          tension: 400,
          friction: 15,
        }),
        Animated.spring(backButtonWidth, {
          toValue: 64,
          useNativeDriver: false,
          tension: 400,
          friction: 15,
        }),
        Animated.spring(continueButtonFlex, {
          toValue: 0,
          useNativeDriver: false,
          tension: 400,
          friction: 15,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.spring(backButtonWidth, {
          toValue: 0,
          useNativeDriver: false,
          tension: 400,
          friction: 15,
        }),
        Animated.spring(continueButtonFlex, {
          toValue: 1,
          useNativeDriver: false,
          tension: 400,
          friction: 15,
        }),
      ]).start();
    }

    // Animate checkmark on finish
    if (step === totalSteps) {
      Animated.spring(checkmarkScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 500,
        friction: 15,
        mass: 0.5,
      }).start();
    } else {
      checkmarkScale.setValue(0);
    }
  }, [step, isExpanded, totalSteps]);

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      setIsExpanded(false);
      onStepChange?.(step + 1);
    }
    onContinue?.(step);
  };

  const handleBack = () => {
    if (step === 2) {
      setIsExpanded(true);
    }
    if (step > 1) {
      setStep(step - 1);
      onStepChange?.(step - 1);
    }
    onBack?.(step);
  };

  return (
    <View style={styles.container}>
      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((dot) => (
          <View
            key={dot}
            style={[
              styles.dot,
              {
                backgroundColor: dot <= step ? '#FFFFFF' : '#D1D5DB',
              },
            ]}
          />
        ))}
        
        {/* Animated Progress Overlay */}
        <Animated.View
          style={[
            styles.progressOverlay,
            {
              width: progressWidth,
              backgroundColor: '#10B981',
            },
          ]}
        />
      </View>

      {/* Buttons Container */}
      <View style={styles.buttonsContainer}>
        <Animated.View
          style={[
            styles.backButtonContainer,
            {
              opacity: backButtonOpacity,
              width: backButtonWidth,
            },
          ]}
        >
          {backButtonOpacity._value > 0 && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface?.surface || '#F3F4F6' }]}
              onPress={handleBack}
            >
              <Text style={[styles.backButtonText, { color: colors.text?.primary || '#000000' }]}>
                Back
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.continueButtonContainer,
            {
              flex: continueButtonFlex,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: step === totalSteps ? '#10B981' : '#006CFF',
                width: isExpanded ? 224 : 176,
              },
            ]}
            onPress={handleContinue}
          >
            <View style={styles.continueButtonContent}>
              {step === totalSteps && (
                <Animated.View
                  style={[
                    styles.checkmarkContainer,
                    {
                      transform: [{ scale: checkmarkScale }],
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
                </Animated.View>
              )}
              <Text style={styles.continueButtonText}>
                {step === totalSteps ? finishLabel : continueLabel}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    position: 'relative',
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'relative',
    zIndex: 10,
  },
  progressOverlay: {
    position: 'absolute',
    left: Number(-8),
    top: Number(8),
    height: 3,
    borderRadius: 9999,
    zIndex: 5,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 384,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonContainer: {
    overflow: 'hidden',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  continueButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProgressIndicator;
