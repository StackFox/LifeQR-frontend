import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Switch, Text, TextInput } from 'react-native-paper';
import api from '../services/apiClient';
import { usePatientStore } from '../store/patientStore';
import { useToastStore } from '../store/toastStore';

interface HospitalSharingRecord {
    hospitalId: string;
    hospitalName: string;
    city: string;
    state: string;
    ehrSystem: string;
    isActive: boolean;
    isSharingAllowed?: boolean;
}

interface EnrollmentPayload {
    networkName: string;
    consentLevel: string;
    hospitals: HospitalSharingRecord[];
}

export default function PrivacyControlCenterScreen() {
    const user = usePatientStore((state) => state.user);
    const showToast = useToastStore((state) => state.showToast);

    const [loading, setLoading] = useState(true);
    const [updatingBulk, setUpdatingBulk] = useState(false);
    const [search, setSearch] = useState('');
    const [enrollment, setEnrollment] = useState<EnrollmentPayload | null>(null);
    const [savingHospitalId, setSavingHospitalId] = useState<string | null>(null);

    const patientId = user?.id?.startsWith('P-') ? user.id : 'P-67890';

    useEffect(() => {
        fetchEnrollment();
    }, []);

    const fetchEnrollment = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/networks/my-enrollment/${patientId}`);
            setEnrollment(response.data?.enrollment || null);
        } catch (error) {
            console.error(error);
            showToast('Unable to load privacy controls.');
        } finally {
            setLoading(false);
        }
    };

    const visibleHospitals = useMemo(() => {
        if (!enrollment) {
            return [];
        }

        const query = search.trim().toLowerCase();
        if (!query) {
            return enrollment.hospitals;
        }

        return enrollment.hospitals.filter((hospital) => {
            return (
                hospital.hospitalName.toLowerCase().includes(query) ||
                hospital.city.toLowerCase().includes(query) ||
                hospital.state.toLowerCase().includes(query) ||
                hospital.ehrSystem.toLowerCase().includes(query)
            );
        });
    }, [enrollment, search]);

    const updateHospital = async (hospitalId: string, allowSharing: boolean) => {
        setSavingHospitalId(hospitalId);
        try {
            await api.put('/api/networks/hospital-sharing', {
                patientId,
                hospitalId,
                allowSharing,
            });

            setEnrollment((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    hospitals: current.hospitals.map((hospital) =>
                        hospital.hospitalId === hospitalId
                            ? { ...hospital, isSharingAllowed: allowSharing }
                            : hospital
                    ),
                };
            });

            showToast(`${allowSharing ? 'Enabled' : 'Disabled'} sharing for ${hospitalId}.`);
        } catch (error) {
            console.error(error);
            showToast('Could not update sharing preference.');
        } finally {
            setSavingHospitalId(null);
        }
    };

    const bulkUpdate = async (allowSharing: boolean) => {
        if (!enrollment) {
            return;
        }

        setUpdatingBulk(true);
        try {
            for (const hospital of enrollment.hospitals) {
                await api.put('/api/networks/hospital-sharing', {
                    patientId,
                    hospitalId: hospital.hospitalId,
                    allowSharing,
                });
            }

            setEnrollment((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    hospitals: current.hospitals.map((hospital) => ({
                        ...hospital,
                        isSharingAllowed: allowSharing,
                    })),
                };
            });

            showToast(allowSharing ? 'Enabled sharing with all hospitals.' : 'Disabled sharing with all hospitals.');
        } catch (error) {
            console.error(error);
            showToast('Bulk update failed. Some hospitals may remain unchanged.');
            await fetchEnrollment();
        } finally {
            setUpdatingBulk(false);
        }
    };

    const setEmergencyOnly = async () => {
        setUpdatingBulk(true);
        try {
            await api.put('/api/networks/update-consent', {
                patientId,
                consentLevel: 'EMERGENCY_ONLY',
            });
            showToast('Consent changed to EMERGENCY_ONLY.');
            await fetchEnrollment();
        } catch (error) {
            console.error(error);
            showToast('Failed to switch to EMERGENCY_ONLY mode.');
        } finally {
            setUpdatingBulk(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Loading privacy controls...</Text>
            </View>
        );
    }

    if (!enrollment) {
        return (
            <View style={styles.centered}>
                <Text variant="titleMedium">No network enrollment found.</Text>
                <Text variant="bodySmall" style={{ color: '#64748B', marginTop: 8 }}>
                    Join a network first to manage per-hospital sharing preferences.
                </Text>
            </View>
        );
    }

    const allowedCount = enrollment.hospitals.filter((hospital) => hospital.isSharingAllowed).length;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.heroCard}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.heroTitle}>Privacy Control Center</Text>
                    <Text variant="bodySmall" style={styles.heroSubtitle}>
                        Fine-tune hospital-by-hospital sharing for emergency access in {enrollment.networkName}.
                    </Text>

                    <View style={styles.headerChips}>
                        <Chip icon="shield-account">Consent: {enrollment.consentLevel}</Chip>
                        <Chip icon="hospital-building">{allowedCount}/{enrollment.hospitals.length} enabled</Chip>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickRow}>
                        <Button mode="contained" onPress={() => bulkUpdate(true)} loading={updatingBulk} disabled={updatingBulk}>
                            Enable All
                        </Button>
                        <Button mode="outlined" onPress={() => bulkUpdate(false)} loading={updatingBulk} disabled={updatingBulk}>
                            Disable All
                        </Button>
                        <Button mode="outlined" onPress={setEmergencyOnly} loading={updatingBulk} disabled={updatingBulk}>
                            Emergency Only
                        </Button>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Hospitals</Text>
                    <TextInput
                        mode="outlined"
                        value={search}
                        onChangeText={setSearch}
                        label="Search hospital / city / state"
                        left={<TextInput.Icon icon="magnify" />}
                        style={{ marginBottom: 12 }}
                    />

                    {visibleHospitals.map((hospital) => (
                        <View key={hospital.hospitalId} style={styles.hospitalRow}>
                            <View style={{ flex: 1 }}>
                                <Text variant="labelLarge" style={{ fontWeight: '700' }}>{hospital.hospitalName}</Text>
                                <Text variant="bodySmall" style={{ color: '#64748B' }}>
                                    {hospital.city}, {hospital.state} • {hospital.ehrSystem}
                                </Text>
                            </View>

                            <View style={styles.toggleBlock}>
                                <Text variant="labelSmall" style={{ color: '#475569' }}>
                                    {hospital.isSharingAllowed ? 'Shared' : 'Blocked'}
                                </Text>
                                <Switch
                                    value={Boolean(hospital.isSharingAllowed)}
                                    onValueChange={(value) => updateHospital(hospital.hospitalId, value)}
                                    disabled={savingHospitalId === hospital.hospitalId || updatingBulk}
                                />
                            </View>
                        </View>
                    ))}

                    {visibleHospitals.length === 0 && (
                        <Text variant="bodySmall" style={{ color: '#64748B', textAlign: 'center', marginTop: 8 }}>
                            No hospitals match your search.
                        </Text>
                    )}
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        padding: 16,
        paddingBottom: 30,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
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
    headerChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
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
    quickRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    hospitalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 10,
    },
    toggleBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
});
