import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, Chip, Divider } from 'react-native-paper';
import { usePatientStore } from '../store/patientStore';

export default function MedsScreen() {
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

    return (
        <ScrollView style={styles.container}>
            {/* ── Patient Header ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                        {payload.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#666' }}>
                        {payload.patientId} • Blood Type: {payload.bloodType}
                    </Text>
                </Card.Content>
            </Card>

            {/* ── Allergies ── */}
            <Card style={[styles.card, { borderLeftColor: '#F44336', borderLeftWidth: 4 }]}>
                <Card.Content>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#F44336', marginBottom: 10 }}>
                        ⚠️ Allergies ({payload.allergies?.length || 0})
                    </Text>
                    {(!payload.allergies || payload.allergies.length === 0) ? (
                        <Text variant="bodyMedium" style={{ color: '#4CAF50' }}>✅ No known allergies (NKDA)</Text>
                    ) : (
                        <View style={styles.chipRow}>
                            {payload.allergies.map((a: string, i: number) => (
                                <Chip
                                    key={i}
                                    style={styles.allergyChip}
                                    textStyle={{ color: '#B71C1C', fontWeight: 'bold' }}
                                    icon="alert-circle"
                                >
                                    {a}
                                </Chip>
                            ))}
                        </View>
                    )}
                </Card.Content>
            </Card>

            {/* ── Medications ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 10 }}>
                        💊 Current Medications ({payload.medications?.length || 0})
                    </Text>

                    {(!payload.medications || payload.medications.length === 0) ? (
                        <Text variant="bodyMedium" style={{ color: '#666' }}>No medications on file.</Text>
                    ) : (
                        payload.medications.map((m: any, i: number) => (
                            <View key={i} style={styles.medItem}>
                                <View style={styles.medHeader}>
                                    <Text variant="labelLarge" style={{ fontWeight: '600', flex: 1 }}>
                                        {m.name}
                                    </Text>
                                    <Chip style={styles.dosageChip} textStyle={{ fontSize: 11 }}>
                                        {m.dosage}
                                    </Chip>
                                </View>
                                <Text variant="bodySmall" style={{ color: '#666', marginTop: 2 }}>
                                    Frequency: {m.frequency}
                                </Text>
                            </View>
                        ))
                    )}
                </Card.Content>
            </Card>

            {/* ── Conditions ── */}
            {payload.conditions && payload.conditions.length > 0 && (
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 10 }}>
                            🏥 Active Conditions
                        </Text>
                        <View style={styles.chipRow}>
                            {payload.conditions.map((c: string, i: number) => (
                                <Chip key={i} style={styles.conditionChip}>{c}</Chip>
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
    dosageChip: {
        backgroundColor: '#E8F5E9',
    },
    medItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    medHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});