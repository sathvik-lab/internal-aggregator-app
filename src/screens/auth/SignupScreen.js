/**
 * Signup Screen Component
 * 
 * Registration screen for new user signup with email and password.
 * Integrates with Firebase Authentication and creates user profile in Firestore.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Checkbox,
  Surface,
  ProgressBar,
} from 'react-native-paper';
import { signUpUser } from '../../services/auth';
import { createDocument } from '../../services/firestore';
import { COLORS } from '../../constants/colors';
import { USER_ROLES } from '../../constants/constants';

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password strength levels
 */
const PASSWORD_STRENGTH = {
  WEAK: 'weak',
  MEDIUM: 'medium',
  STRONG: 'strong',
};

/**
 * Calculate password strength
 * @param {string} password - Password to analyze
 * @returns {Object} Strength level and score (0-100)
 */
const calculatePasswordStrength = (password) => {
  if (!password) {
    return { level: null, score: 0, label: '' };
  }

  let score = 0;
  const checks = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
  };

  // Score calculation
  if (checks.length) score += 20;
  if (checks.hasNumber) score += 20;
  if (checks.hasSpecialChar) score += 20;
  if (checks.hasUpperCase) score += 20;
  if (checks.hasLowerCase) score += 20;

  let level;
  let label;
  if (score < 40) {
    level = PASSWORD_STRENGTH.WEAK;
    label = 'Weak';
  } else if (score < 80) {
    level = PASSWORD_STRENGTH.MEDIUM;
    label = 'Medium';
  } else {
    level = PASSWORD_STRENGTH.STRONG;
    label = 'Strong';
  }

  return { level, score, label };
};

/**
 * SignupScreen Component
 * @param {Object} navigation - Navigation object from React Navigation
 */
const SignupScreen = ({ navigation }) => {
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [authError, setAuthError] = useState('');

  // Password strength
  const passwordStrength = calculatePasswordStrength(password);

  /**
   * Validate full name
   * @param {string} name - Name to validate
   * @returns {boolean} True if valid
   */
  const validateFullName = (name) => {
    if (!name.trim()) {
      setFullNameError('Full name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setFullNameError('Full name must be at least 2 characters');
      return false;
    }
    setFullNameError('');
    return true;
  };

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
   * Validate password
   * @param {string} passwordValue - Password to validate
   * @returns {boolean} True if valid
   */
  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      setPasswordError('Password is required');
      return false;
    }
    if (passwordValue.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/\d/.test(passwordValue)) {
      setPasswordError('Password must include at least one number');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordValue)) {
      setPasswordError('Password must include at least one special character');
      return false;
    }
    setPasswordError('');
    return true;
  };

  /**
   * Validate confirm password
   * @param {string} confirmPasswordValue - Confirm password to validate
   * @param {string} passwordValue - Original password
   * @returns {boolean} True if valid
   */
  const validateConfirmPassword = (confirmPasswordValue, passwordValue) => {
    if (!confirmPasswordValue) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPasswordValue !== passwordValue) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  /**
   * Handle full name input change
   * @param {string} value - New full name value
   */
  const handleFullNameChange = (value) => {
    setFullName(value);
    setAuthError('');
    if (fullNameError) {
      validateFullName(value);
    }
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
   * Handle password input change
   * @param {string} value - New password value
   */
  const handlePasswordChange = (value) => {
    setPassword(value);
    setAuthError('');
    if (passwordError) {
      validatePassword(value);
    }
    // Clear confirm password error if passwords now match
    if (confirmPassword && value === confirmPassword && confirmPasswordError) {
      setConfirmPasswordError('');
    }
  };

  /**
   * Handle confirm password input change
   * @param {string} value - New confirm password value
   */
  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setAuthError('');
    if (confirmPasswordError) {
      validateConfirmPassword(value, password);
    }
  };

  /**
   * Handle form submission
   */
  const handleSignup = async () => {
    // Clear previous errors
    setAuthError('');

    // Validate all fields
    const isFullNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, password);

    if (!isFullNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    // Check terms acceptance
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue');
      return;
    }

    setLoading(true);

    try {
      // Sign up user with Firebase Auth
      const signupResult = await signUpUser(email.trim(), password, fullName.trim());

      if (signupResult.error) {
        // Handle Firebase-specific errors
        const errorCode = signupResult.error.code;
        let errorMessage = signupResult.error.message;

        // Map Firebase error codes to user-friendly messages
        switch (errorCode) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please use a different email or sign in.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please use a stronger password.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled';
            break;
          default:
            errorMessage = signupResult.error.message || 'An error occurred during sign up';
        }

        setAuthError(errorMessage);
        setLoading(false);
        return;
      }

      const user = signupResult.user;

      // Create user profile in Firestore
      const profileData = {
        userId: user.uid,
        displayName: fullName.trim(),
        email: email.trim(),
        role: USER_ROLES.STAFF, // Default role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const profileResult = await createDocument('users', profileData, user.uid);

      if (profileResult.error) {
        // User created but profile creation failed - still allow login
        console.error('Failed to create user profile:', profileResult.error);
        Alert.alert(
          'Account Created',
          'Your account was created successfully, but there was an issue creating your profile. You can still sign in.',
          [
            {
              text: 'OK',
              onPress: () => {
                // TODO: Navigate to Login screen when navigation is set up
                // navigation.navigate('Login');
                console.log('User created but profile failed:', user);
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Success - account created
      // Auth state will be updated automatically via onAuthStateChanged
      // AppNavigator will automatically navigate to MainNavigator
      console.log('User signed up and profile created:', user);
      setLoading(false);
    } catch (error) {
      // Handle unexpected errors
      setAuthError('An unexpected error occurred. Please try again');
      setLoading(false);
      console.error('Signup error:', error);
    }
  };

  /**
   * Handle login link press
   */
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  /**
   * Get password strength color
   * @returns {string} Color for password strength indicator
   */
  const getPasswordStrengthColor = () => {
    switch (passwordStrength.level) {
      case PASSWORD_STRENGTH.WEAK:
        return COLORS.error;
      case PASSWORD_STRENGTH.MEDIUM:
        return COLORS.warning;
      case PASSWORD_STRENGTH.STRONG:
        return COLORS.success;
      default:
        return COLORS.border;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.surface}>
          {/* Logo Placeholder */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>IA</Text>
            </View>
            <Text style={styles.appName}>Internal Aggregator</Text>
            <Text style={styles.tagline}>Create Your Account</Text>
          </View>

          {/* Signup Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign Up</Text>
            <Text style={styles.subtitle}>Create an account to get started</Text>

            {/* Full Name Input */}
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={handleFullNameChange}
              onBlur={() => validateFullName(fullName)}
              mode="outlined"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              error={!!fullNameError}
              style={styles.input}
              contentStyle={styles.inputContent}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              accessibilityLabel="Full name input"
              accessibilityHint="Enter your full name"
            />
            {fullNameError ? (
              <Text style={styles.errorText}>{fullNameError}</Text>
            ) : null}

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
              accessibilityLabel="Email input"
              accessibilityHint="Enter your email address"
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            {/* Password Input */}
            <TextInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={() => validatePassword(password)}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              error={!!passwordError}
              style={styles.input}
              contentStyle={styles.inputContent}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                />
              }
              accessibilityLabel="Password input"
              accessibilityHint="Enter your password (minimum 8 characters with number and special character)"
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.passwordStrengthHeader}>
                  <Text style={styles.passwordStrengthLabel}>Password Strength:</Text>
                  <Text
                    style={[
                      styles.passwordStrengthText,
                      { color: getPasswordStrengthColor() },
                    ]}
                  >
                    {passwordStrength.label || 'None'}
                  </Text>
                </View>
                <ProgressBar
                  progress={passwordStrength.score / 100}
                  color={getPasswordStrengthColor()}
                  style={styles.passwordStrengthBar}
                />
                <Text style={styles.passwordRequirements}>
                  Must be at least 8 characters with a number and special character
                </Text>
              </View>
            )}

            {/* Confirm Password Input */}
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              onBlur={() => validateConfirmPassword(confirmPassword, password)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
              error={!!confirmPasswordError}
              style={styles.input}
              contentStyle={styles.inputContent}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  accessibilityLabel={
                    showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                  }
                />
              }
              accessibilityLabel="Confirm password input"
              accessibilityHint="Re-enter your password to confirm"
            />
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}

            {/* Terms and Conditions Checkbox */}
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={termsAccepted ? 'checked' : 'unchecked'}
                onPress={() => setTermsAccepted(!termsAccepted)}
                color={COLORS.primary}
                accessibilityLabel="Terms and conditions checkbox"
              />
              <View style={styles.checkboxLabelContainer}>
                <Text style={styles.checkboxText}>I agree to the </Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Terms', 'Terms and conditions will be shown here')}
                  accessibilityLabel="Terms and conditions link"
                >
                  <Text style={styles.checkboxLink}>Terms and Conditions</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Auth Error Message */}
            {authError ? (
              <View style={styles.authErrorContainer}>
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}

            {/* Sign Up Button */}
            <Button
              mode="contained"
              onPress={handleSignup}
              disabled={loading}
              loading={loading}
              style={styles.signupButton}
              contentStyle={styles.signupButtonContent}
              buttonColor={COLORS.primary}
              textColor={COLORS.textInverse}
              accessibilityLabel="Create account button"
              accessibilityHint="Press to create your account"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                accessibilityLabel="Login link"
              >
                <Text style={styles.loginLink}>Login</Text>
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
    shadowOffset: { width: 0, height: 2 },
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
  passwordStrengthContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
  },
  passwordStrengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordStrengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  passwordRequirements: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxLabelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginLeft: 8,
    marginTop: 4,
  },
  checkboxText: {
    fontSize: 14,
    color: COLORS.text,
  },
  checkboxLink: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '500',
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
  signupButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  signupButtonContent: {
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
});

export default SignupScreen;
