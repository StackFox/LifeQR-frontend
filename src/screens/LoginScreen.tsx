import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, Card, SegmentedButtons, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { usePatientStore } from '../store/patientStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Demo credentials
const DEMO_USERS = {
  doctor: {
    id: 'DOC-CHEN',
    email: 'dr.chen@sentinel.health',
    password: 'demo1234',
    name: 'Dr. Robert Chen',
    role: 'DOCTOR' as const,
    hospitalId: 'H-001',
    isVerifiedDoctor: true,
  },
  patient: {
    id: 'P-12345',
    email: 'jane.doe@email.com',
    password: 'demo1234',
    name: 'Jane Doe',
    role: 'PATIENT' as const,
  },
};

export default function LoginScreen({ navigation }: Props) {
  const [role, setRole] = useState<'DOCTOR' | 'PATIENT'>('DOCTOR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setUser = usePatientStore((s) => s.setUser);

  const handleOAuthGoogle = async () => {
    try {
      // Modifying to Mock OAuth flow due to Expo Go native crypto limitations 
      // Clerk OAuth requires Development Build (`npx expo run:android`) to inject ExpoCryptoAES natively.
      Alert.alert(
        'OAuth Auth Defaulted to Demo',
        'Clerk SDK removed because it crashes Expo Go SDK 54 without native builds. Mocking Google Login...',
        [{
          text: 'Continue', onPress: () => {
            setUser(
              role === 'DOCTOR'
                ? {
                  id: 'DOC-UNVERIFIED',
                  name: 'Google Doctor',
                  role,
                  email: 'google@oauth.com',
                  hospitalId: 'H-001',
                  isVerifiedDoctor: false,
                }
                : {
                  id: 'P-67890',
                  name: 'Google Patient',
                  role,
                  email: 'google@oauth.com',
                }
            );
            navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
          }
        }]
      );
    } catch (err) {
      console.error('OAuth error', err);
    }
  };

  const handleLogin = () => {
    setLoading(true);

    // Demo auth — match against demo users
    const demoUser = role === 'DOCTOR' ? DEMO_USERS.doctor : DEMO_USERS.patient;

    setTimeout(() => {
      if (email.toLowerCase() === demoUser.email && password === demoUser.password) {
        if (demoUser.role === 'DOCTOR') {
          setUser({
            id: demoUser.id,
            name: demoUser.name,
            role: demoUser.role,
            email: demoUser.email,
            hospitalId: demoUser.hospitalId,
            isVerifiedDoctor: demoUser.isVerifiedDoctor,
          });
        } else {
          setUser({
            id: demoUser.id,
            name: demoUser.name,
            role: demoUser.role,
            email: demoUser.email,
          });
        }
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else if (email && password) {
        // Accept any credentials for demo
        setUser(
          role === 'DOCTOR'
            ? {
              id: 'DOC-UNVERIFIED',
              name: email.split('@')[0],
              role,
              email,
              hospitalId: 'H-001',
              isVerifiedDoctor: false,
            }
            : {
              id: 'P-67890',
              name: email.split('@')[0],
              role,
              email,
            }
        );
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      } else {
        Alert.alert('Error', 'Enter email and password');
      }
      setLoading(false);
    }, 800);
  };

  const handleDemoLogin = (userType: 'doctor' | 'patient') => {
    const user = DEMO_USERS[userType];
    setRole(user.role);
    setEmail(user.email);
    setPassword(user.password);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.brandName}>SENTINEL</Text>
          <Text style={styles.brandSub}>Clinical Authentication</Text>
        </View>

        {/* ── Role Selector ── */}
        <SegmentedButtons
          value={role}
          onValueChange={(v) => setRole(v as 'DOCTOR' | 'PATIENT')}
          buttons={[
            { value: 'DOCTOR', label: '🩺 Doctor', style: role === 'DOCTOR' ? styles.activeSegment : {} },
            { value: 'PATIENT', label: '👤 Patient', style: role === 'PATIENT' ? styles.activeSegment : {} },
          ]}
          style={styles.segmented}
        />

        {/* ── Login Form ── */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {role === 'DOCTOR' ? '🩺 Doctor Login' : '👤 Patient Login'}
            </Text>
            <Text variant="bodySmall" style={{ color: '#666', marginBottom: 20 }}>
              {role === 'DOCTOR'
                ? 'Access patient records, risk assessments, and emergency data.'
                : 'Manage your health records, QR codes, and consent settings.'}
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginBtn}
              buttonColor="#0a0a1a"
              labelStyle={{ fontWeight: 'bold' }}
            >
              {role === 'DOCTOR' ? 'Access Clinical Portal' : 'Access Health Vault'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Signup')}
              textColor="#333"
              style={{ marginTop: 12 }}
            >
              Don't have an account? Sign up
            </Button>
          </Card.Content>
        </Card>

        {/* ── Demo Quick Access ── */}
        <Card style={styles.demoCard}>
          <Card.Content>
            <Text variant="labelLarge" style={{ fontWeight: 'bold', marginBottom: 12, color: '#B71C1C' }}>
              ⚡ Demo Quick Access
            </Text>

            <Button
              mode="outlined"
              onPress={() => handleDemoLogin('doctor')}
              style={styles.demoBtn}
              icon="stethoscope"
            >
              Login as Dr. Chen
            </Button>

            <Button
              mode="outlined"
              onPress={() => handleDemoLogin('patient')}
              style={styles.demoBtn}
              icon="account"
            >
              Login as Jane Doe
            </Button>

            <Text variant="bodySmall" style={{ color: '#999', marginTop: 8, textAlign: 'center' }}>
              Demo password: demo1234
            </Text>
          </Card.Content>
        </Card>

        {/* ── OAuth Placeholder ── */}
        <View style={styles.oauthSection}>
          <Text variant="labelMedium" style={{ color: '#999', marginBottom: 12 }}>
            Or continue with
          </Text>
          <View style={styles.oauthRow}>
            <Button
              mode="outlined"
              onPress={handleOAuthGoogle}
              style={styles.oauthBtn}
              icon="google"
            >
              Google
            </Button>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('OAuth', 'Hospital SSO — requires SAML/OIDC setup')}
              style={styles.oauthBtn}
              icon="hospital-building"
            >
              Hospital SSO
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  logoIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#B71C1C', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 24 },
  brandName: { fontSize: 24, fontWeight: 'bold', color: '#0a0a1a', letterSpacing: 3 },
  brandSub: { fontSize: 13, color: '#666', marginTop: 4 },

  segmented: { marginBottom: 20 },
  activeSegment: { backgroundColor: '#0a0a1a' },

  card: { marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, elevation: 2 },
  input: { marginBottom: 14, backgroundColor: '#fff' },
  loginBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 4 },

  demoCard: {
    marginBottom: 20, backgroundColor: '#FFF3E0', borderRadius: 16,
    borderWidth: 1, borderColor: '#FFE0B2',
  },
  demoBtn: { marginBottom: 8 },

  oauthSection: { alignItems: 'center' },
  oauthRow: { flexDirection: 'row', gap: 12 },
  oauthBtn: { flex: 1, borderRadius: 10 },
});
