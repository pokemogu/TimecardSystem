import { openDB } from 'idb';
import type { DBSchema } from 'idb';

export interface RecordDB extends DBSchema {
  'timecard-record': {
    key: number;
    value: {
      type: string,
      refreshToken: string,
      timestamp: Date
    };
  };
}

export async function openRecordDB() {
  return await openDB<RecordDB>('timecard-record', 1, {
    upgrade(db) {
      db.createObjectStore('timecard-record', { autoIncrement: true });
    }
  });
}