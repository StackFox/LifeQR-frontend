import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Avatar, Text, Button, Card, Chip, Divider, Surface, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { usePatientStore } from '../store/patientStore';
import api from '../services/apiClient';
import QRCode from 'react-native-qrcode-svg';
import * as DocumentPicker from 'expo-document-picker';
import { useToastStore } from '../store/toastStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
    const [loading, setLoading] = useState(false);
    const [qrData, setQrData] = useState<string | null>(null);
    const [docs, setDocs] = useState<Array<{ id: string; name: string; url: string }>>([]);
    const [selectedPatient, setSelectedPatient] = useState('P-12345');
    const [patientAccessId, setPatientAccessId] = useState<string | null>(null);
    const [qrExpiry, setQrExpiry] = useState<number | null>(null);
    const [remainingMs, setRemainingMs] = useState(0);
    const [nfcPass, setNfcPass] = useState<{
        nfcTokenId: string;
        patientAccessId: string;
        fallbackCode: string;
        expiresAt: number;
    } | null>(null);

    const setOfflinePayload = usePatientStore((state) => state.setOfflinePayload);
    const payload = usePatientStore((s) => s.offlinePayload);
    const user = usePatientStore((s) => s.user);
    const logout = usePatientStore((s) => s.logout);
    const showToast = useToastStore((s) => s.showToast);

    const isDoctor = user?.role === 'DOCTOR';

    const patientOptions = [
        { id: 'P-12345', name: 'Jane Doe', risk: 'LOW' },
        { id: 'P-67890', name: 'Robert Chen', risk: 'CRITICAL' },
    ];

    useEffect(() => {
        if (!isDoctor && user?.id?.startsWith('P-')) {
            setSelectedPatient(user.id);
        }
    }, [isDoctor, user?.id]);

    const activePatientId = useMemo(() => {
        return !isDoctor && user?.id ? user.id : selectedPatient;
    }, [isDoctor, selectedPatient, user?.id]);

    useEffect(() => {
        if (!qrExpiry) {
            setRemainingMs(0);
            return;
        }

        const timer = setInterval(() => {
            setRemainingMs(Math.max(0, qrExpiry - Date.now()));
        }, 1000);

        return () => clearInterval(timer);
    }, [qrExpiry]);

    useEffect(() => {
        loadActiveSession();
    }, [activePatientId]);

    const formatCountdown = (ms: number): string => {
        const total = Math.floor(ms / 1000);
        const minutes = Math.floor(total / 60)
            .toString()
            .padStart(2, '0');
        const seconds = (total % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const loadActiveSession = async () => {
        if (!activePatientId) {
            return;
        }

        try {
            const response = await api.get(`/api/qr/sessions/${activePatientId}`);
            const activeSession = (response.data?.sessions || []).find(
                (session: { status: string }) => session.status === 'ACTIVE'
            );

            if (activeSession) {
                setPatientAccessId(activeSession.patientAccessId || null);
                setQrExpiry(activeSession.expiresAt || null);
            } else {
                setPatientAccessId(null);
                setQrExpiry(null);
            }
        } catch {
            // Keep dashboard stable even if session endpoint is temporarily unavailable.
        }
    };

    const generateOfflineQR = async () => {
        setLoading(true);
        try {
            const patientId = activePatientId;
            const res = await api.post('/api/qr/generate', { patientId });
            setOfflinePayload(res.data.preview || null);
            const qrPayload = JSON.stringify(res.data.qrPayload);
            setQrData(qrPayload);
            setPatientAccessId(res.data.patientAccessId || null);
            setQrExpiry(res.data.expiresAt || null);
            showToast('Secure QR generated. Only verified doctors can decode this token.');
        } catch (e) {
            console.error(e);
            showToast('Failed to generate QR. Ensure backend is running on port 5000.');
        } finally {
            setLoading(false);
        }
    };

    const revokeQrSession = async () => {
        if (!patientAccessId) {
            return;
        }

        setLoading(true);
        try {
            await api.put('/api/qr/revoke', { patientAccessId });
            setPatientAccessId(null);
            setQrExpiry(null);
            setQrData(null);
            showToast('Active QR session revoked.');
        } catch (error) {
            console.error(error);
            showToast('Unable to revoke active QR session.');
        } finally {
            setLoading(false);
        }
    };

    const generateNfcPass = async () => {
        setLoading(true);
        try {
            const patientId = activePatientId;
            const response = await api.post('/api/nfc/generate', { patientId });
            setNfcPass(response.data);
            showToast('NFC emergency pass generated for locked-device fallback.');
        } catch (error) {
            console.error(error);
            showToast('Failed to generate NFC pass.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        showToast('Signed out successfully.');
        navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    };

    const uploadMedicalRecord = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
            });
            if (result.canceled) return;

            setLoading(true);
            const file = result.assets[0];
            const patientId = activePatientId;
            const formData = new FormData();
            formData.append('record', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/pdf',
            } as any);

            const res = await api.post(`/api/patients/${patientId}/upload-records`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.document) {
                setDocs((prev) => [res.data.document, ...prev]);
            }

            const vectorIndex = res.data.vectorIndex as
                | { indexed?: boolean; chunksIndexed?: number; error?: string; attempted?: boolean }
                | undefined;

            if (vectorIndex?.indexed) {
                showToast(`Medical record uploaded and indexed (${vectorIndex.chunksIndexed} chunks).`);
            } else if (vectorIndex?.attempted) {
                showToast(`Record uploaded; vector indexing failed: ${vectorIndex.error || 'unknown issue'}`);
            } else {
                showToast('Medical record uploaded. Add GEMINI_API_KEY to enable vector indexing.');
            }
        } catch (e: any) {
            console.error(e);
            showToast(`Upload failed: ${e?.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const avatarLabel = (user?.name || 'User')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <ScrollView style={styles.container}>
                {/* ── Welcome Header ── */}
                <Surface style={styles.headerCard} elevation={0}>
                    <View style={styles.headerRow}>
                        <Avatar.Text size={52} label={avatarLabel} style={styles.avatar} color="#fff" />
                        <View style={{ flex: 1 }}>
                            <Text variant="headlineMedium" style={styles.welcome}>
                                Welcome back,
                            </Text>
                            <View style={styles.userLine}>
                                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                                {isDoctor && (
                                    <Chip
                                        compact
                                        icon={user?.isVerifiedDoctor ? 'check-decagram' : 'alert-decagram'}
                                        style={user?.isVerifiedDoctor ? styles.verifiedChip : styles.unverifiedChip}
                                        textStyle={user?.isVerifiedDoctor ? styles.verifiedChipText : styles.unverifiedChipText}
                                    >
                                        {user?.isVerifiedDoctor ? 'Verified' : 'Unverified'}
                                    </Chip>
                                )}
                            </View>
                        </View>
                        <IconButton
                            icon="bell-outline"
                            iconColor="#0a0a1a"
                            size={24}
                            onPress={() => navigation.navigate('Notifications')}
                        />
                    </View>

                    {/* System Status */}
                    <Card style={styles.statusCard}>
                        <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 24, marginRight: 12 }}>✅</Text>
                            <View>
                                <Text variant="labelLarge" style={{ fontWeight: 'bold' }}>System Status Optimal</Text>
                                <Text variant="bodySmall" style={{ color: '#666' }}>
                                    All medical records and prescriptions are up to date.
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>
                </Surface>

                {/* ── Quick Actions ── */}
                {isDoctor && (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>

                        <Card style={styles.actionCard} onPress={() => navigation.navigate('QRScanner')}>
                            <Card.Content style={styles.actionContent}>
                                <View style={[styles.actionIcon, { backgroundColor: '#0a0a1a' }]}>
                                    <Text style={{ color: '#fff', fontSize: 18 }}>📷</Text>
                                </View>
                                <View>
                                    <Text variant="labelLarge" style={{ fontWeight: 'bold', color: '#fff' }}>Scan ID</Text>
                                    <Text variant="bodySmall" style={{ color: '#ccc' }}>SCAN PATIENT QR CODE</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card style={styles.actionCard} onPress={() => navigation.navigate('NFCAccess')}>
                            <Card.Content style={styles.actionContent}>
                                <View style={[styles.actionIcon, { backgroundColor: '#0a0a1a' }]}>
                                    <Text style={{ color: '#fff', fontSize: 18 }}>📡</Text>
                                </View>
                                <View>
                                    <Text variant="labelLarge" style={{ fontWeight: 'bold', color: '#fff' }}>NFC Access</Text>
                                    <Text variant="bodySmall" style={{ color: '#ccc' }}>LOCKED-DEVICE ALTERNATIVE</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('AIInsights', { patientId: activePatientId })}
                        >
                            <Card.Content style={styles.actionContent}>
                                <View style={[styles.actionIcon, { backgroundColor: '#0a0a1a' }]}>
                                    <Text style={{ color: '#fff', fontSize: 18 }}>🧠</Text>
                                </View>
                                <View>
                                    <Text variant="labelLarge" style={{ fontWeight: 'bold', color: '#fff' }}>AI RAG Insights</Text>
                                    <Text variant="bodySmall" style={{ color: '#ccc' }}>QDRANT + LLM CLINICAL SUMMARY</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card style={styles.actionCard} onPress={() => navigation.navigate('Analytics')}>
                            <Card.Content style={styles.actionContent}>
                                <View style={[styles.actionIcon, { backgroundColor: '#0a0a1a' }]}>
                                    <Text style={{ color: '#fff', fontSize: 18 }}>📊</Text>
                                </View>
                                <View>
                                    <Text variant="labelLarge" style={{ fontWeight: 'bold', color: '#fff' }}>Analytics</Text>
                                    <Text variant="bodySmall" style={{ color: '#ccc' }}>RISK SCORES, AI SUMMARIES</Text>
                                </View>
                            </Card.Content>
                        </Card>
                    </View>
                )}

                {/* ── Patient Selector (Demo) ── */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        {isDoctor ? 'Select Patient' : 'Your Profile'}
                    </Text>
                    <View style={styles.patientGrid}>
                        {patientOptions.map((p) => (
                            <Chip
                                key={p.id}
                                selected={selectedPatient === p.id}
                                onPress={() => setSelectedPatient(p.id)}
                                style={[
                                    styles.patientChip,
                                    selectedPatient === p.id && { backgroundColor: '#0a0a1a' },
                                ]}
                                textStyle={selectedPatient === p.id ? { color: '#fff' } : {}}
                            >
                                {p.name}
                            </Chip>
                        ))}
                    </View>
                </View>

                {/* ── Secure Identity ── */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Secure Identity</Text>

                    <Card style={styles.secureCard}>
                        <Card.Content style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 40, marginBottom: 8 }}>🔐</Text>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Emergency Profile</Text>
                            <Text variant="bodySmall" style={{ color: '#666', textAlign: 'center', marginVertical: 8 }}>
                                Generate a temporary QR token. Doctor devices must verify identity before data is returned.
                            </Text>

                            <Button
                                mode="contained"
                                onPress={generateOfflineQR}
                                loading={loading}
                                disabled={loading}
                                style={styles.qrBtn}
                                buttonColor="#0a0a1a"
                            >
                                Generate QR Code
                            </Button>

                            {patientAccessId && (
                                <View style={styles.sessionBanner}>
                                    <Chip icon="timer-sand" style={styles.sessionChip} textStyle={{ color: '#fff', fontWeight: '700' }}>
                                        Active Session {formatCountdown(remainingMs)}
                                    </Chip>
                                    <Button
                                        mode="outlined"
                                        compact
                                        icon="close-circle"
                                        onPress={revokeQrSession}
                                        disabled={loading}
                                        style={{ marginTop: 8 }}
                                    >
                                        Revoke Active QR
                                    </Button>
                                </View>
                            )}

                            {!isDoctor && (
                                <>
                                    <Button
                                        mode="outlined"
                                        icon="nfc"
                                        onPress={generateNfcPass}
                                        loading={loading}
                                        disabled={loading}
                                        style={{ marginTop: 10, borderRadius: 10, width: '100%' }}
                                    >
                                        Generate NFC Emergency Pass
                                    </Button>

                                    <Button
                                        mode="outlined"
                                        icon="file-upload"
                                        onPress={uploadMedicalRecord}
                                        loading={loading}
                                        disabled={loading}
                                        style={{ marginTop: 10, borderRadius: 10, width: '100%' }}
                                    >
                                        Upload Medical PDF
                                    </Button>
                                </>
                            )}

                            {payload && qrData && (
                                <View style={styles.qrDisplay}>
                                    <View style={styles.qrCodeBox}>
                                        <QRCode
                                            value={qrData}
                                            size={200}
                                            backgroundColor="#fff"
                                            color="#0a0a1a"
                                        />
                                    </View>
                                    <View style={styles.qrStatus}>
                                        <Text variant="labelMedium" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                                            {payload.name}
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: '#666' }}>
                                            Risk: {payload.riskAssessment?.riskLevel} ({payload.riskAssessment?.riskScore?.toFixed(1)}/10)
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: '#999', marginTop: 4 }}>
                                            Expires: {new Date(payload.expiryTime).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {!isDoctor && nfcPass && (
                                <View style={styles.nfcBox}>
                                    <Text variant="labelLarge" style={{ fontWeight: '700', color: '#0A4A6A' }}>NFC Emergency Pass Ready</Text>
                                    <Text variant="bodySmall" style={{ marginTop: 4, color: '#334155' }}>
                                        Token: {nfcPass.nfcTokenId.substring(0, 12)}...
                                    </Text>
                                    <Text variant="bodySmall" style={{ marginTop: 2, color: '#334155' }}>
                                        Fallback code: {nfcPass.fallbackCode}
                                    </Text>
                                    <Text variant="bodySmall" style={{ marginTop: 2, color: '#64748B' }}>
                                        Expires: {new Date(nfcPass.expiresAt).toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                </View>

                <Divider style={{ marginVertical: 8, marginHorizontal: 16 }} />

                {/* ── Document Viewer ── */}
                {docs.length > 0 && (
                    <View style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Uploaded Medical Records</Text>
                        {docs.map(doc => (
                            <Card key={doc.id} style={{ marginBottom: 8 }} onPress={() => navigation.navigate('DocumentViewer', { url: `${api.defaults.baseURL}${doc.url}`, title: doc.name })}>
                                <Card.Title
                                    title={doc.name}
                                    subtitle="PDF Document"
                                    left={(props) => <IconButton {...props} icon="file-pdf-box" iconColor="#B71C1C" />}
                                    right={(props) => <IconButton {...props} icon="chevron-right" />}
                                />
                            </Card>
                        ))}
                    </View>
                )}

                {/* ── Navigation Grid ── */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Patient Views</Text>

                    <Button mode="outlined" icon="alert-circle" onPress={() => navigation.navigate('EmergencyDashboard')} style={styles.navBtn}>
                        Emergency Dashboard
                    </Button>
                    <Button mode="outlined" icon="chart-line" onPress={() => navigation.navigate('RiskAssessment')} style={styles.navBtn}>
                        Risk Assessment
                    </Button>
                    <Button mode="outlined" icon="pill" onPress={() => navigation.navigate('MedsAndAllergies')} style={styles.navBtn}>
                        Meds & Allergies
                    </Button>
                    <Button mode="outlined" icon="hospital-building" onPress={() => navigation.navigate('NetworkDashboard')} style={styles.navBtn}>
                        Hospital Network
                    </Button>
                    <Button mode="outlined" icon="shield-account" onPress={() => navigation.navigate('PrivacyControl')} style={styles.navBtn}>
                        Privacy Control Center
                    </Button>
                    <Button mode="outlined" icon="brain" onPress={() => navigation.navigate('AIInsights', { patientId: activePatientId })} style={styles.navBtn}>
                        AI Insights (RAG)
                    </Button>
                    <Button mode="outlined" icon="database" onPress={() => navigation.navigate('OfflineRecords')} style={styles.navBtn}>
                        Offline Records
                    </Button>
                </View>

                {/* ── Logout ── */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <Button
                        mode="text"
                        onPress={handleLogout}
                        textColor="#B71C1C"
                        icon="logout"
                    >
                        Sign Out
                    </Button>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    headerCard: {
        backgroundColor: '#F0F2F5', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { backgroundColor: '#0a0a1a' },
    userLine: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    welcome: { fontSize: 24, color: '#333', lineHeight: 30 },
    userName: { color: '#2196F3', fontWeight: 'bold' },
    verifiedChip: { backgroundColor: '#E8F5E9' },
    unverifiedChip: { backgroundColor: '#FFEBEE' },
    verifiedChipText: { color: '#1B5E20', fontWeight: 'bold' },
    unverifiedChipText: { color: '#B71C1C', fontWeight: 'bold' },
    statusCard: {
        marginTop: 16, backgroundColor: '#fff', borderRadius: 16,
        elevation: 1,
    },

    section: { paddingHorizontal: 16, paddingVertical: 8 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 12, color: '#0a0a1a' },

    actionCard: {
        marginBottom: 10, backgroundColor: '#16213e', borderRadius: 16,
    },
    actionContent: {
        flexDirection: 'row', alignItems: 'center',
    },
    actionIcon: {
        width: 44, height: 44, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },

    patientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    patientChip: { backgroundColor: '#E3F2FD' },

    secureCard: {
        backgroundColor: '#F0F4FF', borderRadius: 16,
        borderWidth: 1, borderColor: '#D6E4FF',
    },
    qrBtn: { marginTop: 8, borderRadius: 10, width: '100%' },
    qrDisplay: {
        marginTop: 16, width: '100%', alignItems: 'center',
    },
    sessionBanner: {
        marginTop: 12,
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
        padding: 10,
        alignItems: 'center',
    },
    sessionChip: {
        backgroundColor: '#1D4ED8',
    },
    qrCodeBox: {
        padding: 16, backgroundColor: '#fff', borderRadius: 16,
        borderWidth: 1, borderColor: '#eee',
        elevation: 3,
    },
    qrStatus: {
        marginTop: 12, padding: 10,
        backgroundColor: '#E8F5E9', borderRadius: 8, width: '100%',
    },
    nfcBox: {
        marginTop: 12,
        width: '100%',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        backgroundColor: '#F0F9FF',
    },

    navBtn: { marginBottom: 8 },
});
