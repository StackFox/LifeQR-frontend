import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text, Chip, Divider } from 'react-native-paper';

interface RiskFactor {
  name: string;
  category: string;
  value: any;
  weightContribution: number;
  reasoning: string;
  relatedConditions?: string[];
}

interface Recommendation {
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  reason: string;
  context: string;
}

interface RiskAssessmentData {
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number;
  factors: RiskFactor[];
  recommendations: Recommendation[];
  calculatedAt: number;
  version: string;
  modelInputs: {
    age: number;
    conditionCount: number;
    medicationCount: number;
    allergyCount: number;
    implantDevices: string[];
  };
  limitations: string[];
}

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { usePatientStore } from '../store/patientStore';

type Props = NativeStackScreenProps<RootStackParamList, 'RiskAssessment'>;

const getRiskColor = (level: string) => {
  const colors: Record<string, string> = {
    LOW: '#4CAF50',
    MODERATE: '#FF9800',
    HIGH: '#F44336',
    CRITICAL: '#B71C1C',
  };
  return colors[level] || '#999';
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    URGENT: '#F44336',
    HIGH: '#FF9800',
    MEDIUM: '#FFC107',
    LOW: '#4CAF50',
  };
  return colors[priority] || '#999';
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    DEMOGRAPHIC: '👤',
    MEDICATION: '💊',
    CONDITION: '🏥',
    ALLERGY: '⚠️',
    PROCEDURE: '🔧',
    INFORMATION_GAP: '❓',
  };
  return icons[category] || '📋';
};

export default function RiskAssessmentScreen({ navigation }: Props) {
  const payload = usePatientStore((s) => s.offlinePayload);
  const riskData: RiskAssessmentData | null = payload?.riskAssessment || null;

  if (!riskData) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">No risk assessment data available.</Text>
        <Text variant="bodySmall" style={{ color: '#666', marginTop: 8 }}>Scan a patient QR code first.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* ── Overall Risk Score ── */}
      <Card style={[styles.card, { borderLeftColor: getRiskColor(riskData.riskLevel), borderLeftWidth: 5 }]}>
        <Card.Content>
          <Text variant="titleLarge" style={{ color: getRiskColor(riskData.riskLevel), fontWeight: 'bold' }}>
            Risk Level: {riskData.riskLevel}
          </Text>
          <Text variant="headlineMedium" style={{ marginVertical: 10, fontWeight: 'bold' }}>
            {riskData.riskScore.toFixed(1)} / 10
          </Text>

          <ProgressBar
            progress={riskData.riskScore / 10}
            color={getRiskColor(riskData.riskLevel)}
            style={{ marginBottom: 10, height: 8, borderRadius: 4 }}
          />

          <Text variant="labelMedium" style={{ color: '#666' }}>
            Confidence: {(riskData.confidence * 100).toFixed(0)}% • Engine: {riskData.version}
          </Text>
        </Card.Content>
      </Card>

      {/* ── Model Inputs ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>
            📊 Assessment Inputs
          </Text>
          <View style={styles.inputsGrid}>
            <View style={styles.inputItem}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{riskData.modelInputs.age}</Text>
              <Text variant="labelSmall" style={{ color: '#666' }}>Age</Text>
            </View>
            <View style={styles.inputItem}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{riskData.modelInputs.conditionCount}</Text>
              <Text variant="labelSmall" style={{ color: '#666' }}>Conditions</Text>
            </View>
            <View style={styles.inputItem}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{riskData.modelInputs.medicationCount}</Text>
              <Text variant="labelSmall" style={{ color: '#666' }}>Medications</Text>
            </View>
            <View style={styles.inputItem}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{riskData.modelInputs.allergyCount}</Text>
              <Text variant="labelSmall" style={{ color: '#666' }}>Allergies</Text>
            </View>
          </View>
          {riskData.modelInputs.implantDevices.length > 0 && (
            <Text variant="bodySmall" style={{ color: '#666', marginTop: 8 }}>
              🔧 Implants: {riskData.modelInputs.implantDevices.join(', ')}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* ── Contributing Factors ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>
            🔍 Contributing Factors ({riskData.factors.length})
          </Text>

          {riskData.factors.map((factor, idx) => (
            <View key={idx} style={styles.factorContainer}>
              <View style={styles.factorHeader}>
                <Text variant="labelLarge" style={{ fontWeight: '600', flex: 1 }}>
                  {getCategoryIcon(factor.category)} {factor.name}
                </Text>
                <Chip
                  style={[styles.weightChip, { backgroundColor: '#E3F2FD' }]}
                  textStyle={{ fontSize: 12, fontWeight: 'bold' }}
                >
                  +{factor.weightContribution.toFixed(1)}
                </Chip>
              </View>

              <Text variant="bodySmall" style={{ color: '#555', marginVertical: 4 }}>
                {factor.reasoning}
              </Text>

              {factor.relatedConditions && factor.relatedConditions.length > 0 && (
                <View style={styles.tagsContainer}>
                  {factor.relatedConditions.map((cond, i) => (
                    <Chip
                      key={i}
                      style={{ marginRight: 6, marginTop: 4, backgroundColor: '#FFF3E0' }}
                      textStyle={{ fontSize: 10 }}
                    >
                      {cond}
                    </Chip>
                  ))}
                </View>
              )}
            </View>
          ))}

          {riskData.factors.length === 0 && (
            <Text variant="bodyMedium" style={{ color: '#4CAF50', textAlign: 'center', paddingVertical: 16 }}>
              ✅ No significant risk factors identified
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* ── Clinical Recommendations ── */}
      {riskData.recommendations.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>
              📋 Clinical Recommendations
            </Text>

            {riskData.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recommendationContainer}>
                <Chip
                  style={{ backgroundColor: getPriorityColor(rec.priority), alignSelf: 'flex-start' }}
                  textStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                >
                  {rec.priority}
                </Chip>
                <Text variant="labelLarge" style={{ marginTop: 8, fontWeight: '600' }}>
                  {rec.action}
                </Text>
                <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                  {rec.reason}
                </Text>
                <Text variant="bodySmall" style={{ color: '#999', marginTop: 4, fontStyle: 'italic' }}>
                  Context: {rec.context}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* ── Limitations ── */}
      <Card style={styles.disclaimerCard}>
        <Card.Content>
          <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 8 }}>
            ⚠️ Assessment Limitations
          </Text>
          {riskData.limitations.map((lim, idx) => (
            <Text key={idx} variant="bodySmall" style={{ marginVertical: 2, color: '#666' }}>
              • {lim}
            </Text>
          ))}
          <Divider style={{ marginVertical: 8 }} />
          <Text variant="labelSmall" style={{ color: '#999' }}>
            Calculated: {new Date(riskData.calculatedAt).toLocaleString()}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  disclaimerCard: {
    marginBottom: 32,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  inputsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  inputItem: {
    alignItems: 'center',
  },
  factorContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  weightChip: {
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  recommendationContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
