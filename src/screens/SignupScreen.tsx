import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, Card, SegmentedButtons } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [role, setRole] = useState<'DOCTOR' | 'PATIENT'>('PATIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nmcNumber, setNmcNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (role === 'DOCTOR' && !nmcNumber) {
      Alert.alert('Error', 'Doctor registration requires an NMC number for verification');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      
      const uniqueId = role === 'PATIENT' ? `P-${Math.floor(10000 + Math.random() * 90000)}` : `D-${Math.floor(1000 + Math.random() * 9000)}`;
      
      Alert.alert(
        'Account Created',
        `Successfully registered as ${role}.\nYour unique ID is: ${uniqueId}`,
        [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]
      );
    }, 1000);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brandName}>SENTINEL</Text>
          <Text style={styles.brandSub}>Create Your Account</Text>
        </View>

        <SegmentedButtons
          value={role}
          onValueChange={(v) => setRole(v as 'DOCTOR' | 'PATIENT')}
          buttons={[
            { value: 'PATIENT', label: '👤 Patient' },
            { value: 'DOCTOR', label: '🩺 Doctor' },
          ]}
          style={styles.segmented}
        />

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />

            {role === 'DOCTOR' && (
              <TextInput
                label="NMC Number"
                value={nmcNumber}
                onChangeText={setNmcNumber}
                mode="outlined"
                style={styles.input}
                placeholder="National Medical Commission ID"
              />
            )}

            <Button
              mode="contained"
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              style={styles.signupBtn}
              buttonColor="#0a0a1a"
            >
              Sign Up
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={{ marginTop: 12 }}
            >
              Already have an account? Log in
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  brandName: { fontSize: 24, fontWeight: 'bold', color: '#0a0a1a', letterSpacing: 3 },
  brandSub: { fontSize: 14, color: '#666', marginTop: 4 },
  segmented: { marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, elevation: 2 },
  input: { marginBottom: 14, backgroundColor: '#fff' },
  signupBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 4 },
});
