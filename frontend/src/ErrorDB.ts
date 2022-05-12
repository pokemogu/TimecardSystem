import { openDB } from 'idb';
import type { DBSchema } from 'idb';

interface ErrorDB extends DBSchema {
  'timecard-error': {
    key: number;
    value: {
      account: string,
      isDevice: boolean,
      timestamp: Date,
      name?: string,
      message?: string,
      stack?: string
    };
    indexes: {
      'by-account': string,
      'by-timestamp': Date
    };
  };
}

async function openErrorDB() {
  return await openDB<ErrorDB>('timecard-error', 1, {
    upgrade(db) {
      const store = db.createObjectStore('timecard-error', { autoIncrement: true });
      store.createIndex('by-account', 'account');
      store.createIndex('by-timestamp', 'timestamp');
    }
  });
}

export async function putErrorToDB(account: string, error: Error, isDevice: boolean = false) {
  if (!(error instanceof Error)) {
    return;
  }

  const db = await openErrorDB();

  // 古いログは削除する
  const monthAgoDate = new Date();
  monthAgoDate.setMonth(monthAgoDate.getMonth() - 1);
  monthAgoDate.setHours(0, 0, 0, 0);
  const keys = await db.getAllKeysFromIndex('timecard-error', 'by-timestamp', IDBKeyRange.upperBound(monthAgoDate));
  for (const key of keys) {
    await db.delete('timecard-error', key);
  }

  // エラーログを追記する
  await db.put('timecard-error', {
    account: account,
    isDevice: isDevice,
    timestamp: new Date,
    name: error.name ?? undefined,
    message: error.message ?? undefined,
    stack: error.stack ?? undefined
  })

  db.close();
}

export async function getErrorsFromDB(isDevice: boolean = false) {
  const errors: Error[] = [];

  const db = await openErrorDB();
  const results = (await db.getAll('timecard-error')).filter(result => result.isDevice === isDevice);

  for (const result of results) {
    const error = new Error();
    if (result.name) {
      error.name = result.name;
    }
    if (result.account) {
      error.name += ` (${result.account})`
    }
    if (result.message) {
      error.message = result.message;
    }
    if (result.stack) {
      error.stack = result.stack;
    }
    errors.push(error);
  }

  db.close();
  return errors;
}