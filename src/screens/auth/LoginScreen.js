/**
 * Login Screen Component
 * 
 * Authentication screen for user login with email and password.
 * Integrates with Firebase Authentication service.
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
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { signInUser } from '../../services/auth';
import { COLORS } from '../../constants/colors';

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * LoginScreen Component
 * @param {Object} navigation - Navigation object from React Navigation
 */
const LoginScreen = ({ navigation }) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');

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
   * Must match signup requirements for consistency
   * @param {string} passwordValue - Password to validate
   * @returns {boolean} True if valid
   */
  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      setPasswordError('Password is required');
      return false;
    }
    // Match signup validation requirements: min 8 chars, number, and special character
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
   * Handle email input change
   * @param {string} value - New email value
   */
  const handleEmailChange = (value) => {
    setEmail(value);
    setAuthError(''); // Clear auth error when user types
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
    setAuthError(''); // Clear auth error when user types
    if (passwordError) {
      validatePassword(value);
    }
  };

  /**
   * Handle form submission
   */
  const handleLogin = async () => {
    // Clear previous errors
    setAuthError('');
    
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const result = await signInUser(email.trim(), password);

      if (result.error) {
        // Handle Firebase-specific errors
        const errorCode = result.error.code;
        let errorMessage = result.error.message;

        // Map Firebase error codes to user-friendly messages
        switch (errorCode) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection';
            break;
          default:
            errorMessage = result.error.message || 'An error occurred during login';
        }

        setAuthError(errorMessage);
        setLoading(false);
        return;
      }

      // Success - user is logged in
      // Auth state will be updated automatically via onAuthStateChanged
      // AppNavigator will automatically navigate to MainNavigator
      console.log('User logged in:', result.user);
      setLoading(false);
    } catch (error) {
      // Handle unexpected errors
      setAuthError('An unexpected error occurred. Please try again');
      setLoading(false);
      console.error('Login error:', error);
    }
  };

  /**
   * Handle forgot password link press
   */
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  /**
   * Handle sign up link press
   */
  const handleSignUp = () => {
    navigation.navigate('Signup');
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
            <Text style={styles.tagline}>Compliance Management</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

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
              autoComplete="password"
              textContentType="password"
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
              accessibilityHint="Enter your password"
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsContainer}>
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={rememberMe ? 'checked' : 'unchecked'}
                  onPress={() => setRememberMe(!rememberMe)}
                  color={COLORS.primary}
                  accessibilityLabel="Remember me checkbox"
                />
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  style={styles.checkboxLabel}
                  accessibilityLabel="Remember me"
                >
                  <Text style={styles.checkboxText}>Remember Me</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={loading}
                accessibilityLabel="Forgot password link"
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Auth Error Message */}
            {authError ? (
              <View style={styles.authErrorContainer}>
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              buttonColor={COLORS.primary}
              textColor={COLORS.textInverse}
              accessibilityLabel="Login button"
              accessibilityHint="Press to sign in with your credentials"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={loading}
                accessibilityLabel="Sign up link"
              >
                <Text style={styles.signUpLink}>Sign up</Text>
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  checkboxText: {
    fontSize: 14,
    color: COLORS.text,
  },
  forgotPasswordText: {
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
  loginButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signUpLink: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
});

export default LoginScreen;
