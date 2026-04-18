// SQLite initialization for offline records
import * as SQLite from 'expo-sqlite';

export const dbUrl = 'ehis_db.sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
    if (!_db) {
        _db = await SQLite.openDatabaseAsync(dbUrl);
    }
    return _db;
}

export async function initDB() {
    const db = await getDb();
    await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY NOT NULL,
      timestamp INTEGER NOT NULL,
      doctor_id TEXT,
      hospital_id TEXT
    );

    CREATE TABLE IF NOT EXISTS scanned_records (
      qrTokenId TEXT PRIMARY KEY NOT NULL,
      patientId TEXT NOT NULL,
      data TEXT NOT NULL,
      scannedAt INTEGER NOT NULL,
      syncStatus TEXT DEFAULT 'pending'
    );
  `);
    console.log('EHIS DB initialized (access_logs + scanned_records)');
}

export async function logAccess(doctorId: string, hospitalId: string) {
    const db = await getDb();
    await db.runAsync('INSERT INTO access_logs (timestamp, doctor_id, hospital_id) VALUES (?, ?, ?)', [
        Date.now(), doctorId, hospitalId
    ]);
}

export async function storeOfflineRecord(payload: any) {
    const db = await getDb();
    await db.runAsync(
        `INSERT OR REPLACE INTO scanned_records (qrTokenId, patientId, data, scannedAt, syncStatus) VALUES (?, ?, ?, ?, ?)`,
        [
            payload.qrTokenId || 'unknown',
            payload.patientId || 'unknown',
            JSON.stringify(payload),
            Date.now(),
            'pending'
        ]
    );
}

export async function getOfflineRecords(): Promise<any[]> {
    const db = await getDb();
    const rows = await db.getAllAsync('SELECT * FROM scanned_records ORDER BY scannedAt DESC');
    return rows.map((row: any) => ({
        ...row,
        data: JSON.parse(row.data),
    }));
}

export async function updateSyncStatus(qrTokenId: string, status: string) {
    const db = await getDb();
    await db.runAsync('UPDATE scanned_records SET syncStatus = ? WHERE qrTokenId = ?', [status, qrTokenId]);
}
