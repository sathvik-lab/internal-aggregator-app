/**
 * Forgot Password Screen Component
 * 
 * Screen for requesting password reset via email.
 * Integrates with Firebase Authentication service.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
} from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { resetPassword } from '../../services/auth';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { GLASS } from '../../utils/glassmorphism';
import { ROUTES } from '../../navigation/navigationConfig';

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resend cooldown time in seconds
 */
const RESEND_COOLDOWN = 60;

/**
 * ForgotPasswordScreen Component
 * @param {Object} navigation - Navigation object from React Navigation
 */
const ForgotPasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const useGlass = colors.glassBackground != null;
  
  // Form state
  const [email, setEmail] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [authError, setAuthError] = useState('');

  // Timer ref for countdown
  const timerRef = useRef(null);

  /**
   * Validate email format
   * @param {string} emailValue - Email to validate
   * @returns {boolean} True if valid
   */
  const validateEmail = (emailValue) => {
    if (!emailValue.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(emailValue)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  /**
   * Handle email input change
   * @param {string} value - New email value
   */
  const handleEmailChange = (value) => {
    setEmail(value);
    setAuthError('');
    if (emailError) {
      validateEmail(value);
    }
  };

  /**
   * Start resend cooldown timer
   */
  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Handle form submission
   */
  const handleSendResetLink = async () => {
    // Clear previous errors
    setAuthError('');

    // Validate email
    const isEmailValid = validateEmail(email);

    if (!isEmailValid) {
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email.trim());

      if (result.error) {
        // Handle Firebase-specific errors
        const errorCode = result.error.code;
        let errorMessage = result.error.message;

        // Map Firebase error codes to user-friendly messages
        switch (errorCode) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          default:
            errorMessage = result.error.message || 'An error occurred sending the reset email';
        }

        setAuthError(errorMessage);
        setLoading(false);
        return;
      }

      // Success - email sent
      setEmailSent(true);
      setLoading(false);
      startResendCooldown();
    } catch (error) {
      // Handle unexpected errors
      setAuthError('An unexpected error occurred. Please try again');
      setLoading(false);
      console.error('Password reset error:', error);
    }
  };

  /**
   * Handle resend email
   */
  const handleResend = async () => {
    if (resendCooldown > 0) {
      return; // Still in cooldown
    }

    await handleSendResetLink();
  };

  /**
   * Handle back to login
   */
    const handleBackToLogin = () => {
        navigation.navigate(ROUTES.AUTH.LOGIN);
    };

  // Use dark background for glassmorphism
  const backgroundColor = useGlass ? (colors.zinc950 || colors.background) : (colors.background ?? COLORS.background);
  const surfaceStyle = useGlass
    ? [
        styles.surface,
        styles.glassSurface,
        {
          backgroundColor: Platform.OS === 'android' ? (colors.glassBackground ?? GLASS.background) : 'transparent',
          borderColor: colors.glassBorder ?? GLASS.border,
          borderWidth: 1,
          overflow: 'hidden',
          position: 'relative',
        },
      ]
    : [styles.surface, { backgroundColor: colors.surface?.surface ?? COLORS.surface, borderWidth: 0 }];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Surface style={surfaceStyle}>
          {useGlass && Platform.OS === 'ios' && (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          {/* Logo Placeholder */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>IA</Text>
            </View>
            <Text style={styles.appName}>Internal Aggregator</Text>
            <Text style={styles.tagline}>Reset Your Password</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              {emailSent
                ? 'Password reset email sent!'
                : 'Enter your email address and we\'ll send you a link to reset your password.'}
            </Text>

            {!emailSent ? (
              <>
                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsText}>
                    We'll send you an email with instructions on how to reset your password.
                    Please check your inbox and spam folder.
                  </Text>
                </View>

                {/* Email Input */}
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={handleEmailChange}
                  onBlur={() => validateEmail(email)}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={!!emailError}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  editable={!loading}
                  accessibilityLabel="Email input"
                  accessibilityHint="Enter your email address to receive password reset instructions"
                />
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}

                {/* Auth Error Message */}
                {authError ? (
                  <View style={styles.authErrorContainer}>
                    <Text style={styles.authErrorText}>{authError}</Text>
                  </View>
                ) : null}

                {/* Send Reset Link Button */}
                <Button
                  mode="contained"
                  onPress={handleSendResetLink}
                  disabled={loading}
                  loading={loading}
                  style={styles.sendButton}
                  contentStyle={styles.sendButtonContent}
                  buttonColor={COLORS.primary}
                  textColor={COLORS.textInverse}
                  accessibilityLabel="Send reset link button"
                  accessibilityHint="Press to send password reset email"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </>
            ) : (
              <>
                {/* Success Message */}
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>
                    Password reset email sent. Please check your inbox.
                  </Text>
                  <Text style={styles.successSubtext}>
                    If you don't see the email, check your spam folder or try again.
                  </Text>
                </View>

                {/* Resend Section */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive the email? </Text>
                  {resendCooldown > 0 ? (
                    <Text style={styles.cooldownText}>
                      Resend available in {resendCooldown}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={loading}
                      accessibilityLabel="Resend email link"
                    >
                      <Text style={styles.resendLink}>Resend Email</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Change Email Button */}
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEmailSent(false);
                    setEmail('');
                    setAuthError('');
                  }}
                  style={styles.changeEmailButton}
                  contentStyle={styles.changeEmailButtonContent}
                  textColor={COLORS.primary}
                  accessibilityLabel="Change email button"
                >
                  Use Different Email
                </Button>
              </>
            )}

            {/* Back to Login Link */}
            <View style={styles.backToLoginContainer}>
              <TouchableOpacity
                onPress={handleBackToLogin}
                disabled={loading}
                accessibilityLabel="Back to login link"
              >
                <Text style={styles.backToLoginText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  glassSurface: {
    borderRadius: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    borderRadius: 12,
    padding: 24,
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: Number(0), height: Number(2) },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textInverse,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  instructionsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  input: {
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  inputContent: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginBottom: 12,
    marginLeft: 4,
  },
  authErrorContainer: {
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  authErrorText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
  },
  sendButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  sendButtonContent: {
    paddingVertical: 8,
  },
  successContainer: {
    backgroundColor: COLORS.successLight,
    padding: 20,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  cooldownText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  changeEmailButton: {
    marginBottom: 24,
  },
  changeEmailButtonContent: {
    paddingVertical: 8,
  },
  backToLoginContainer: {
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
