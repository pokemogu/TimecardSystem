import { openDB } from 'idb';
import type { DBSchema } from 'idb';

export interface RecordDB extends DBSchema {
  'timecard-record': {
    key: number;
    value: {
      account: string,
      type: string,
      refreshToken: string,
      timestamp: Date,
      isSent: boolean
    };
    indexes: {
      'by-account': string
    };
  };

  'timecard-device': {
    key: string;
    value: {
      name: string,
      refreshToken?: string,
      timestamp?: Date
    };
  };

  'timecard-cache-info': {
    key: string,
    value: {
      timestamp: Date
    }
  };

  'timecard-user-cache': {
    key: string;
    value: {
      name: string,
      phonetic?: string,
      section?: string,
      department?: string,
      workPattern?: {
        date: Date,
        onTimeStart: Date,
        onTimeEnd: Date
      }
    };
  };
}

export async function openRecordDB() {
  return await openDB<RecordDB>('timecard-record', 1, {
    upgrade(db) {
      const store = db.createObjectStore('timecard-record', { autoIncrement: true });
      store.createIndex('by-account', 'account');
    }
  });
}

export async function openDeviceDB() {
  return await openDB<RecordDB>('timecard-device', 1, {
    upgrade(db) {
      db.createObjectStore('timecard-device');
    }
  });
}

export async function openCacheInfoDB() {
  return await openDB<RecordDB>('timecard-cache-info', 1, {
    upgrade(db) {
      db.createObjectStore('timecard-cache-info');
    }
  });
}

export async function openUserCacheDB() {
  return await openDB<RecordDB>('timecard-user-cache', 1, {
    upgrade(db) {
      db.createObjectStore('timecard-user-cache');
    }
  });
}