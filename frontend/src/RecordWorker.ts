import { openRecordDB, openDeviceDB } from '@/RecordDBSchema';
import * as backendAccess from '@/BackendAccess';

async function recordSenderJob() {
  try {
    const recordDb = await openRecordDB();
    const deviceDb = await openDeviceDB();
    const recordKeys = await recordDb.getAllKeys('timecard-record');
    const deviceKeys = await deviceDb.getAllKeys('timecard-device');

    if (recordKeys.length > 0) {
      for (const key of recordKeys) {
        const recordData = await recordDb.get('timecard-record', key);
        if (recordData) {
          const token = await backendAccess.getToken(recordData.refreshToken);
          if (token.token) {
            const access = new backendAccess.TokenAccess(token.token?.accessToken);
            await access.record(recordData.type, recordData.timestamp, deviceKeys.length > 0 ? deviceKeys[0] : undefined);
            await recordDb.delete('timecard-record', key);
          }
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
