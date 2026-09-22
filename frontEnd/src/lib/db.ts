import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AshaPatient, AshaVisit, ScreeningSession, OfflineSyncItem } from '@/types/asha';
import { Vitals } from '@/types/clinical';

interface HealthConnectDB extends DBSchema {
  patients: {
    key: string;
    value: AshaPatient;
    indexes: { 'by-village': string; 'by-high-risk': number };
  };
  visits: {
    key: string;
    value: AshaVisit;
    indexes: { 'by-patient': string; 'by-date': string };
  };
  vitals: {
    key: string;
    value: Vitals & { id: string; localCreatedAt: string };
    indexes: { 'by-patient': string };
  };
  screenings: {
    key: string;
    value: ScreeningSession;
    indexes: { 'by-patient': string };
  };
  syncQueue: {
    key: string;
    value: OfflineSyncItem;
    indexes: { 'by-status': string };
  };
}

const DB_NAME = 'healthconnect_offline_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<HealthConnectDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<HealthConnectDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HealthConnectDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('patients')) {
          const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
          patientStore.createIndex('by-village', 'village');
          patientStore.createIndex('by-high-risk', 'isHighRisk');
        }

        if (!db.objectStoreNames.contains('visits')) {
          const visitStore = db.createObjectStore('visits', { keyPath: 'id' });
          visitStore.createIndex('by-patient', 'patientId');
          visitStore.createIndex('by-date', 'visitDate');
        }

        if (!db.objectStoreNames.contains('vitals')) {
          const vitalsStore = db.createObjectStore('vitals', { keyPath: 'id' });
          vitalsStore.createIndex('by-patient', 'patientId');
        }

        if (!db.objectStoreNames.contains('screenings')) {
          const screeningStore = db.createObjectStore('screenings', { keyPath: 'id' });
          screeningStore.createIndex('by-patient', 'patientId');
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-status', 'status');
        }
      },
    });
  }
  return dbPromise;
}

// Helper methods for ASHA offline workflow
export async function saveOfflinePatient(patient: AshaPatient): Promise<void> {
  const db = await getDB();
  await db.put('patients', patient);
  // Also queue for sync
  await queueMutation('PATIENT_REGISTRATION', patient as unknown as Record<string, unknown>);
}

export async function getOfflinePatients(): Promise<AshaPatient[]> {
  const db = await getDB();
  return db.getAll('patients');
}

export async function saveOfflineVisit(visit: AshaVisit): Promise<void> {
  const db = await getDB();
  const id = visit.id || `local_vis_${Date.now()}`;
  const record = { ...visit, id };
  await db.put('visits', record);
  await queueMutation('VISIT_NOTE', record as unknown as Record<string, unknown>);
}

export async function getOfflineVisits(): Promise<AshaVisit[]> {
  const db = await getDB();
  return db.getAll('visits');
}

export async function saveOfflineVitals(vitals: Vitals): Promise<void> {
  const db = await getDB();
  const id = vitals.id || `local_vital_${Date.now()}`;
  await db.put('vitals', {
    ...vitals,
    id,
    localCreatedAt: new Date().toISOString(),
  });
  await queueMutation('VITALS', { ...vitals, id });
}

export async function saveOfflineScreening(screening: ScreeningSession): Promise<void> {
  const db = await getDB();
  await db.put('screenings', screening);
  await queueMutation('SCREENING', screening as unknown as Record<string, unknown>);
}

export async function queueMutation(
  entityType: OfflineSyncItem['entityType'],
  payload: Record<string, unknown>
): Promise<string> {
  const db = await getDB();
  const syncItem: OfflineSyncItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    entityType,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'PENDING',
  };
  await db.put('syncQueue', syncItem);
  return syncItem.id;
}

export async function getPendingSyncCount(): Promise<number> {
  try {
    const db = await getDB();
    const items = await db.getAllFromIndex('syncQueue', 'by-status', 'PENDING');
    return items.length;
  } catch {
    return 0;
  }
}

export async function getPendingSyncItems(): Promise<OfflineSyncItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-status', 'PENDING');
}

export async function markSyncItemCompleted(id: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    item.status = 'SYNCED';
    await db.put('syncQueue', item);
  }
}

export async function clearSyncedItems(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const index = tx.store.index('by-status');
  let cursor = await index.openCursor('SYNCED');
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
