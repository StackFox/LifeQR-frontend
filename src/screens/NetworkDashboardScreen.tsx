import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Card, Text, Button, Chip, Avatar, ActivityIndicator, Switch } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../services/apiClient';
import { usePatientStore } from '../store/patientStore';
import { useToastStore } from '../store/toastStore';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'NetworkDashboard'>;

interface NetworkEnrollment {
  networkId: string;
  networkName: string;
  consentLevel: string;
  sharedDataTypes: string[];
  hospitalCount: number;
  hospitals: Array<{
    hospitalId: string;
    hospitalName: string;
    ehrSystem: string;
    city: string;
    state: string;
    isActive: boolean;
    isSharingAllowed?: boolean;
  }>;
}

interface AccessLogEntry {
  logId: string;
  doctorId: string;
  hospitalId: string;
  scanTimestamp: number;
  syncedAt: string;
}

export default function NetworkDashboardScreen({ navigation }: Props) {
  const user = usePatientStore((s) => s.user);
  const showToast = useToastStore((s) => s.showToast);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<NetworkEnrollment | null>(null);
  const [accessHistory, setAccessHistory] = useState<AccessLogEntry[]>([]);

  const patientId = user?.id?.startsWith('P-') ? user.id : 'P-67890';

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const { data } = await api.get(`/api/networks/my-enrollment/${patientId}`);
      setEnrolled(data.enrolled);
      setEnrollment(data.enrollment);
      setAccessHistory(data.accessHistory || []);
    } catch (err) {
      console.error('Failed to fetch network data', err);
      showToast('Failed to load network data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConsent = () => {
    Alert.alert('Update Consent Level', 'Choose new level:', [
      { text: 'FULL', onPress: () => updateConsent('FULL') },
      { text: 'ANONYMIZED', onPress: () => updateConsent('ANONYMIZED') },
      { text: 'EMERGENCY_ONLY', onPress: () => updateConsent('EMERGENCY_ONLY') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const updateConsent = async (level: string) => {
    setLoading(true);
    try {
      await api.put('/api/networks/update-consent', { patientId, consentLevel: level });
      showToast(`Consent updated to ${level}.`);
      fetchNetworkData();
    } catch (e) {
      console.error(e);
      showToast('Could not update consent level.');
      setLoading(false);
    }
  };

  const updateHospitalSharing = async (hospitalId: string, allowSharing: boolean) => {
    try {
      setLoading(true);
      await api.put('/api/networks/hospital-sharing', {
        patientId,
        hospitalId,
        allowSharing,
      });
      showToast(
        allowSharing
          ? `Sharing enabled for hospital ${hospitalId}.`
          : `Sharing disabled for hospital ${hospitalId}.`
      );
      await fetchNetworkData();
    } catch (e) {
      console.error(e);
      showToast('Could not update hospital sharing setting.');
      setLoading(false);
    }
  };

  const handleLeaveNetwork = () => {
    Alert.alert('Leave Network', 'Are you sure you want to completely leave this network and remove your data access?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            await api.post('/api/networks/leave', { patientId });
            showToast('You have left this network.');
            fetchNetworkData();
          } catch (e) {
            console.error(e);
            showToast('Could not leave network.');
            setLoading(false);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading network data...</Text>
      </View>
    );
  }

  if (!enrolled || !enrollment) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">Not enrolled in any network</Text>
        <Text variant="bodySmall" style={{ color: '#666', marginTop: 8, textAlign: 'center' }}>
          Join an Emergency Data Network to share your health records across hospitals.
        </Text>
        <Button mode="contained" style={{ marginTop: 20 }} onPress={() => { }}>
          Browse Networks
        </Button>
      </View>
    );
  }

  const getConsentColor = (level: string) => {
    const colors: Record<string, string> = {
      FULL: '#4CAF50',
      ANONYMIZED: '#FF9800',
      EMERGENCY_ONLY: '#2196F3',
    };
    return colors[level] || '#999';
  };

  return (
    <ScrollView style={styles.container}>
      {/* ── Network Info ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>🏥 {enrollment.networkName}</Text>
          <Text variant="bodyMedium" style={{ color: '#666', marginTop: 8 }}>
            Your medical data is shared across {enrollment.hospitalCount} hospitals in this network.
          </Text>

          <View style={{ marginTop: 12 }}>
            <Chip
              icon="shield-check"
              style={{ backgroundColor: getConsentColor(enrollment.consentLevel), alignSelf: 'flex-start' }}
              textStyle={{ color: '#fff', fontWeight: 'bold' }}
            >
              Consent: {enrollment.consentLevel}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* ── Participating Hospitals ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
            🏨 Participating Hospitals ({enrollment.hospitals.length})
          </Text>

          {enrollment.hospitals.map((hospital, idx) => (
            <View key={idx} style={styles.hospitalItem}>
              <Avatar.Text
                size={40}
                label={hospital.hospitalName.split(' ').map(w => w[0]).join('').substring(0, 2)}
                style={{ backgroundColor: hospital.isActive ? '#4CAF50' : '#999' }}
              />
              <View style={styles.hospitalContent}>
                <Text variant="labelLarge" style={{ fontWeight: '600' }}>{hospital.hospitalName}</Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  {hospital.city}, {hospital.state} • {hospital.ehrSystem}
                </Text>
              </View>
              <Chip
                style={{ backgroundColor: hospital.isActive ? '#E8F5E9' : '#FFEBEE' }}
                textStyle={{ fontSize: 10 }}
              >
                {hospital.isActive ? 'Active' : 'Inactive'}
              </Chip>
              <View style={styles.shareToggleArea}>
                <Text variant="labelSmall" style={{ color: '#555' }}>Share</Text>
                <Switch
                  value={Boolean(hospital.isSharingAllowed)}
                  onValueChange={(value) => updateHospitalSharing(hospital.hospitalId, value)}
                />
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* ── Shared Data Types ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
            📁 Shared Data Types
          </Text>
          <View style={styles.dataTypesList}>
            {enrollment.sharedDataTypes.map((type, idx) => (
              <Chip key={idx} style={styles.dataTypeChip} icon="check-circle">
                {type.replace(/_/g, ' ')}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* ── Access History ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
            📜 Access History ({accessHistory.length})
          </Text>

          {accessHistory.length === 0 ? (
            <Text variant="bodyMedium" style={{ color: '#666', textAlign: 'center', paddingVertical: 16 }}>
              No access records yet. Records appear when doctors scan your QR code.
            </Text>
          ) : (
            accessHistory.slice(0, 10).map((log, idx) => (
              <View key={idx} style={styles.accessLogItem}>
                <Avatar.Icon size={36} icon="doctor" style={{ backgroundColor: '#2196F3' }} />
                <View style={styles.accessLogContent}>
                  <Text variant="labelLarge">Doctor: {log.doctorId}</Text>
                  <Text variant="bodySmall" style={{ color: '#999' }}>
                    Hospital: {log.hospitalId}
                  </Text>
                  <Text variant="bodySmall" style={{ color: '#999' }}>
                    {new Date(log.scanTimestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* ── Network Settings ── */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12 }}>
            ⚙️ Network Settings
          </Text>
          <Button
            mode="contained-tonal"
            onPress={() => navigation.navigate('PrivacyControl')}
            style={{ marginBottom: 8 }}
            icon="shield-account"
          >
            Open Privacy Control Center
          </Button>
          <Button
            mode="outlined"
            onPress={handleUpdateConsent}
            style={{ marginBottom: 8 }}
          >
            Update Consent Level
          </Button>
          <Button
            mode="outlined"
            onPress={handleLeaveNetwork}
            textColor="#F44336"
          >
            Leave Network
          </Button>
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
  hospitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hospitalContent: {
    marginLeft: 12,
    flex: 1,
  },
  shareToggleArea: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dataTypeChip: {
    backgroundColor: '#E3F2FD',
  },
  accessLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  accessLogContent: {
    marginLeft: 12,
    flex: 1,
  },
});
