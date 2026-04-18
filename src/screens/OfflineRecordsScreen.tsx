import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { Card, Text, Chip, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { getOfflineRecords } from '../db/sqlite';
import { usePatientStore } from '../store/patientStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'OfflineRecords'>;

interface OfflineRecord {
  qrTokenId: string;
  patientId: string;
  data: any;
  scannedAt: number;
  syncStatus: string;
}

const getRiskColor = (level: string) => {
  const colors: Record<string, string> = {
    LOW: '#4CAF50',
    MODERATE: '#FF9800',
    HIGH: '#F44336',
    CRITICAL: '#B71C1C',
  };
  return colors[level] || '#999';
};

export default function OfflineRecordsScreen({ navigation }: Props) {
  const [records, setRecords] = useState<OfflineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const setOfflinePayload = usePatientStore((state) => state.setOfflinePayload);

  const loadRecords = useCallback(async () => {
    try {
      const rows = await getOfflineRecords();
      setRecords(rows);
    } catch (err) {
      console.error('Failed to load offline records', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  const loadRecord = (record: OfflineRecord) => {
    setOfflinePayload(record.data);
    navigation.navigate('EmergencyDashboard');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#fff' }}>
            📱 Offline Records ({records.length})
          </Text>
          <Text variant="bodySmall" style={{ color: '#aaa', marginTop: 4 }}>
            Previously scanned patient QR codes stored locally on device.
          </Text>
        </Card.Content>
      </Card>

      {records.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text variant="titleMedium" style={{ color: '#999' }}>No records yet</Text>
            <Text variant="bodySmall" style={{ color: '#999', marginTop: 8 }}>
              Scan a patient QR code to store records locally.
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('QRScanner')}
              style={{ marginTop: 16 }}
              icon="qrcode-scan"
            >
              Scan QR Code
            </Button>
          </Card.Content>
        </Card>
      ) : (
        records.map((record, idx) => {
          const data = record.data;
          const riskLevel = data?.riskAssessment?.riskLevel || 'N/A';

          return (
            <Card
              key={record.qrTokenId || idx}
              style={[styles.card, { borderLeftColor: getRiskColor(riskLevel), borderLeftWidth: 4 }]}
              onPress={() => loadRecord(record)}
            >
              <Card.Content>
                <View style={styles.recordHeader}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', flex: 1 }}>
                    {data?.name || 'Unknown'}
                  </Text>
                  <Chip
                    style={{ backgroundColor: getRiskColor(riskLevel) }}
                    textStyle={{ color: '#fff', fontSize: 11 }}
                  >
                    {riskLevel}
                  </Chip>
                </View>

                <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
                  ID: {record.patientId} • Blood: {data?.bloodType || 'N/A'}
                </Text>
                <Text variant="bodySmall" style={{ color: '#999', marginTop: 2 }}>
                  Scanned: {new Date(record.scannedAt).toLocaleString()}
                </Text>

                <View style={styles.statusRow}>
                  <Chip
                    style={{
                      backgroundColor: record.syncStatus === 'synced' ? '#E8F5E9' : '#FFF3E0',
                    }}
                    textStyle={{ fontSize: 10 }}
                    icon={record.syncStatus === 'synced' ? 'check-circle' : 'clock-outline'}
                  >
                    {record.syncStatus === 'synced' ? 'Synced' : 'Pending Sync'}
                  </Chip>

                  {data?.allergies?.length > 0 && (
                    <Chip style={{ backgroundColor: '#FFEBEE' }} textStyle={{ fontSize: 10 }}>
                      {data.allergies.length} allergies
                    </Chip>
                  )}

                  {data?.medications?.length > 0 && (
                    <Chip style={{ backgroundColor: '#E3F2FD' }} textStyle={{ fontSize: 10 }}>
                      {data.medications.length} meds
                    </Chip>
                  )}
                </View>
              </Card.Content>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  headerCard: {
    marginBottom: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  card: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
});
