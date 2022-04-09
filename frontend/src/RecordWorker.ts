import { openRecordDB, openDeviceDB, openCacheInfoDB, openUserCacheDB } from '@/RecordDBSchema';
import type { RecordDB } from '@/RecordDBSchema';
import * as backendAccess from '@/BackendAccess';

function timeToMinutes(time: string) {
  const hourMin = time.split(':', 2).map(num => parseInt(num));
  if (hourMin.length > 1) {
    return (hourMin[0] * 60) + hourMin[1];
  } else {
    return 0;
  }
}

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
        //const dateTommorow = new Date(dateToday); dateTommorow.setDate(dateTommorow.getDate() + 1);

        const workPatternInfos = await access.getWorkPatterns();
        const userWorkPatternInfos = await access.getUserWorkPatternCalendar({
          from: dateToStr(dateToday),
          to: dateToStr(dateToday),
          accounts: userInfos.map(userInfo => userInfo.account)
        });

        const userCacheDb = await openUserCacheDB();
        await userCacheDb.clear('timecard-user-cache');
        for (const userInfo of userInfos) {

          let hasWorkPattern = false;
          const dateOnTimeStart = new Date(dateToday);
          const dateOnTimeEnd = new Date(dateToday);
          if (userWorkPatternInfos && workPatternInfos) {
            const workPattern = workPatternInfos.find(info => info.name === userInfo.defaultWorkPatternName);
            const userWorkPattern = userWorkPatternInfos.find(info => info.user.account === userInfo.account);

            // 当日の勤務体系が設定されている場合はそれを使用する
            if (userWorkPattern?.workPattern) {
              dateOnTimeStart.setMinutes(dateOnTimeStart.getMinutes() + timeToMinutes(userWorkPattern.workPattern.onTimeStart));
              dateOnTimeEnd.setMinutes(dateOnTimeEnd.getMinutes() + timeToMinutes(userWorkPattern.workPattern.onTimeEnd));
              hasWorkPattern = true;
            }
            // 当日の勤務体系が設定されていない場合はデフォルトの勤務体系を使用する
            else if (workPattern && dateToday.getDay() !== 0 && dateToday.getDay() !== 6) {
              dateOnTimeStart.setMinutes(dateOnTimeStart.getMinutes() + timeToMinutes(workPattern.onTimeStart));
              dateOnTimeEnd.setMinutes(dateOnTimeEnd.getMinutes() + timeToMinutes(workPattern.onTimeEnd));
              hasWorkPattern = true;
            }
          }

          await userCacheDb.put('timecard-user-cache', {
            name: userInfo.name,
            phonetic: userInfo.phonetic,
            section: userInfo.section,
            department: userInfo.department,
            workPattern: hasWorkPattern ? {
              date: dateToday,
              onTimeStart: dateOnTimeStart,
              onTimeEnd: dateOnTimeEnd
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

    const userCacheDb = await openUserCacheDB();
    //console.log(await userCacheDb.getAll('timecard-user-cache'));

    if (recordKeys.length > 0) {
      for (const key of recordKeys) {
        const recordData = await recordDb.get('timecard-record', key);
        if (recordData && recordData.isSent === false) {
          const token = await backendAccess.getToken(recordData.refreshToken);
          if (token?.token) {
            const access = new backendAccess.TokenAccess(token.token.accessToken);
            console.log('deviceAccount: ' + deviceAccount);
            await access.record(recordData.type, recordData.timestamp, deviceAccount !== '' ? deviceAccount : undefined);
            recordData.isSent = true;
            recordData.refreshToken = '';
            //await recordDb.delete('timecard-record', key);
            await recordDb.put('timecard-record', recordData, key);
            postMessage({ type: 'info', message: 'records sent' });
          }
        }
      }
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
