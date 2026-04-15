import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../navigation/navigationConfig';
import { getFirebaseClientConfig } from '../../services/firebase';
import { confirmPhoneSignInCode, requestPhoneSignInCode } from '../../services/auth';
import { getPhoneAuthBlockReason } from '../../utils/phoneAuthSupport';

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const CODE_REGEX = /^\d{6}$/;

const PhoneLoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const phoneEnvBlock = getPhoneAuthBlockReason();

  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [authError, setAuthError] = useState('');
  const [sendSuccessHint, setSendSuccessHint] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const setRecaptchaRef = useCallback((node) => {
    setRecaptchaVerifier(node);
    setRecaptchaReady(!!node);
  }, []);

  const validatePhone = (value) => {
    if (!value.trim()) {
      setPhoneError('Phone number is required.');
      return false;
    }
    if (!PHONE_REGEX.test(value.trim())) {
      setPhoneError('Use E.164 format, for example +15555550123.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateCode = (value) => {
    if (!value.trim()) {
      setCodeError('Verification code is required.');
      return false;
    }
    if (!CODE_REGEX.test(value.trim())) {
      setCodeError('Enter the 6-digit code.');
      return false;
    }
    setCodeError('');
    return true;
  };

  const handleSendCode = async () => {
    setAuthError('');
    setSendSuccessHint('');
    if (phoneEnvBlock) {
      setAuthError(phoneEnvBlock);
      return;
    }
    if (!validatePhone(phoneNumber)) return;
    if (!recaptchaVerifier) {
      setAuthError('Security check still loading. Try again in a moment.');
      return;
    }

    setSendingCode(true);
    const result = await requestPhoneSignInCode({
      phoneNumber: phoneNumber.trim(),
      recaptchaVerifier,
    });
    setSendingCode(false);

    if (result.error) {
      setAuthError(result.error.message);
      return;
    }

    setVerificationId(result.verificationId);
    setVerificationCode('');
    setSendSuccessHint('Code sent. Enter the SMS code below.');
  };

  const handleVerifyCode = async () => {
    setAuthError('');
    setSendSuccessHint('');
    if (!verificationId) {
      setAuthError('Request a code first.');
      return;
    }
    if (!validateCode(verificationCode)) return;

    setVerifyingCode(true);
    const result = await confirmPhoneSignInCode({
      verificationId,
      verificationCode: verificationCode.trim(),
    });
    setVerifyingCode(false);

    if (result.error) {
      setAuthError(result.error.message);
    }
  };

  const backgroundColor = colors.background ?? COLORS.background;
  const sendDisabled = phoneEnvBlock || sendingCode || verifyingCode || !recaptchaReady;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {!phoneEnvBlock ? (
        <FirebaseRecaptchaVerifierModal
          ref={setRecaptchaRef}
          firebaseConfig={getFirebaseClientConfig()}
          attemptInvisibleVerification={Platform.OS === 'android'}
        />
      ) : null}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Sign in with phone</Text>
        <Text style={styles.subtitle}>
          Firebase phone auth with reCAPTCHA. Use a development or store build; configure Firebase as in FIREBASE_SETUP.md.
        </Text>

        {phoneEnvBlock ? (
          <View style={styles.blockBanner} accessibilityRole="alert">
            <Text style={styles.blockBannerTitle}>Phone sign-in unavailable</Text>
            <Text style={styles.blockBannerBody}>{phoneEnvBlock}</Text>
          </View>
        ) : null}

        {!phoneEnvBlock && !recaptchaReady ? (
          <Text style={styles.hintText} accessibilityLiveRegion="polite">
            Preparing security check (reCAPTCHA)…
          </Text>
        ) : null}

        <TextInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={(value) => {
            setPhoneNumber(value);
            setAuthError('');
            setSendSuccessHint('');
            if (phoneError) validatePhone(value);
          }}
          onBlur={() => validatePhone(phoneNumber)}
          mode="outlined"
          placeholder="+15555550123"
          autoCapitalize="none"
          keyboardType="phone-pad"
          style={styles.input}
          editable={!sendingCode && !verifyingCode}
          accessibilityLabel="Phone number input"
          accessibilityHint="Enter phone in E164 format including country code"
        />
        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

        <Button
          mode="contained"
          onPress={handleSendCode}
          loading={sendingCode}
          disabled={sendDisabled}
          style={styles.button}
          accessibilityLabel={verificationId ? 'Resend SMS code' : 'Send SMS code'}
          accessibilityHint="Sends a verification code to your phone number"
        >
          {verificationId ? 'Resend Code' : 'Send Code'}
        </Button>

        {verificationId ? (
          <>
            <TextInput
              label="Verification Code"
              value={verificationCode}
              onChangeText={(value) => {
                setVerificationCode(value);
                setAuthError('');
                if (codeError) validateCode(value);
              }}
              onBlur={() => validateCode(verificationCode)}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.input}
              editable={!verifyingCode && !sendingCode}
              accessibilityLabel="SMS verification code"
              accessibilityHint="Enter the six digit code from your text message"
            />
            {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
            <Button
              mode="contained"
              onPress={handleVerifyCode}
              loading={verifyingCode}
              disabled={verifyingCode || sendingCode}
              style={styles.button}
              accessibilityLabel="Verify code and sign in"
              accessibilityHint="Confirms the SMS code and completes sign in"
            >
              Verify and Sign In
            </Button>
          </>
        ) : null}

        {sendSuccessHint ? (
          <Text style={styles.successText} accessibilityRole="text">
            {sendSuccessHint}
          </Text>
        ) : null}
        {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}

        <TouchableOpacity
          onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN)}
          style={styles.linkWrap}
          accessibilityLabel="Back to email sign in"
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Back to Email Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
  blockBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  blockBannerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  blockBannerBody: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  hintText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  input: { marginBottom: 8, backgroundColor: COLORS.surface },
  button: { marginTop: 8, marginBottom: 12 },
  errorText: { color: COLORS.error, fontSize: 12, marginBottom: 8 },
  successText: { color: COLORS.primary, fontSize: 14, marginTop: 4, textAlign: 'center' },
  authErrorText: { color: COLORS.error, fontSize: 14, marginTop: 8, textAlign: 'center' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  linkText: { color: COLORS.accent, fontWeight: '600' },
});

export default PhoneLoginScreen;
