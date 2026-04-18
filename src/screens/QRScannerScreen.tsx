import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { usePatientStore } from '../store/patientStore';
import { tryParseQRData } from '../services/qrDecryption';
import { storeOfflineRecord } from '../db/sqlite';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import api from '../services/apiClient';
import { useToastStore } from '../store/toastStore';
import { Button, Card, Chip, Modal, Portal, Text } from 'react-native-paper';

type Props = NativeStackScreenProps<RootStackParamList, 'QRScanner'>;

export default function QRScannerScreen({ navigation }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [pendingAccessId, setPendingAccessId] = useState<string | null>(null);
    const [decodeLoading, setDecodeLoading] = useState(false);
    const [doctorVerification, setDoctorVerification] = useState<{
        isVerified: boolean;
        name: string | null;
        licenseId: string | null;
        hospitalId: string;
    } | null>(null);

    const setOfflinePayload = usePatientStore((state) => state.setOfflinePayload);
    const user = usePatientStore((state) => state.user);
    const showToast = useToastStore((state) => state.showToast);

    const hospitalId = user?.hospitalId || 'H-001';

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Camera permission needed for QR scanning.</Text>
                <Button mode="contained" onPress={requestPermission}>Grant Camera Permission</Button>
                <Button mode="text" onPress={() => navigation.navigate('NFCAccess')} style={{ marginTop: 8 }}>
                    Use NFC Emergency Access Instead
                </Button>
            </View>
        );
    }

    const closeConfirmModal = () => {
        setPendingAccessId(null);
        setDoctorVerification(null);
        setScanned(false);
    };

    const decodeToken = async () => {
        if (!pendingAccessId || !user?.id) {
            return;
        }

        setDecodeLoading(true);
        try {
            const decodeResponse = await api.post('/api/qr/decode', {
                patientAccessId: pendingAccessId,
                doctorId: user.id,
                hospitalId,
            });

            const payload = decodeResponse.data?.patientData;
            if (!payload) {
                showToast('No patient data returned for this QR token.');
                closeConfirmModal();
                return;
            }

            setOfflinePayload(payload);
            await storeOfflineRecord(payload);

            showToast('Patient profile decoded successfully.');
            closeConfirmModal();
            navigation.navigate('EmergencyDashboard');
        } catch (err: any) {
            console.error('QR decode error:', err);
            const backendError = err?.response?.data?.error;
            showToast(backendError || 'Failed to decode QR code.');
            closeConfirmModal();
        } finally {
            setDecodeLoading(false);
        }
    };

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        try {
            const qrTokenPayload = tryParseQRData(data) as {
                patientId?: string;
                qrTokenId?: string;
                patientAccessId?: string;
            } | null;

            const patientAccessId = qrTokenPayload?.patientAccessId || qrTokenPayload?.qrTokenId;

            if (!patientAccessId) {
                showToast('Invalid QR payload.');
                setTimeout(() => setScanned(false), 2000);
                return;
            }

            if (user?.role !== 'DOCTOR' || !user?.id) {
                showToast('Only doctor accounts can decode patient emergency data.');
                setTimeout(() => setScanned(false), 2000);
                return;
            }

            const verificationResponse = await api.get(
                `/api/doctors/${user.id}/verification?hospitalId=${hospitalId}`
            );
            const verification = verificationResponse.data as {
                isVerified: boolean;
                name: string | null;
                licenseId: string | null;
                hospitalId: string;
            };

            if (!verification.isVerified) {
                showToast('Doctor account is not verified for this hospital.');
                setTimeout(() => setScanned(false), 2000);
                return;
            }

            setDoctorVerification(verification);
            setPendingAccessId(patientAccessId);
        } catch (err: any) {
            console.error('QR scan error:', err);
            const backendError = err?.response?.data?.error;
            showToast(backendError || 'Failed to decode QR code.');
            setScanned(false);
        }
    };

    return (
        <>
            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                />
                <View style={styles.overlay}>
                    <View style={styles.scanFrame} />
                    <Text style={styles.overlayText}>
                        Scan patient QR token to request secure data retrieval
                    </Text>
                    <Button mode="contained-tonal" onPress={() => navigation.navigate('NFCAccess')} style={{ marginTop: 8 }}>
                        Use NFC Instead
                    </Button>
                </View>
            </View>

            <Portal>
                <Modal
                    visible={Boolean(pendingAccessId)}
                    onDismiss={closeConfirmModal}
                    contentContainerStyle={styles.modalWrap}
                >
                    <Card style={styles.modalCard}>
                        <Card.Content>
                            <Text variant="titleLarge" style={{ fontWeight: '800' }}>Confirm Secure Access</Text>
                            <Text variant="bodySmall" style={{ color: '#64748B', marginTop: 6 }}>
                                Doctor trust context verified. Review and continue to retrieve emergency profile.
                            </Text>

                            {doctorVerification && (
                                <View style={{ marginTop: 12, gap: 8 }}>
                                    <Chip icon="check-decagram" style={{ backgroundColor: '#DCFCE7' }}>
                                        {doctorVerification.name || user?.name} verified
                                    </Chip>
                                    <Text variant="bodySmall">Hospital: {doctorVerification.hospitalId}</Text>
                                    <Text variant="bodySmall">License: {doctorVerification.licenseId || 'Not provided'}</Text>
                                </View>
                            )}

                            <Text variant="bodySmall" style={{ marginTop: 10, color: '#334155' }}>
                                Access token: {pendingAccessId?.substring(0, 12)}...
                            </Text>

                            <View style={styles.modalActions}>
                                <Button mode="outlined" onPress={closeConfirmModal} disabled={decodeLoading}>
                                    Cancel
                                </Button>
                                <Button mode="contained" onPress={decodeToken} loading={decodeLoading} disabled={decodeLoading}>
                                    Retrieve Data
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>
                </Modal>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', backgroundColor: '#0F172A' },
    message: { textAlign: 'center', paddingBottom: 10, fontSize: 16, color: '#0F172A', marginBottom: 8 },
    camera: { flex: 1 },
    overlay: {
        position: 'absolute',
        bottom: 28,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    scanFrame: {
        width: 240,
        height: 240,
        borderWidth: 2,
        borderColor: '#38BDF8',
        borderRadius: 24,
        marginBottom: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.12)',
    },
    overlayText: {
        color: '#E2E8F0',
        backgroundColor: 'rgba(2, 6, 23, 0.75)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        fontSize: 14,
        maxWidth: 320,
        textAlign: 'center',
    },
    modalWrap: {
        margin: 18,
    },
    modalCard: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },
    modalActions: {
        marginTop: 14,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
});
