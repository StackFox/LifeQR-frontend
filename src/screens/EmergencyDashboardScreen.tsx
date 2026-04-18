import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, Chip, Divider, Button } from 'react-native-paper';
import { usePatientStore } from '../store/patientStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'EmergencyDashboard'>;

const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
        LOW: '#4CAF50',
        MODERATE: '#FF9800',
        HIGH: '#F44336',
        CRITICAL: '#B71C1C',
    };
    return colors[level] || '#999';
};

export default function EmergencyDashboardScreen({ navigation }: Props) {
    const payload = usePatientStore((s) => s.offlinePayload);

    if (!payload) {
        return (
            <View style={styles.center}>
                <Text variant="titleMedium">No patient loaded</Text>
                <Text variant="bodySmall" style={{ color: '#666', marginTop: 8 }}>
                    Scan a QR code or generate one from the dashboard.
                </Text>
            </View>
        );
    }

    const riskLevel = payload.riskAssessment?.riskLevel || 'N/A';
    const riskScore = payload.riskAssessment?.riskScore || 0;

    return (
        <ScrollView style={styles.container}>
            {/* ── Patient Identity ── */}
            <Card style={[styles.card, { borderLeftColor: getRiskColor(riskLevel), borderLeftWidth: 5 }]}>
                <Card.Content>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                        {payload.name}
                    </Text>
                    <View style={styles.infoRow}>
                        <Chip icon="water" style={styles.infoChip}>{payload.bloodType}</Chip>
                        <Chip icon="calendar" style={styles.infoChip}>{payload.dateOfBirth}</Chip>
                    </View>
                    <Text variant="bodySmall" style={{ color: '#666', marginTop: 8 }}>
                        ID: {payload.patientId} • QR Token: {payload.qrTokenId?.substring(0, 8)}...
                    </Text>
                </Card.Content>
            </Card>

            {/* ── Risk Summary ── */}
            <Card style={[styles.riskCard, { backgroundColor: getRiskColor(riskLevel) + '15' }]}>
                <Card.Content>
                    <View style={styles.riskHeader}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                            ⚡ Risk: {riskLevel}
                        </Text>
                        <Chip
                            style={{ backgroundColor: getRiskColor(riskLevel) }}
                            textStyle={{ color: '#fff', fontWeight: 'bold' }}
                        >
                            {riskScore.toFixed(1)}/10
                        </Chip>
                    </View>

                    <Text variant="bodySmall" style={{ color: '#555', marginTop: 8 }}>
                        {payload.medicalSummary}
                    </Text>

                    <Button
                        mode="outlined"
                        onPress={() => navigation.navigate('RiskAssessment')}
                        style={{ marginTop: 12 }}
                        icon="chart-line"
                    >
                        View Detailed Risk Analysis
                    </Button>
                </Card.Content>
            </Card>

            {/* ── Emergency Contacts ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                        📞 Emergency Contacts
                    </Text>
                    {payload.emergencyContacts?.map((contact: any, i: number) => (
                        <View key={i} style={styles.contactItem}>
                            <Text variant="labelLarge" style={{ fontWeight: '600' }}>{contact.name}</Text>
                            <Text variant="bodySmall" style={{ color: '#666' }}>
                                {contact.relationship} • {contact.phone}
                            </Text>
                        </View>
                    ))}
                </Card.Content>
            </Card>

            {/* ── Critical Allergies ── */}
            {payload.allergies && payload.allergies.length > 0 && (
                <Card style={[styles.card, { borderLeftColor: '#F44336', borderLeftWidth: 4 }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#F44336', marginBottom: 8 }}>
                            ⚠️ Allergies
                        </Text>
                        <View style={styles.chipRow}>
                            {payload.allergies.map((allergy: string, i: number) => (
                                <Chip key={i} style={styles.allergyChip} textStyle={{ color: '#B71C1C' }}>
                                    {allergy}
                                </Chip>
                            ))}
                        </View>
                    </Card.Content>
                </Card>
            )}

            {/* ── Conditions ── */}
            {payload.conditions && payload.conditions.length > 0 && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                            🏥 Active Conditions
                        </Text>
                        <View style={styles.chipRow}>
                            {payload.conditions.map((cond: string, i: number) => (
                                <Chip key={i} style={styles.conditionChip}>{cond}</Chip>
                            ))}
                        </View>
                    </Card.Content>
                </Card>
            )}

            {/* ── Implants ── */}
            {payload.implants && payload.implants.length > 0 && (
                <Card style={[styles.card, { borderLeftColor: '#FF9800', borderLeftWidth: 4 }]}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                            🔧 Implanted Devices
                        </Text>
                        {payload.implants.map((implant: string, i: number) => (
                            <Text key={i} variant="bodyMedium" style={{ marginBottom: 4 }}>
                                • {implant}
                            </Text>
                        ))}
                    </Card.Content>
                </Card>
            )}

            {/* ── Metadata ── */}
            <Card style={styles.metaCard}>
                <Card.Content>
                    <Text variant="labelSmall" style={{ color: '#999' }}>
                        Last Updated: {payload.lastUpdated ? new Date(payload.lastUpdated).toLocaleString() : 'N/A'}
                    </Text>
                    <Text variant="labelSmall" style={{ color: '#999' }}>
                        Expires: {payload.expiryTime ? new Date(payload.expiryTime).toLocaleDateString() : 'N/A'}
                    </Text>
                    <Text variant="labelSmall" style={{ color: '#999' }}>
                        Consent: {payload.consentLevel || 'FULL'} • Encryption: {payload.encryptionVersion || 'v1'}
                    </Text>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
    card: {
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 2,
    },
    riskCard: {
        marginBottom: 12,
        borderRadius: 12,
        elevation: 2,
    },
    metaCard: {
        marginBottom: 32,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
    },
    infoRow: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 8,
    },
    infoChip: {
        backgroundColor: '#E3F2FD',
    },
    riskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    contactItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    allergyChip: {
        backgroundColor: '#FFEBEE',
    },
    conditionChip: {
        backgroundColor: '#E3F2FD',
    },
});
