import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Dimensions } from 'react-native';
import { Card, Text, Chip, ProgressBar, Surface, Divider, Button } from 'react-native-paper';
import api from '../services/apiClient';
import { usePatientStore } from '../store/patientStore';

const { width } = Dimensions.get('window');

interface PatientSummary {
  patientId: string;
  name: string;
  bloodType: string;
  conditionCount: number;
  medicationCount: number;
  allergyCount: number;
}

const getRiskColor = (level: string) => {
  const m: Record<string, string> = { LOW: '#4CAF50', MODERATE: '#FF9800', HIGH: '#F44336', CRITICAL: '#B71C1C' };
  return m[level] || '#999';
};

export default function AnalyticsDashboardScreen() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [riskData, setRiskData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const user = usePatientStore((s) => s.user);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: pts } = await api.get('/api/patients');
      setPatients(pts);

      // Fetch risk for all patients
      const risks: Record<string, any> = {};
      for (const p of pts) {
        try {
          const { data } = await api.get(`/api/risk/${p.patientId}`);
          risks[p.patientId] = data;
        } catch {}
      }
      setRiskData(risks);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const totalPatients = patients.length;
  const riskDistribution = {
    CRITICAL: Object.values(riskData).filter((r: any) => r.riskLevel === 'CRITICAL').length,
    HIGH: Object.values(riskData).filter((r: any) => r.riskLevel === 'HIGH').length,
    MODERATE: Object.values(riskData).filter((r: any) => r.riskLevel === 'MODERATE').length,
    LOW: Object.values(riskData).filter((r: any) => r.riskLevel === 'LOW').length,
  };
  const avgRiskScore = Object.values(riskData).length
    ? Object.values(riskData).reduce((sum: number, r: any) => sum + (r.riskScore || 0), 0) / Object.values(riskData).length
    : 0;
  const totalMeds = patients.reduce((sum, p) => sum + p.medicationCount, 0);
  const totalAllergies = patients.reduce((sum, p) => sum + p.allergyCount, 0);

  return (
    <ScrollView style={styles.container}>
      {/* ── Header ── */}
      <Surface style={styles.headerCard} elevation={2}>
        <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#fff' }}>
          📊 Clinical Analytics
        </Text>
        <Text variant="bodySmall" style={{ color: '#ccc', marginTop: 4 }}>
          {user?.role === 'DOCTOR' ? `Welcome, ${user.name}` : 'Population Health Overview'}
        </Text>
      </Surface>

      {/* ── Key Metrics ── */}
      <View style={styles.metricsGrid}>
        <Surface style={[styles.metricCard, { backgroundColor: '#E3F2FD' }]} elevation={1}>
          <Text style={styles.metricValue}>{totalPatients}</Text>
          <Text style={styles.metricLabel}>Patients</Text>
        </Surface>
        <Surface style={[styles.metricCard, { backgroundColor: '#FFF3E0' }]} elevation={1}>
          <Text style={styles.metricValue}>{avgRiskScore.toFixed(1)}</Text>
          <Text style={styles.metricLabel}>Avg Risk</Text>
        </Surface>
        <Surface style={[styles.metricCard, { backgroundColor: '#E8F5E9' }]} elevation={1}>
          <Text style={styles.metricValue}>{totalMeds}</Text>
          <Text style={styles.metricLabel}>Total Meds</Text>
        </Surface>
        <Surface style={[styles.metricCard, { backgroundColor: '#FCE4EC' }]} elevation={1}>
          <Text style={styles.metricValue}>{totalAllergies}</Text>
          <Text style={styles.metricLabel}>Allergies</Text>
        </Surface>
      </View>

      {/* ── Risk Distribution ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>
            ⚡ Risk Distribution
          </Text>

          {(['CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((level) => {
            const count = riskDistribution[level];
            const pct = totalPatients > 0 ? count / totalPatients : 0;
            return (
              <View key={level} style={styles.riskRow}>
                <Chip
                  style={{ backgroundColor: getRiskColor(level), minWidth: 90 }}
                  textStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                >
                  {level}
                </Chip>
                <ProgressBar
                  progress={pct}
                  color={getRiskColor(level)}
                  style={styles.riskBar}
                />
                <Text style={styles.riskCount}>{count}</Text>
              </View>
            );
          })}
        </Card.Content>
      </Card>

      {/* ── AI Clinical Summaries ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>
            🤖 AI Clinical Insights
          </Text>

          {patients.map((pt) => {
            const risk = riskData[pt.patientId];
            if (!risk) return null;

            // Generate summary from risk factors
            const topFactors = (risk.factors || [])
              .sort((a: any, b: any) => b.weightContribution - a.weightContribution)
              .slice(0, 2);

            const urgentRecs = (risk.recommendations || [])
              .filter((r: any) => r.priority === 'URGENT' || r.priority === 'HIGH')
              .slice(0, 2);

            return (
              <View key={pt.patientId} style={styles.insightItem}>
                <View style={styles.insightHeader}>
                  <Text variant="labelLarge" style={{ fontWeight: 'bold', flex: 1 }}>
                    {pt.name}
                  </Text>
                  <Chip
                    style={{ backgroundColor: getRiskColor(risk.riskLevel) }}
                    textStyle={{ color: '#fff', fontSize: 10 }}
                  >
                    {risk.riskScore?.toFixed(1)}/10
                  </Chip>
                </View>

                {/* AI Summary */}
                <Text variant="bodySmall" style={styles.aiSummary}>
                  {risk.riskLevel === 'CRITICAL'
                    ? `⚠️ CRITICAL: ${pt.name} presents with ${pt.conditionCount} active conditions and ${pt.medicationCount} medications. Immediate clinical review recommended.`
                    : risk.riskLevel === 'HIGH'
                    ? `⚡ HIGH RISK: ${pt.name} has ${pt.conditionCount} conditions requiring close monitoring. ${pt.allergyCount} known allergies.`
                    : risk.riskLevel === 'MODERATE'
                    ? `📋 MODERATE: ${pt.name} has manageable conditions. Continue current treatment protocol.`
                    : `✅ LOW RISK: ${pt.name} presents with minimal clinical complexity. Standard care protocols apply.`}
                </Text>

                {/* Top Risk Factors */}
                {topFactors.length > 0 && (
                  <View style={styles.factorTags}>
                    {topFactors.map((f: any, i: number) => (
                      <Chip key={i} style={{ backgroundColor: '#F5F5F5' }} textStyle={{ fontSize: 10 }}>
                        {f.name} (+{f.weightContribution.toFixed(1)})
                      </Chip>
                    ))}
                  </View>
                )}

                {/* Urgent Recommendations */}
                {urgentRecs.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    {urgentRecs.map((rec: any, i: number) => (
                      <Text key={i} variant="bodySmall" style={{ color: '#B71C1C', marginTop: 2 }}>
                        → {rec.action}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </Card.Content>
      </Card>

      {/* ── Polypharmacy Alerts ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
            💊 Polypharmacy Watch
          </Text>

          {patients
            .filter((p) => p.medicationCount >= 5)
            .map((pt) => (
              <View key={pt.patientId} style={styles.polyItem}>
                <Text variant="labelLarge" style={{ fontWeight: 'bold' }}>{pt.name}</Text>
                <Chip
                  style={{ backgroundColor: '#FFEBEE' }}
                  textStyle={{ fontSize: 11, color: '#B71C1C' }}
                  icon="alert-circle"
                >
                  {pt.medicationCount} medications
                </Chip>
              </View>
            ))}

          {patients.filter((p) => p.medicationCount >= 5).length === 0 && (
            <Text variant="bodyMedium" style={{ color: '#4CAF50', textAlign: 'center', paddingVertical: 16 }}>
              ✅ No polypharmacy alerts
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* ── Allergy Cross-Check ── */}
      <Card style={[styles.card, { marginBottom: 32 }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
            ⚠️ High Allergy Count Patients
          </Text>

          {patients
            .filter((p) => p.allergyCount >= 3)
            .map((pt) => (
              <View key={pt.patientId} style={styles.polyItem}>
                <Text variant="labelLarge" style={{ fontWeight: 'bold' }}>{pt.name}</Text>
                <Chip
                  style={{ backgroundColor: '#FFF3E0' }}
                  textStyle={{ fontSize: 11, color: '#E65100' }}
                  icon="alert"
                >
                  {pt.allergyCount} allergies
                </Chip>
              </View>
            ))}

          {patients.filter((p) => p.allergyCount >= 3).length === 0 && (
            <Text variant="bodyMedium" style={{ color: '#4CAF50', textAlign: 'center', paddingVertical: 16 }}>
              ✅ No high-allergy patients
            </Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerCard: {
    backgroundColor: '#0a0a1a', padding: 20, paddingTop: 16,
    borderRadius: 0,
  },
  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 12, gap: 8,
  },
  metricCard: {
    flex: 1, minWidth: (width - 40) / 2 - 4,
    padding: 16, borderRadius: 16, alignItems: 'center',
  },
  metricValue: { fontSize: 28, fontWeight: 'bold', color: '#0a0a1a' },
  metricLabel: { fontSize: 11, fontWeight: 'bold', color: '#666', letterSpacing: 0.5, marginTop: 4 },

  card: {
    marginHorizontal: 12, marginBottom: 12,
    backgroundColor: '#fff', borderRadius: 16, elevation: 2,
  },
  riskRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, gap: 10,
  },
  riskBar: { flex: 1, height: 8, borderRadius: 4 },
  riskCount: { fontSize: 14, fontWeight: 'bold', color: '#333', width: 24, textAlign: 'right' },

  insightItem: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  insightHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  aiSummary: { color: '#444', lineHeight: 18, marginBottom: 6, fontStyle: 'italic' },
  factorTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  polyItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
});
