import React, { useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Animated, Dimensions } from 'react-native';
import { Text, Button, Card, Chip, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    // Pulse animation for status indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.brandName}>SENTINEL</Text>
        </View>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={styles.accessBtn}
          labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
          buttonColor="#B71C1C"
        >
          ACCESS VAULT
        </Button>
      </View>

      {/* ── Hero Section ── */}
      <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Live Telemetry Card */}
        <Surface style={styles.telemetryCard} elevation={3}>
          <View style={styles.telemetryGradient}>
            <View style={styles.telemetryContent}>
              <View style={styles.telemetryIcon}>
                <Text style={{ color: '#fff', fontSize: 18 }}>⚕</Text>
              </View>
              <View>
                <Text style={styles.telemetryLabel}>LIVE TELEMETRY</Text>
                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryValue}>Stable</Text>
                  <Text style={styles.telemetryBar}>│</Text>
                </View>
                <Text style={styles.telemetryPercent}>99.9%</Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* System Status */}
        <View style={styles.statusRow}>
          <Animated.View style={[styles.statusDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.statusText}>SYSTEM ONLINE</Text>
        </View>

        {/* Hero Text */}
        <Text style={styles.heroTitle}>
          The Future of{'\n'}Clinical{'\n'}Intelligence.
        </Text>
        <Text style={styles.heroSubtitle}>
          Surgical precision data retrieval.{'\n'}
          Sovereign patient records. Real-time{'\n'}
          telemetry for critical healthcare{'\n'}
          environments.
        </Text>

        {/* CTA Buttons */}
        <View style={styles.ctaRow}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={styles.ctaPrimary}
            buttonColor="#0a0a1a"
            labelStyle={{ fontWeight: 'bold' }}
            icon="arrow-right"
            contentStyle={{ flexDirection: 'row-reverse' }}
          >
            Deploy Sentinel
          </Button>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.ctaSecondary}
            textColor="#0a0a1a"
          >
            View Protocols
          </Button>
        </View>
      </Animated.View>

      {/* ── Core Infrastructure ── */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Core Infrastructure</Text>
        <Text style={styles.sectionSubtitle}>
          Engineered for zero-latency medical environments.
        </Text>

        {/* Emergency Sentinel */}
        <Card style={styles.featureCard}>
          <Card.Content>
            <View style={styles.featureIcon}>
              <Text style={{ color: '#B71C1C', fontSize: 20, fontWeight: 'bold' }}>✱</Text>
            </View>
            <Text style={styles.featureTitle}>Emergency Sentinel</Text>
            <Text style={styles.featureDesc}>
              Instantaneous, sub-second retrieval of life-critical data. Bypassing standard protocols during elevated threat levels.
            </Text>
          </Card.Content>
        </Card>

        {/* The Vault */}
        <Card style={styles.featureCard}>
          <Card.Content>
            <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
              <Text style={{ fontSize: 20 }}>🔒</Text>
            </View>
            <Text style={styles.featureTitle}>The Vault</Text>
            <Text style={styles.featureDesc}>
              Sovereign, immutable patient records locked down with military-grade encryption.
            </Text>
          </Card.Content>
        </Card>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statValue}>0.4s</Text>
            <Text style={styles.statLabel}>AVG RETRIEVAL TIME</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>DATA SOVEREIGNTY</Text>
          </Surface>
        </View>

        {/* Protocol Sync */}
        <Card style={styles.featureCard}>
          <Card.Content>
            <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
              <Text style={{ fontSize: 20 }}>🔄</Text>
            </View>
            <Text style={styles.featureTitle}>Protocol Sync</Text>
            <Text style={styles.featureDesc}>
              Cross-department data harmonization. Real-time sync across hospital networks.
            </Text>
          </Card.Content>
        </Card>
      </Animated.View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerCopy}>© 2026 VITALIS SENTINEL. SURGICAL PRECISION DATA.</Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>SECURITY</Text>
          <Text style={styles.footerLink}>CLINICAL PROTOCOLS</Text>
          <Text style={styles.footerLink}>PRIVACY</Text>
          <Text style={styles.footerLink}>TERMS</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { paddingBottom: 40 },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#B71C1C', justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  brandName: { fontSize: 16, fontWeight: 'bold', color: '#0a0a1a', letterSpacing: 2 },
  accessBtn: { borderRadius: 8 },

  // Hero
  heroSection: { paddingHorizontal: 20, marginTop: 10 },
  telemetryCard: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 24,
    backgroundColor: '#E8EDF4',
  },
  telemetryGradient: {
    padding: 80, paddingBottom: 20, paddingTop: 120,
    backgroundColor: '#D6DEE8',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  telemetryContent: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12, padding: 14,
  },
  telemetryIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#B71C1C', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  telemetryLabel: { fontSize: 10, fontWeight: 'bold', color: '#666', letterSpacing: 1 },
  telemetryRow: { flexDirection: 'row', alignItems: 'center' },
  telemetryValue: { fontSize: 20, fontWeight: 'bold', color: '#0a0a1a' },
  telemetryBar: { fontSize: 20, color: '#0a0a1a', marginLeft: 4 },
  telemetryPercent: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },

  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#666', letterSpacing: 1.5 },

  heroTitle: { fontSize: 36, fontWeight: 'bold', color: '#0a0a1a', lineHeight: 44, marginBottom: 16 },
  heroSubtitle: { fontSize: 15, color: '#666', lineHeight: 22, marginBottom: 24 },

  ctaRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  ctaPrimary: { borderRadius: 10, flex: 1 },
  ctaSecondary: { borderRadius: 10, flex: 1, borderColor: '#ccc' },

  // Sections
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#0a0a1a', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },

  featureCard: {
    marginBottom: 16, backgroundColor: '#fff', borderRadius: 16,
    borderLeftWidth: 4, borderLeftColor: '#B71C1C',
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: { fontSize: 18, fontWeight: 'bold', color: '#0a0a1a', marginBottom: 8 },
  featureDesc: { fontSize: 13, color: '#666', lineHeight: 20 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, padding: 20, borderRadius: 16,
    backgroundColor: '#FFF9C4', alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#0a0a1a', fontStyle: 'italic' },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#666', letterSpacing: 1, marginTop: 4 },

  // Footer
  footer: {
    paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: '#eee', marginTop: 40,
  },
  footerCopy: { fontSize: 10, fontWeight: 'bold', color: '#B71C1C', letterSpacing: 0.5, marginBottom: 12 },
  footerLinks: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  footerLink: { fontSize: 10, color: '#2196F3', letterSpacing: 0.5, textDecorationLine: 'underline' },
});
