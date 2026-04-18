import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { usePatientStore } from '../store/patientStore';
import api from '../services/apiClient';
import { useToastStore } from '../store/toastStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AIInsights'>;

interface PatientSummary {
    patientId: string;
    name: string;
    bloodType: string;
    conditionCount: number;
    medicationCount: number;
    allergyCount: number;
}

interface AIInsightsResult {
    summary: string;
    insights: string[];
    sources: Array<{
        score: number | null;
        fileName: string;
        snippet: string;
    }>;
    rag: {
        used: boolean;
        sourceCount: number;
        collection: string;
        error: string | null;
    };
    snapshot: {
        riskLevel: string;
        riskScore: number;
        consentLevel: string;
    };
}

export default function AIInsightsScreen({ route }: Props) {
    const user = usePatientStore((state) => state.user);
    const showToast = useToastStore((state) => state.showToast);

    const [patients, setPatients] = useState<PatientSummary[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [question, setQuestion] = useState('What are the immediate emergency priorities and top medication/allergy risks?');
    const [selectedPatientId, setSelectedPatientId] = useState<string>(route.params?.patientId || '');
    const [result, setResult] = useState<AIInsightsResult | null>(null);

    const isDoctor = user?.role === 'DOCTOR';

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        setLoadingPatients(true);
        try {
            const response = await api.get('/api/patients');
            const list = (response.data || []) as PatientSummary[];
            setPatients(list);

            if (!selectedPatientId) {
                if (isDoctor) {
                    setSelectedPatientId(list[0]?.patientId || '');
                } else if (user?.id?.startsWith('P-')) {
                    setSelectedPatientId(user.id);
                }
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to load patient list for AI insights.');
        } finally {
            setLoadingPatients(false);
        }
    };

    const patientLabel = useMemo(() => {
        const patient = patients.find((item) => item.patientId === selectedPatientId);
        return patient ? `${patient.name} (${patient.patientId})` : selectedPatientId;
    }, [patients, selectedPatientId]);

    const runInsights = async () => {
        if (!selectedPatientId) {
            showToast('Select a patient first.');
            return;
        }

        setLoadingInsights(true);
        try {
            const response = await api.post(`/api/patients/${selectedPatientId}/ai-summary`, {
                question,
            });

            setResult(response.data as AIInsightsResult);
            showToast('AI insights updated.');
        } catch (error: any) {
            console.error(error);
            showToast(error?.response?.data?.error || 'Unable to generate AI insights.');
        } finally {
            setLoadingInsights(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.heroCard}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.heroTitle}>RAG Clinical Insights</Text>
                    <Text variant="bodySmall" style={styles.heroSubtitle}>
                        Query uploaded records in Qdrant and generate grounded emergency insights.
                    </Text>

                    <View style={styles.metaRow}>
                        <Chip icon="account-heart">{patientLabel || 'No patient selected'}</Chip>
                        {result && (
                            <Chip icon="alert-decagram" style={styles.riskChip}>
                                {result.snapshot.riskLevel} ({result.snapshot.riskScore.toFixed(1)})
                            </Chip>
                        )}
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Query Settings</Text>

                    {loadingPatients ? (
                        <ActivityIndicator style={{ marginVertical: 12 }} />
                    ) : (
                        <View style={styles.patientPickerWrap}>
                            {patients.map((patient) => (
                                <Chip
                                    key={patient.patientId}
                                    selected={selectedPatientId === patient.patientId}
                                    onPress={() => setSelectedPatientId(patient.patientId)}
                                    style={selectedPatientId === patient.patientId ? styles.patientChipSelected : styles.patientChip}
                                    textStyle={selectedPatientId === patient.patientId ? styles.patientChipSelectedText : undefined}
                                >
                                    {patient.name}
                                </Chip>
                            ))}
                        </View>
                    )}

                    <TextInput
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        label="Clinical Question"
                        value={question}
                        onChangeText={setQuestion}
                        style={{ marginTop: 12 }}
                    />

                    <Button
                        mode="contained"
                        icon="brain"
                        onPress={runInsights}
                        loading={loadingInsights}
                        disabled={loadingInsights || !selectedPatientId}
                        style={{ marginTop: 14 }}
                    >
                        Generate AI Summary
                    </Button>
                </Card.Content>
            </Card>

            {result && (
                <>
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Summary</Text>
                            <Text style={styles.summaryText}>{result.summary}</Text>
                        </Card.Content>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Actionable Insights</Text>
                            {result.insights.length === 0 ? (
                                <Text variant="bodySmall" style={{ color: '#666' }}>No concise insights produced.</Text>
                            ) : (
                                result.insights.map((insight, index) => (
                                    <Text key={`${insight}-${index}`} style={styles.insightLine}>• {insight}</Text>
                                ))
                            )}
                        </Card.Content>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>RAG Evidence</Text>
                            <View style={styles.metaRow}>
                                <Chip icon={result.rag.used ? 'database-check' : 'database-off'}>
                                    {result.rag.used ? `${result.rag.sourceCount} source chunks` : 'No vector context'}
                                </Chip>
                                <Chip icon="database">{result.rag.collection}</Chip>
                            </View>

                            {result.rag.error ? (
                                <Text style={styles.errorText}>RAG warning: {result.rag.error}</Text>
                            ) : null}

                            {result.sources.map((source, index) => (
                                <View key={`${source.fileName}-${index}`} style={styles.sourceItem}>
                                    <Text variant="labelLarge" style={{ fontWeight: '700' }}>{source.fileName}</Text>
                                    <Text variant="bodySmall" style={{ color: '#666', marginTop: 2 }}>{source.snippet}</Text>
                                    <Text variant="labelSmall" style={{ color: '#999', marginTop: 4 }}>
                                        Similarity score: {source.score?.toFixed(3) ?? 'N/A'}
                                    </Text>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    content: {
        padding: 16,
        paddingBottom: 28,
    },
    heroCard: {
        borderRadius: 18,
        backgroundColor: '#0F172A',
        marginBottom: 14,
    },
    heroTitle: {
        color: '#F8FAFC',
        fontWeight: '800',
    },
    heroSubtitle: {
        color: '#CBD5E1',
        marginTop: 6,
    },
    card: {
        borderRadius: 16,
        marginBottom: 14,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        fontWeight: '800',
        marginBottom: 10,
    },
    patientPickerWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    patientChip: {
        backgroundColor: '#E2E8F0',
    },
    patientChipSelected: {
        backgroundColor: '#0F172A',
    },
    patientChipSelectedText: {
        color: '#F8FAFC',
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    riskChip: {
        backgroundColor: '#FEE2E2',
    },
    summaryText: {
        color: '#0F172A',
        lineHeight: 22,
    },
    insightLine: {
        color: '#1E293B',
        marginBottom: 8,
        lineHeight: 20,
    },
    sourceItem: {
        marginTop: 10,
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    errorText: {
        color: '#B91C1C',
        marginTop: 10,
        fontWeight: '600',
    },
});
