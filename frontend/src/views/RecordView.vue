<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';

import { useSessionStore } from '@/stores/session';
import * as backendAccess from '@/BackendAccess';

import Header from '@/components/Header.vue';
import DeviceSelect from '@/components/DeviceSelect.vue';
import { BeepSound } from '@/BeepSound';

import { openRecordDB, openDeviceDB } from '@/RecordDBSchema';
import RecordWorker from '@/RecordWorker?worker';

const router = useRouter();
const store = useSessionStore();

const isLoggedIn = store.isLoggedIn();
let refreshToken = '';
const timeStr = ref('00:00:00');
const recordType = ref('clockin');
const errorName = ref('');
const cameraMode = ref('auto');
const headerMessage = ref('');

const userId = ref(store.isLoggedIn() ? store.userAccount : '');
const userName = ref(store.isLoggedIn() ? store.userName : '');

const status = ref(store.isLoggedIn() ? 'waitForRecord' : 'waitForScan');

let timeout = setTimeout(() => { }, 0);

const resetCamera = () => {
  cameraMode.value = 'off';
  nextTick(() => { cameraMode.value = 'auto'; });
};

const initStatus = () => {
  refreshToken = '';
  userId.value = store.isLoggedIn() ? store.userAccount : '';
  userName.value = store.isLoggedIn() ? store.userName : '';
  errorName.value = '';
  status.value = store.isLoggedIn() ? 'waitForRecord' : 'waitForScan';
};

const recordTokenCatch = (error: Error) => {
  resetCamera();
  if (error.name === '401') {
    console.log(error);
    errorName.value = 'TokenAuthFailedError';
  }
  else {
    errorName.value = error.toString();
  }
  status.value = 'error';

  clearTimeout(timeout);
  timeout = setTimeout(initStatus, 5000);
};

async function onRecord(event: Event) {
  try {
    const dateNow = new Date();

    if (!store.isLoggedIn()) {
      // QR打刻端末からの打刻の場合はキューイングで打刻する
      const db = await openRecordDB();
      await db.put('timecard-record', { type: recordType.value, timestamp: dateNow, refreshToken: refreshToken });
    }
    else {
      // PC端末からの打刻の場合は即時打刻する。
      const token = await store.getToken();
      const access = new backendAccess.TokenAccess(token);
      await access.record(recordType.value, dateNow);
    }

    resetCamera();
    status.value = 'recordCompleted';

    clearTimeout(timeout);
    timeout = setTimeout(initStatus, 3000);

  } catch (error) {
    recordTokenCatch(error as Error);
  }
}

function onDecode(decodedQrcode: string) {
  BeepSound.play();
  status.value = 'waitForRecord';
  backendAccess.getToken(decodedQrcode)
    .then((token) => {
      if (token.token) {
        refreshToken = decodedQrcode;
        const access = new backendAccess.TokenAccess(token.token.accessToken);
        access.getUserInfo(token.token.account).then((userInfo) => {
          if (userInfo && token.token) {
            userId.value = token.token.account;
            userName.value = userInfo.name || '';
          }
        });

        //status.value = 'waitForRecord';

        // 認証してから1分経過しても打刻していない場合は認証をクリアする
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          resetCamera();
          initStatus();
        }, 60000);
      }
    })
    .catch(recordTokenCatch);
}

function onScanCancel() {
  resetCamera();
  initStatus();
  clearTimeout(timeout);
}

async function onInit(promise: Promise<any>) {
  try {
    await promise;
    errorName.value = '';
  } catch (error: any) {
    errorName.value = error.name;
  }
}

setInterval(() => {
  const now = new Date();
  const hourStr = now.getHours().toString().padStart(2, '0');
  const minStr = now.getMinutes().toString().padStart(2, '0');
  const secStr = now.getSeconds().toString().padStart(2, '0');
  timeStr.value = `${hourStr}:${minStr}:${secStr}`;
}, 1000);

// QR打刻端末の場合はバックグラウンドでの打刻送信ワーカーを起動する
if (!store.isLoggedIn()) {
  const worker = new RecordWorker();

  onBeforeRouteLeave((to, from) => {
    // ワーカーに打刻画面終了を告知する
    worker.postMessage('ending');
  });

  worker.onmessage = (ev) => {
    const message = <{ type: string, message: string }>ev.data;
    console.log(message);
    if (message.type === 'error') {
      headerMessage.value = message.message;
      setTimeout(() => {
        headerMessage.value = '';
      }, 5000);
    }
  };
}

// 打刻端末名に関する設定
const thisDeviceName = ref('');
const isDeviceSelectOpened = ref(false);

// 現在設定されている端末名があれば取得する
openDeviceDB().then((db) => {
  db.getAllKeys('timecard-device').then((keys) => {
    if (keys.length > 0) {
      thisDeviceName.value = keys[0];
    }
  });
});

// 端末名の設定変更がされていたら、それを反映する
watch(thisDeviceName, async () => {
  const db = await openDeviceDB();
  await db.put('timecard-device', { timestamp: new Date() }, thisDeviceName.value);
});

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="打刻画面"
          customButton1="端末名設定"
          v-on:customButton1="isDeviceSelectOpened = true"
          v-bind:customButton2="isLoggedIn ? 'メニュー画面' : 'ログイン画面'"
          v-on:customButton2="isLoggedIn ? router.push({ name: 'dashboard' }) : router.push({ name: 'home' })"
          :customMessage="headerMessage"
          :deviceName="thisDeviceName"
        ></Header>
      </div>
    </div>

    <Teleport to="body" v-if="isDeviceSelectOpened">
      <DeviceSelect v-model:deviceName="thisDeviceName" v-model:isOpened="isDeviceSelectOpened"></DeviceSelect>
    </Teleport>

    <div class="row justify-content-center gy-5">
      <div v-if="!store.isLoggedIn()" class="col-4 p-2">
        <qrcode-stream v-bind:camera="cameraMode" @decode="onDecode" @init="onInit" />
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
          <div
            v-if="thisDeviceName === ''"
            class="alert h5 alert-warning"
            role="alert"
          >端末名を右上メニューボタンから設定してください。</div>
          <div
            v-else-if="status === 'waitForAuth'"
            class="alert h5 alert-primary"
            role="alert"
          >QRコードが確認できました。ユーザー情報確認中です。</div>
          <div
            v-else-if="status === 'waitForRecord'"
            class="alert h5 alert-primary"
            role="alert"
          >ユーザー情報が確認できました。打刻してください。</div>
          <div
            v-else-if="status === 'recordCompleted'"
            class="alert h5 alert-success"
            role="alert"
          >打刻が完了しました。</div>
          <div
            v-else-if="status === 'waitForScan'"
            class="alert h5 alert-light"
            role="alert"
          >QRコードをカメラにかざしてスキャンしてください。</div>
          <div
            v-else-if="status === 'error' && errorName === 'TokenAuthFailedError'"
            class="alert h5 alert-danger"
            role="alert"
          >ユーザー認証に失敗しました。管理者にお問い合わせください。</div>
          <div
            v-else-if="status === 'error' && errorName === 'NotAllowedError'"
            class="alert h5 alert-danger"
            role="alert"
          >エラー: カメラへのアクセスが許可されていません。</div>
          <div
            v-else-if="status === 'error' && errorName === 'NotFoundError'"
            class="alert h5 alert-danger"
            role="alert"
          >エラー: この機器にはカメラがありません。</div>
          <div
            v-else-if="status === 'error' && (errorName === 'NotSupportedError' || errorName === 'InsecureContextError')"
            class="alert h5 alert-danger"
            role="alert"
          >エラー: リモートHTTPS通信で無い為、カメラへのアクセスができません。</div>
          <div
            v-else-if="status === 'error' && errorName === 'NotReadableError'"
            class="alert h5 alert-danger"
            role="alert"
          >エラー: カメラからの読み込みができません。</div>
          <div
            v-else-if="status === 'error' && errorName === 'OverconstrainedError'"
            class="alert h5 alert-danger"
            role="alert"
          >エラー: カメラのスペックが本用途に適しておらず使用できません。</div>
          <div
            v-else-if="status === 'error' && errorName === 'StreamApiNotSupportedError'"
            class="alert h5 alert-danger"
            role="alert"
          >エラー: このブラウザではカメラストリーミングがサポートされていません。</div>
          <div
            v-else-if="status === 'error'"
            class="alert h5 alert-danger"
            role="alert"
          >不明なエラーが発生しました: {{ errorName }}</div>
        </div>

        <div class="row">
          <button
            type="button"
            class="btn btn-warning btn-lg"
            @click="onRecord"
            v-bind:disabled="status !== 'waitForRecord'"
          >
            <span v-if="recordType === 'clockin'">出勤</span>
            <span v-else-if="recordType === 'clockout'">退出</span>
            <span v-else-if="recordType === 'break'">外出</span>
            <span v-else-if="recordType === 'reenter'">再入</span>
            打刻
          </button>
        </div>
        <div class="row mt-2 mb-2">
          <div class="col-1 h3 text-end align-middle">ID</div>
          <div class="col-3 h6 bg-white shadow-sm align-middle">{{ userId }}</div>
          <div class="col-2 h3 text-end align-middle">氏名</div>
          <div class="col-6 h3 bg-white shadow-sm align-middle">{{ userName }}</div>
        </div>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="d-grid gap-2 col-2">
        <input
          type="radio"
          class="btn-check"
          name="record-type"
          id="clockin"
          @click="recordType = 'clockin'"
          autocomplete="off"
          v-bind:checked="recordType === 'clockin'"
        />
        <label class="btn btn-outline-warning btn-lg" for="clockin">出勤</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input
          type="radio"
          class="btn-check"
          name="record-type"
          id="clockout"
          @click="recordType = 'clockout'"
          autocomplete="off"
          v-bind:checked="recordType === 'clockout'"
        />
        <label class="btn btn-outline-warning btn-lg" for="clockout">退出</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input
          type="radio"
          class="btn-check"
          name="record-type"
          id="break"
          @click="recordType = 'break'"
          autocomplete="off"
          v-bind:checked="recordType === 'break'"
        />
        <label class="btn btn-outline-warning btn-lg" for="break">外出</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input
          type="radio"
          class="btn-check"
          name="record-type"
          id="reenter"
          @click="recordType = 'reenter'"
          autocomplete="off"
          v-bind:checked="recordType === 'reenter'"
        />
        <label class="btn btn-outline-warning btn-lg" for="reenter">再入</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <button
          v-if="!store.isLoggedIn()"
          class="btn btn-warning btn-lg"
          id="cancel"
          @click="onScanCancel"
          v-bind:disabled="status !== 'waitForRecord'"
        >取消</button>
      </div>
    </div>
  </div>
</template>

<style>
body {
  background: navajowhite !important;
} /* Adding !important forces the browser to overwrite the default style applied by Bootstrap */

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