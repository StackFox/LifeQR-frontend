import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { usePatientStore } from '../store/patientStore';
import api from '../services/apiClient';
import { useToastStore } from '../store/toastStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
    const user = usePatientStore((s) => s.user);
    const showToast = useToastStore((s) => s.showToast);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [accessRequests, setAccessRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadNotifications();
        if (user?.role === 'PATIENT') {
            loadAccessRequests();
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await api.get(`/api/notifications/${user.id}?role=${user.role}`);
            setNotifications(res.data.notifications || []);
        } catch (e) {
            console.error('Error loading notifications:', e);
            showToast('Could not load notifications.');
        } finally {
            setLoading(false);
        }
    };

    const loadAccessRequests = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/api/access-requests/patient/${user.id}`);
            setAccessRequests(res.data.requests || []);
        } catch (e) {
            console.error('Error loading requests:', e);
            showToast('Could not load access requests.');
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await api.put(`/api/notifications/${notificationId}/read`);
            setNotifications(notif => notif.map(n => n.notificationId === notificationId ? { ...n, status: 'READ' } : n));
        } catch (e) {
            console.error('Error marking as read:', e);
            showToast('Could not mark notification as read.');
        }
    };

    const approveRequest = async (requestId: string) => {
        try {
            await api.put(`/api/access-requests/${requestId}/approve`);
            setAccessRequests(reqs => reqs.map(r => r.requestId === requestId ? { ...r, status: 'APPROVED' } : r));
            showToast('Access request approved.');
            loadNotifications();
        } catch (e) {
            console.error('Error approving request:', e);
            showToast('Could not approve request.');
        }
    };

    const rejectRequest = async (requestId: string) => {
        try {
            await api.put(`/api/access-requests/${requestId}/reject`);
            setAccessRequests(reqs => reqs.map(r => r.requestId === requestId ? { ...r, status: 'REJECTED' } : r));
            showToast('Access request rejected.');
            loadNotifications();
        } catch (e) {
            console.error('Error rejecting request:', e);
            showToast('Could not reject request.');
        }
    };

    const notifTypeColor = (type: string) => {
        switch (type) {
            case 'ACCESS_LOG': return '#2196F3';
            case 'ACCESS_REQUEST': return '#FF9800';
            case 'SYSTEM': return '#4CAF50';
            default: return '#999';
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text variant="headlineSmall" style={styles.title}>📬 Notifications</Text>

            {/* Pending Access Requests */}
            {user?.role === 'PATIENT' && (
                <>
                    <Text variant="titleMedium" style={styles.subtitle}>⏳ Pending Access Requests</Text>
                    {accessRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                        <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No pending requests</Text>
                    ) : (
                        accessRequests.filter(r => r.status === 'PENDING').map(req => (
                            <Card key={req.requestId} style={[styles.card, { borderLeftColor: '#FF9800', borderLeftWidth: 4 }]}>
                                <Card.Content>
                                    <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>🔐 {req.doctorId}</Text>
                                    <Text variant="bodySmall" style={{ marginVertical: 4, color: '#666' }}>
                                        {req.reason || 'Requested access to your medical data'}
                                    </Text>
                                    <View style={styles.buttonGroup}>
                                        <Button mode="contained" onPress={() => approveRequest(req.requestId)} style={styles.approveBtn}>
                                            Approve
                                        </Button>
                                        <Button mode="outlined" onPress={() => rejectRequest(req.requestId)}>
                                            Reject
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )}
                </>
            )}

            {/* Notifications */}
            <Text variant="titleMedium" style={styles.subtitle}>🔔 Recent Activity</Text>
            {notifications.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No notifications yet</Text>
            ) : (
                notifications.map(notif => (
                    <Card
                        key={notif.notificationId}
                        style={[styles.card, { borderLeftColor: notifTypeColor(notif.type), borderLeftWidth: 4 }]}
                        onPress={() => markAsRead(notif.notificationId)}
                    >
                        <Card.Content>
                            <View style={styles.notifHeader}>
                                <Text variant="titleSmall" style={{ flex: 1, fontWeight: 'bold' }}>
                                    {notif.title}
                                </Text>
                                <Chip
                                    style={{ backgroundColor: notif.status === 'UNREAD' ? '#2196F3' : '#e0e0e0' }}
                                    textStyle={{ color: notif.status === 'UNREAD' ? '#fff' : '#666' }}
                                >
                                    {notif.status === 'UNREAD' ? 'NEW' : 'Read'}
                                </Chip>
                            </View>
                            <Text variant="bodySmall" style={{ marginVertical: 8, color: '#666' }}>
                                {notif.message}
                            </Text>
                            <Text variant="labelSmall" style={{ color: '#999' }}>
                                {new Date(notif.createdAt).toLocaleString()}
                            </Text>
                        </Card.Content>
                    </Card>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
    title: { fontWeight: 'bold', marginBottom: 16 },
    subtitle: { fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
    card: { marginBottom: 12, backgroundColor: '#fff' },
    notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    buttonGroup: { flexDirection: 'row', gap: 8, marginTop: 12 },
    approveBtn: { flex: 1 }
});
