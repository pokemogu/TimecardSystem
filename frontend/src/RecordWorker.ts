import { openRecordDB } from '@/RecordDBSchema';

async function recordSenderJob() {
  try {
    const db = await openRecordDB();
    const keys = await db.getAllKeys('timecard-record');
    for (const key of keys) {
      const recordData = await db.get('timecard-record', key);
      console.log(recordData);
      await db.delete('timecard-record', key);
    }

  } catch (error) {
    console.log(error);
  }
  console.log('worker working!!');
}

const interval = setInterval(recordSenderJob, 5000);

onmessage = function (event) {
  console.log(event.data);
  if ((event.data as string) === 'ending') {
    clearInterval(interval);
    setTimeout(recordSenderJob, 10000);
  }
}
