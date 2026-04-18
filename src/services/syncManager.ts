// Sync manager: attempts to sync offline-scanned records with backend
import api from './apiClient';
import { getOfflineRecords, updateSyncStatus } from '../db/sqlite';

/**
 * Attempt to sync all pending offline records with backend.
 * Fire-and-forget — failures leave records as 'pending' for retry.
 */
export async function syncPendingRecords(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  try {
    const records = await getOfflineRecords();
    const pending = records.filter(r => r.syncStatus === 'pending');

    for (const record of pending) {
      try {
        await api.post('/api/access-logs/sync-offline', {
          qrTokenId: record.qrTokenId,
          patientId: record.patientId,
          doctorId: 'DEMO_DOCTOR',
          hospitalId: 'DEMO_HOSPITAL',
          scanTimestamp: record.scannedAt,
          offlineDecrypted: true,
        });

        await updateSyncStatus(record.qrTokenId, 'synced');
        synced++;
      } catch (err) {
        console.warn(`Sync failed for ${record.qrTokenId}:`, err);
        failed++;
      }
    }
  } catch (err) {
    console.error('Sync manager error:', err);
  }

  return { synced, failed };
}
