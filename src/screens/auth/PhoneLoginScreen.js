import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../navigation/navigationConfig';
import { getFirebaseClientConfig } from '../../services/firebase';
import { confirmPhoneSignInCode, requestPhoneSignInCode } from '../../services/auth';

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const CODE_REGEX = /^\d{6}$/;

const PhoneLoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const recaptchaVerifier = useRef(null);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [authError, setAuthError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

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
    if (!validatePhone(phoneNumber)) return;
    if (!recaptchaVerifier.current) {
      setAuthError('reCAPTCHA not ready. Try again in a moment.');
      return;
    }

    setSendingCode(true);
    const result = await requestPhoneSignInCode({
      phoneNumber: phoneNumber.trim(),
      recaptchaVerifier: recaptchaVerifier.current,
    });
    setSendingCode(false);

    if (result.error) {
      setAuthError(result.error.message);
      return;
    }

    setVerificationId(result.verificationId);
  };

  const handleVerifyCode = async () => {
    setAuthError('');
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={getFirebaseClientConfig()}
        attemptInvisibleVerification={Platform.OS === 'android'}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Sign in with phone</Text>
        <Text style={styles.subtitle}>Android dev build spike using Firebase phone provider.</Text>

        <TextInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={(value) => {
            setPhoneNumber(value);
            setAuthError('');
            if (phoneError) validatePhone(value);
          }}
          onBlur={() => validatePhone(phoneNumber)}
          mode="outlined"
          placeholder="+15555550123"
          autoCapitalize="none"
          keyboardType="phone-pad"
          style={styles.input}
        />
        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

        <Button
          mode="contained"
          onPress={handleSendCode}
          loading={sendingCode}
          disabled={sendingCode}
          style={styles.button}
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
            />
            {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
            <Button
              mode="contained"
              onPress={handleVerifyCode}
              loading={verifyingCode}
              disabled={verifyingCode}
              style={styles.button}
            >
              Verify and Sign In
            </Button>
          </>
        ) : null}

        {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}

        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN)} style={styles.linkWrap}>
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
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  input: { marginBottom: 8, backgroundColor: COLORS.surface },
  button: { marginTop: 8, marginBottom: 12 },
  errorText: { color: COLORS.error, fontSize: 12, marginBottom: 8 },
  authErrorText: { color: COLORS.error, fontSize: 14, marginTop: 8, textAlign: 'center' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  linkText: { color: COLORS.accent, fontWeight: '600' },
});

export default PhoneLoginScreen;
