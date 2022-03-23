import { openRecordDB } from '@/RecordDBSchema';
import * as backendAccess from '@/BackendAccess';

async function recordSenderJob() {
  try {
    const db = await openRecordDB();
    const keys = await db.getAllKeys('timecard-record');

    if (keys.length > 0) {
      for (const key of keys) {
        const recordData = await db.get('timecard-record', key);
        if (recordData) {
          const token = await backendAccess.getToken(recordData.refreshToken);
          const access = new backendAccess.TokenAccess(token.accessToken);
          await access.record(recordData.type, recordData.timestamp);
          await db.delete('timecard-record', key);
        }
      }
      postMessage({ type: 'info', message: 'records sent' });
    }

  } catch (error) {
    console.log(error);
    postMessage({ type: 'error', message: error });
  }
}

const interval = setInterval(recordSenderJob, 5000);

onmessage = function (event) {
  console.log(event.data);
  if ((event.data as string) === 'ending') {
    clearInterval(interval);
    setTimeout(recordSenderJob, 10000);
  }
}
