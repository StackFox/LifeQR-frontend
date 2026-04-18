import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import NfcManager, { Ndef, NfcTech, TagEvent } from 'react-native-nfc-manager';
import { RootStackParamList } from '../navigation';
import { usePatientStore } from '../store/patientStore';
import api from '../services/apiClient';
import { useToastStore } from '../store/toastStore';

type Props = NativeStackScreenProps<RootStackParamList, 'NFCAccess'>;

function extractNfcTextPayload(tag: TagEvent): string | null {
    const records = tag.ndefMessage;
    if (!records || records.length === 0) {
        return null;
    }

    for (const record of records) {
        try {
            const decoded = Ndef.text.decodePayload(new Uint8Array(record.payload as number[]));
            if (decoded?.trim()) {
                return decoded.trim();
            }
        } catch {
            // Ignore malformed records and continue scanning the remaining records.
        }
    }

    return null;
}

export default function NFCAccessScreen({ navigation }: Props) {
    const user = usePatientStore((state) => state.user);
    const setOfflinePayload = usePatientStore((state) => state.setOfflinePayload);
    const showToast = useToastStore((state) => state.showToast);

    const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
    const [scanning, setScanning] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [manualPatientAccessId, setManualPatientAccessId] = useState('');
    const [manualNfcTokenId, setManualNfcTokenId] = useState('');
    const [manualFallbackCode, setManualFallbackCode] = useState('');
    const [rawNfcPayload, setRawNfcPayload] = useState('');

    useEffect(() => {
        let mounted = true;

        NfcManager.isSupported()
            .then((isSupported) => {
                if (mounted) {
                    setNfcSupported(isSupported);
                }
            })
            .catch(() => {
                if (mounted) {
                    setNfcSupported(false);
                }
            });

        return () => {
            mounted = false;
            NfcManager.cancelTechnologyRequest().catch(() => undefined);
        };
    }, []);

    const decodeAccess = async (payload: {
        patientAccessId?: string;
        nfcTokenId?: string;
        fallbackCode?: string;
    }) => {
        if (user?.role !== 'DOCTOR' || !user.id) {
            showToast('Only doctor accounts can decode emergency NFC access.');
            return;
        }

        setProcessing(true);
        try {
            const response = await api.post('/api/nfc/decode', {
                patientAccessId: payload.patientAccessId,
                nfcTokenId: payload.nfcTokenId,
                fallbackCode: payload.fallbackCode,
                doctorId: user.id,
                hospitalId: user.hospitalId || 'H-001',
            });

            const patientData = response.data?.patientData;
            if (!patientData) {
                showToast('No patient data returned from NFC decode endpoint.');
                return;
            }

            setOfflinePayload(patientData);
            showToast('NFC emergency access granted.');
            navigation.navigate('EmergencyDashboard');
        } catch (error: any) {
            console.error(error);
            showToast(error?.response?.data?.error || 'NFC decode failed.');
        } finally {
            setProcessing(false);
        }
    };

    const scanNfcTag = async () => {
        if (nfcSupported === false) {
            showToast('NFC is not supported on this device.');
            return;
        }

        setScanning(true);
        try {
            await NfcManager.start();
            await NfcManager.requestTechnology(NfcTech.Ndef, {
                alertMessage: 'Hold your device near the patient NFC emergency pass.',
            });

            const tag = await NfcManager.getTag();
            if (!tag) {
                showToast('No NFC tag data detected.');
                return;
            }

            const payloadText = extractNfcTextPayload(tag);
            if (!payloadText) {
                showToast('NFC tag has no readable text payload.');
                return;
            }

            setRawNfcPayload(payloadText);

            const parsed = JSON.parse(payloadText) as {
                patientAccessId?: string;
                nfcTokenId?: string;
                fallbackCode?: string;
            };

            setManualPatientAccessId(parsed.patientAccessId || '');
            setManualNfcTokenId(parsed.nfcTokenId || '');
            setManualFallbackCode(parsed.fallbackCode || '');
            showToast('NFC payload read successfully.');
        } catch (error: any) {
            console.error(error);
            showToast(error?.message || 'Unable to scan NFC tag.');
        } finally {
            setScanning(false);
            NfcManager.cancelTechnologyRequest().catch(() => undefined);
        }
    };

    const submitManualDecode = async () => {
        if (!manualPatientAccessId && !manualNfcTokenId) {
            showToast('Provide patientAccessId or nfcTokenId.');
            return;
        }

        await decodeAccess({
            patientAccessId: manualPatientAccessId || undefined,
            nfcTokenId: manualNfcTokenId || undefined,
            fallbackCode: manualFallbackCode || undefined,
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.heroCard}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.heroTitle}>Locked-Device NFC Access</Text>
                    <Text variant="bodySmall" style={styles.heroSubtitle}>
                        Use patient NFC emergency pass as an alternative when QR cannot be shown on a locked phone.
                    </Text>

                    <View style={styles.chipRow}>
                        <Chip icon="doctor">Doctor-only flow</Chip>
                        <Chip icon={nfcSupported ? 'nfc' : 'nfc-off'}>
                            {nfcSupported === null ? 'Checking NFC support...' : nfcSupported ? 'NFC Supported' : 'NFC Unsupported'}
                        </Chip>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>1) Read NFC Tag</Text>
                    <Text variant="bodySmall" style={{ color: '#64748B', marginBottom: 12 }}>
                        Works best in development build (native NFC support). Expo Go may not provide NFC hardware APIs.
                    </Text>

                    <Button
                        mode="contained"
                        icon="nfc"
                        onPress={scanNfcTag}
                        disabled={scanning || processing || nfcSupported === false}
                        loading={scanning}
                    >
                        Scan NFC Emergency Pass
                    </Button>

                    {rawNfcPayload ? (
                        <View style={styles.rawPayloadBox}>
                            <Text variant="labelSmall" style={{ color: '#334155', fontWeight: '700' }}>
                                Raw NFC payload
                            </Text>
                            <Text variant="bodySmall" style={{ color: '#0F172A', marginTop: 4 }}>{rawNfcPayload}</Text>
                        </View>
                    ) : null}
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>2) Confirm Emergency Access</Text>

                    <TextInput
                        mode="outlined"
                        label="patientAccessId"
                        value={manualPatientAccessId}
                        onChangeText={setManualPatientAccessId}
                        style={{ marginBottom: 10 }}
                    />
                    <TextInput
                        mode="outlined"
                        label="nfcTokenId"
                        value={manualNfcTokenId}
                        onChangeText={setManualNfcTokenId}
                        style={{ marginBottom: 10 }}
                    />
                    <TextInput
                        mode="outlined"
                        label="Fallback Code (optional)"
                        value={manualFallbackCode}
                        onChangeText={setManualFallbackCode}
                        keyboardType="number-pad"
                        style={{ marginBottom: 12 }}
                    />

                    <Button
                        mode="contained"
                        icon="shield-check"
                        onPress={submitManualDecode}
                        loading={processing}
                        disabled={processing}
                    >
                        Retrieve Patient Emergency Data
                    </Button>
                </Card.Content>
            </Card>

            {processing && <ActivityIndicator style={{ marginTop: 8 }} />}
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
        paddingBottom: 28,
    },
    heroCard: {
        borderRadius: 18,
        marginBottom: 14,
        backgroundColor: '#111827',
    },
    heroTitle: {
        color: '#F9FAFB',
        fontWeight: '800',
    },
    heroSubtitle: {
        color: '#D1D5DB',
        marginTop: 6,
    },
    chipRow: {
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
        marginBottom: 8,
    },
    rawPayloadBox: {
        marginTop: 12,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
});
