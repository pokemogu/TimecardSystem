<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useLoading } from 'vue-loading-overlay'

import { useSessionStore } from '@/stores/session';
import * as backendAccess from '@/BackendAccess';

import Header from '@/components/Header.vue';
import { putErrorToDB } from '@/ErrorDB';

import { openRecordDB, openDeviceDB, openUserCacheDB } from '@/RecordDBSchema';
import RecordWorker from '@/RecordWorker?worker';

function setTimeStr(date: Date) {
  const hourStr = date.getHours().toString().padStart(2, '0');
  const minStr = date.getMinutes().toString().padStart(2, '0');
  const secStr = date.getSeconds().toString().padStart(2, '0');
  return `${hourStr}:${minStr}:${secStr}`;
}

function dateToStr(date: Date) {
  return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
}

function dateToTimeStr(date: Date) {
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
}

const router = useRouter();
const store = useSessionStore();
let refreshToken = '';

const timeStr = ref(setTimeStr(new Date()));
setInterval(() => { timeStr.value = setTimeStr(new Date()) }, 1000);

const recordType = ref('clockin');
const errorName = ref('');
const headerMessage = ref('');

const userAccount = ref('');
const userName = ref('');
const status = ref('');

const clockinTime = ref('');
const breakTime = ref('');
const reenterTime = ref('');
const clockoutTime = ref('');
const onTime = ref('');

let timeout = setTimeout(() => { }, 0);
const $loading = useLoading();

async function initStatus() {
  refreshToken = '';
  userAccount.value = store.isLoggedIn() ? store.userAccount : '';
  userName.value = store.isLoggedIn() ? store.userName : '';
  errorName.value = '';
  status.value = store.isLoggedIn() ? 'waitForRecord' : 'waitForScan';

  // QR打刻画面の場合
  if (!store.isLoggedIn()) {
    clockinTime.value = '';
    breakTime.value = '';
    reenterTime.value = '';
    clockoutTime.value = '';
    onTime.value = '';
  }
  // ログイン打刻の場合
  else {
    const loader = $loading.show({ opacity: 0 });

    try {
      const access = await store.getTokenAccess();
      const todayStr = dateToStr(new Date());

      // 本日の打刻実績を取得する
      const records = await access.getRecords({
        byUserAccount: store.userAccount,
        from: todayStr,
        to: todayStr
      });

      if (records && records.length > 0) {
        if (records[0].clockin) {
          clockinTime.value = dateToTimeStr(new Date(records[0].clockin.timestamp));
        }
        if (records[0].break) {
          breakTime.value = dateToTimeStr(new Date(records[0].break.timestamp));
        }
        if (records[0].reenter) {
          reenterTime.value = dateToTimeStr(new Date(records[0].reenter.timestamp));
        }
        if (records[0].clockout) {
          clockoutTime.value = dateToTimeStr(new Date(records[0].clockout.timestamp));
        }
      }

      // 本日の勤務形態を取得する
      const userWorkPattern = await access.getUserWorkPatternCalendar({ from: todayStr, to: todayStr });
      if (userWorkPattern && userWorkPattern.length > 0) {
        if (userWorkPattern[0].workPattern) {
          onTime.value =
            dateToTimeStr(new Date(userWorkPattern[0].workPattern.onDateTimeStart)) + ' 〜 ' + dateToTimeStr(new Date(userWorkPattern[0].workPattern.onDateTimeEnd));
        }
        else {
          onTime.value = '勤務予定無し';
        }
      }
    }
    catch (error) {
      console.error(error);
      await putErrorToDB(store.userAccount, error as Error);
      alert(error);
    }
    loader.hide();
  }
};

const recordTokenCatch = (error: Error) => {
  if (error.name === '401') {
    console.error(error);
    errorName.value = 'TokenAuthFailedError';
  }
  else {
    errorName.value = error.toString();
  }
  status.value = 'error';

  clearTimeout(timeout);
  timeout = setTimeout(initStatus, 5000);
};

let qrCodeString = '';
async function onKeyPressed(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    await onDecode(qrCodeString);
    qrCodeString = '';
  }
  else {
    qrCodeString = qrCodeString + event.key;
  }
}

// 打刻端末名に関する設定
const thisDeviceName = ref('');

onMounted(async () => {

  try {
    // QR打刻画面の場合
    if (!store.isLoggedIn()) {
      // バックグラウンドでの打刻送信ワーカーを起動する
      const worker = new RecordWorker();

      worker.onmessage = (ev) => {
        const message: { type: string, message: string } = ev.data;
        if (message.type === 'error') {
          headerMessage.value = message.message;
          setTimeout(() => {
            headerMessage.value = '';
          }, 5000);
        }
      };

      // USB QRリーダーからのキーボード信号をキャプチャする
      window.addEventListener('keypress', onKeyPressed);

      // 打刻画面を終了する場合はワーカーに打刻画面終了を告知し、キーボード信号キャプチャを終了する
      onBeforeRouteLeave(() => {
        worker.postMessage('ending');
        window.removeEventListener('keypress', onKeyPressed);
      });

      // 現在設定されている端末名があれば取得する
      const db = await openDeviceDB();
      if (db) {
        const keys = await db.getAllKeys('timecard-device');
        if (keys.length > 0) {
          const data = await db.get('timecard-device', keys[0]);
          if (data) {
            thisDeviceName.value = data.name;
          }
        }
      }
    }

    await initStatus();
  }
  catch (error) {
    console.error(error);
    alert(error);
  }
});

async function onRecord(event: Event) {
  try {
    const dateNow = new Date();

    if (!store.isLoggedIn()) {
      // QR打刻端末からの打刻の場合はキューイングで打刻する
      const db = await openRecordDB();
      await db.put('timecard-record', {
        type: recordType.value,
        account: userAccount.value,
        timestamp: dateNow,
        refreshToken: refreshToken,
        isSent: false
      });
    }
    else {
      // PC端末からの打刻の場合は即時打刻する。
      const loader = $loading.show({ opacity: 0 });
      const access = await store.getTokenAccess();
      await access.record(recordType.value, dateNow);
      loader.hide();
    }

    status.value = 'recordCompleted';

    clearTimeout(timeout);
    timeout = setTimeout(initStatus, 3000);

  } catch (error) {
    console.error(error);
    recordTokenCatch(error as Error);
  }
}

async function onDecode(decodedQrcode: string) {
  const decodedStrs = decodedQrcode.split(',', 2)
  if (decodedStrs.length < 2) {
    errorName.value = 'TokenAuthFailedError';
    status.value = 'error';
  }
  else {
    try {
      status.value = 'waitForRecord';
      const userCacheDb = await openUserCacheDB();
      const userInfo = await userCacheDb.get('timecard-user-cache', decodedStrs[0]);
      userAccount.value = decodedStrs[0];
      refreshToken = decodedStrs[1];
      if (userInfo) {
        userName.value = userInfo.name;
        if (userInfo.workPattern?.onTimeStart && userInfo.workPattern?.onTimeEnd) {
          onTime.value =
            dateToTimeStr(userInfo.workPattern.onTimeStart) + ' 〜 ' + dateToTimeStr(userInfo.workPattern.onTimeEnd);
        }
        else {
          onTime.value = '勤務予定無し';
        }
      }
      else {
        status.value = 'error';
        errorName.value = 'UserNotFoundError';

        clearTimeout(timeout);
        timeout = setTimeout(initStatus, 3000);
        return;
      }
      userCacheDb.close();

      const recordDb = await openRecordDB();
      if (recordDb) {
        //const recordInfo = await recordDb.get('timecard-record', 0);
        const recordInfos = await recordDb.getAllFromIndex('timecard-record', 'by-account', userAccount.value);
        if (recordInfos) {
          for (const recordInfo of recordInfos) {
            switch (recordInfo.type) {
              case 'clockin':
                clockinTime.value = dateToTimeStr(recordInfo.timestamp);
                break;
              case 'break':
                breakTime.value = dateToTimeStr(recordInfo.timestamp);
                break;
              case 'reenter':
                reenterTime.value = dateToTimeStr(recordInfo.timestamp);
                break;
              case 'clockout':
                clockoutTime.value = dateToTimeStr(recordInfo.timestamp);
                break;
            }
          }
        }
        recordDb.close();

        // 打鍵状況に合わせてボタンを自動的に変更する
        if (clockinTime.value !== '') {
          recordType.value = 'break';
        }
        if (breakTime.value !== '') {
          recordType.value = 'reenter';
        }
        if (reenterTime.value !== '') {
          recordType.value = 'clockout';
        }
        if (clockoutTime.value !== '') {
          recordType.value = 'clockin';
        }
      }
    }
    catch (error) {
      console.error(error);
      alert(error);
    }
  }

  // 認証してから1分経過しても打刻していない場合は認証をクリアする
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    initStatus();
  }, 60000);
}

function onRecordCancel() {
  initStatus();
  clearTimeout(timeout);
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="打刻画面"
          v-bind:customButton1="store.isLoggedIn() ? undefined : '端末エラー履歴'"
          v-on:customButton1="store.isLoggedIn() ? undefined : router.push({ name: 'errorlog' })"
          v-bind:customButton2="store.isLoggedIn() ? 'メニュー画面' : 'ログイン画面'"
          v-on:customButton2="store.isLoggedIn() ? router.push({ name: 'dashboard' }) : router.push({ name: 'home' })"
          :customMessage="headerMessage" :deviceName="thisDeviceName"></Header>
      </div>
    </div>

    <div class="row justify-content-center gy-5 m-2">
      <div class="col-4 m-2">
        <div class="row overflow-auto p-2">
          <div class="col-4 h5">出勤記録</div>
          <p class="col p-2 h5 bg-white shadow-sm align-middle font-monospace">{{ clockinTime !== '' ? clockinTime :
              '--:--'
          }}</p>
        </div>
        <div class="row overflow-auto p-2">
          <div class="col-4 h5">外出記録</div>
          <p class="col p-2 h5 bg-white shadow-sm align-middle font-monospace">{{ breakTime !== '' ? breakTime : '--:--'
          }}</p>
        </div>
        <div class="row overflow-auto p-2">
          <div class="col-4 h5">再入記録</div>
          <p class="col p-2 h5 bg-white shadow-sm align-middle font-monospace">{{ reenterTime !== '' ? reenterTime :
              '--:--'
          }}</p>
        </div>
        <div class="row overflow-auto p-2">
          <div class="col-4 h5">退勤記録</div>
          <p class="col p-2 h5 bg-white shadow-sm align-middle font-monospace">{{ clockoutTime !== '' ? clockoutTime :
              '--:--'
          }}</p>
        </div>
        <div class="row overflow-auto p-2">
          <div class="col-4 h5">勤務予定</div>
          <p class="col p-2 h5 bg-white shadow-sm align-middle font-monospace">
            {{ onTime !== '' ? onTime : '--:-- 〜 --:--' }}
          </p>
        </div>
      </div>
      <div class="col-6">
        <div class="row">
          <div class="col-6">
            <span class="display-6">現在時刻</span>
          </div>
          <div class="col-6">
            <span class="display-1">{{ timeStr }}</span>
          </div>
        </div>
        <div class="row">
          <div v-if="!store.isLoggedIn() && thisDeviceName === ''" class="alert h5 alert-warning" role="alert">
            端末名が設定されていません。管理者が本端末でログインしてメニュー画面から端末名を設定してください。</div>
          <div v-else-if="status === 'waitForAuth'" class="alert h5 alert-primary" role="alert">
            QRコードが確認できました。ユーザー情報確認中です。</div>
          <div v-else-if="status === 'waitForRecord'" class="alert h5 alert-primary" role="alert">
            ユーザー情報が確認できました。打刻してください。</div>
          <div v-else-if="status === 'recordCompleted'" class="alert h5 alert-success" role="alert">打刻が完了しました。</div>
          <div v-else-if="status === 'waitForScan'" class="alert h5 alert-light" role="alert">QRコードをかざしてスキャンしてください。
          </div>
          <div v-else-if="status === 'error' && errorName === 'TokenAuthFailedError'" class="alert h5 alert-danger"
            role="alert">ユーザー認証に失敗しました。管理者にお問い合わせください。</div>
          <div v-else-if="status === 'error' && errorName === 'UserNotFoundError'" class="alert h5 alert-danger"
            role="alert">無効なQRコードです。管理者にお問い合わせください。</div>
        </div>

        <div class="row">
          <button type="button" class="btn btn-warning btn-lg" @click="onRecord"
            v-bind:disabled="status !== 'waitForRecord'">
            <span v-if="recordType === 'clockin'">出勤</span>
            <span v-else-if="recordType === 'clockout'">退勤</span>
            <span v-else-if="recordType === 'break'">外出</span>
            <span v-else-if="recordType === 'reenter'">再入</span>
            打刻
          </button>
        </div>
        <div class="row mt-2 mb-2">
          <div class="col-1 h3 text-end align-middle">ID</div>
          <div class="col-3 h6 bg-white shadow-sm align-middle">{{ userAccount }}</div>
          <div class="col-2 h3 text-end align-middle">氏名</div>
          <div class="col-6 h3 bg-white shadow-sm align-middle">{{ userName }}</div>
        </div>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="d-grid gap-2 col-2">
        <input type="radio" class="btn-check" name="record-type" id="clockin" @click="recordType = 'clockin'"
          autocomplete="off" v-bind:checked="recordType === 'clockin'" />
        <label class="btn btn-outline-warning btn-lg" for="clockin">出勤</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input type="radio" class="btn-check" name="record-type" id="clockout" @click="recordType = 'clockout'"
          autocomplete="off" v-bind:checked="recordType === 'clockout'" />
        <label class="btn btn-outline-warning btn-lg" for="clockout">退勤</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input type="radio" class="btn-check" name="record-type" id="break" @click="recordType = 'break'"
          autocomplete="off" v-bind:checked="recordType === 'break'" />
        <label class="btn btn-outline-warning btn-lg" for="break">外出</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input type="radio" class="btn-check" name="record-type" id="reenter" @click="recordType = 'reenter'"
          autocomplete="off" v-bind:checked="recordType === 'reenter'" />
        <label class="btn btn-outline-warning btn-lg" for="reenter">再入</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <button v-if="!store.isLoggedIn()" class="btn btn-warning btn-lg" id="cancel" @click="onRecordCancel"
          v-bind:disabled="status !== 'waitForRecord'">取消</button>
      </div>
    </div>
  </div>
</template>

<style>
body {
  background: navajowhite !important;
}

/* Adding !important forces the browser to overwrite the default style applied by Bootstrap */

.btn-primary {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}

.btn-outline-primary {
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}

.btn-outline-primary:active {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}

.btn-outline-warning {
  color: black !important;
}

.placeholder.video::after {
  content: "\f16a";
}
</style>

<style scoped>
.vue-modal {
  position: fixed;
  z-index: 999;
  margin: 0 auto;
  top: 10%;
  bottom: 10%;
  left: 20%;
  right: 20%;
}
</style>