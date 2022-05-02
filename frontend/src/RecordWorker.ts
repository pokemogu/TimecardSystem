import { openRecordDB, openDeviceDB, openCacheInfoDB, openUserCacheDB } from '@/RecordDBSchema';
import * as backendAccess from '@/BackendAccess';

function dateToStr(date: Date) {
  return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
}

async function loadUserCache(accessToken: string) {

  const cacheInfoDb = await openCacheInfoDB();
  if (cacheInfoDb) {
    const userCacheInfo = await cacheInfoDb.get('timecard-cache-info', 'user-info');
    const timestamp = userCacheInfo ? userCacheInfo.timestamp : new Date(0);

    const minuteDiff = Math.floor((new Date().getTime() - timestamp.getTime()) / (1000 * 60));
    if (minuteDiff > 60) {
      console.log('Updating user info cache...');
      const access = new backendAccess.TokenAccess(accessToken);
      const userInfos = await access.getUserInfos({ isQrCodeIssued: true });

      let updatedUserInfoNum = 0;
      if (userInfos) {
        const dateToday = new Date(); dateToday.setHours(0); dateToday.setMinutes(0); dateToday.setSeconds(0);

        // 全ユーザー分の本日の勤務形態を一括取得する
        const userWorkPatternInfos = await access.getUserWorkPatternCalendar({
          from: dateToStr(dateToday),
          to: dateToStr(dateToday),
          accounts: userInfos.map(userInfo => userInfo.account)
        });

        const userCacheDb = await openUserCacheDB();
        await userCacheDb.clear('timecard-user-cache');

        for (const userInfo of userInfos) {
          const userWorkPattern = userWorkPatternInfos?.find(info => info.user.account === userInfo.account);

          await userCacheDb.put('timecard-user-cache', {
            name: userInfo.name,
            phonetic: userInfo.phonetic,
            section: userInfo.section,
            department: userInfo.department,
            workPattern: userWorkPattern?.workPattern ? {
              date: dateToday,
              onTimeStart: new Date(userWorkPattern.workPattern.onDateTimeStart),
              onTimeEnd: new Date(userWorkPattern.workPattern.onDateTimeEnd)
            } : undefined
          }, userInfo.account);

          updatedUserInfoNum = await userCacheDb.count('timecard-user-cache');
        }
        userCacheDb.close();
      }
      if (updatedUserInfoNum > 0) {
        cacheInfoDb.put('timecard-cache-info', { timestamp: new Date() }, 'user-info');
      }
    }
    cacheInfoDb.close();
  }
}

async function recordSenderJob() {
  try {
    const recordDb = await openRecordDB();
    const deviceDb = await openDeviceDB();
    const recordKeys = await recordDb.getAllKeys('timecard-record');
    const deviceKeys = await deviceDb.getAllKeys('timecard-device');

    // ユーザー情報の取得に失敗しても後続の打刻送信は実行する
    let deviceAccount = '';
    let deviceRefreshToken = '';
    try {
      if (deviceKeys.length > 0) {
        deviceAccount = deviceKeys[0];
        const deviceData = await deviceDb.get('timecard-device', deviceKeys[0]);
        if (deviceData?.refreshToken) {
          deviceRefreshToken = deviceData.refreshToken;
        }

        if (deviceRefreshToken !== '') {
          const result = await backendAccess.getToken(deviceRefreshToken);
          if (result?.token) {
            await loadUserCache(result.token.accessToken);
          }
        }
      }
    } catch (error) {
      console.log(error);
      postMessage({ type: 'error', message: error });
    }

    //const userCacheDb = await openUserCacheDB();
    //console.log(await userCacheDb.getAll('timecard-user-cache'));

    if (recordKeys.length > 0) {
      // 未送信の打刻を送信する
      for (const key of recordKeys) {
        try { // 有るユーザーの打刻送信が失敗したとしても他のユーザーの打刻送信は継続する

          const recordData = await recordDb.get('timecard-record', key);
          if (recordData && recordData.isSent === false) {
            const token = await backendAccess.getToken(recordData.refreshToken);
            if (token?.token) {
              const access = new backendAccess.TokenAccess(token.token.accessToken);
              await access.record(recordData.type, recordData.timestamp, deviceAccount !== '' ? deviceAccount : undefined);
              recordData.isSent = true;
              recordData.refreshToken = '';

              await recordDb.put('timecard-record', recordData, key);
              postMessage({ type: 'info', message: `record for ${recordData.account} sent` });
            }
          }

        } catch (error) {
          console.log(error);
          postMessage({ type: 'error', message: error });
        }
      }
    }
  } catch (error) {
    console.log(error);
    postMessage({ type: 'error', message: error });
  }
}

async function recordCacheDeleteJob() {
  try {
    const recordDb = await openRecordDB();
    const recordKeys = await recordDb.getAllKeys('timecard-record');

    // 送信済打刻で2日が経過したものは削除する
    for (const key of recordKeys) {
      const recordData = await recordDb.get('timecard-record', key);
      if (recordData && recordData.isSent === true) {
        const minuteDiff = Math.floor((new Date().getTime() - recordData.timestamp.getTime()) / (1000 * 60));
        if (minuteDiff > (60 * 24 * 2)) {
          await recordDb.delete('timecard-record', key);
        }
      }
    }
  } catch (error) {
    console.log(error);
    postMessage({ type: 'error', message: error });
  }
}

const intervalRecordSender = setInterval(recordSenderJob, 5 * 1000);
const intervalRecordCacheDelete = setInterval(recordCacheDeleteJob, 60 * 60 * 1000);

onmessage = function (event) {
  console.log(event.data);
  if ((event.data as string) === 'ending') {
    clearInterval(intervalRecordSender);
    setTimeout(recordSenderJob, 10000); // 未送信の打刻を最後に送信する
    clearInterval(intervalRecordCacheDelete);
  }
}
