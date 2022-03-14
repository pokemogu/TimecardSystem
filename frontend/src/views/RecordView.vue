<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import Cookies from 'js-cookie';

import { useSessionStore } from '@/stores/session';
import * as backendAccess from '@/BackendAccess';

import Header from '@/components/Header.vue';
import { BeepSound } from '@/BeepSound';

const router = useRouter();
const store = useSessionStore();

const decodedQrString = ref('');
const refreshToken = ref('');
const timeStr = ref('');
const modeStr = ref('出勤');
const recordType = ref('clockin');
const openDeviceModal = ref(false);
const deviceNameList = ref<string[]>([]);
const thisDeviceName = ref(Cookies.get('deviceName') ?? '');
const selectedDeviceName = ref(thisDeviceName.value);
const errorName = ref('');
const recordCompleted = ref(false);
const cameraMode = ref('auto');

let timeout = setTimeout(() => { }, 0);

function onRecord(event: Event) {
  backendAccess.getToken(refreshToken.value).then((token) => {
    if (token) {
      const access = new backendAccess.TokenAccess(token.accessToken);
      access.record(recordType.value, new Date())
        .then(() => {
          recordCompleted.value = true;
          refreshToken.value = '';
          decodedQrString.value = '';

          // カメラをリセットする
          cameraMode.value = 'off';
          nextTick(() => { cameraMode.value = 'auto'; });

          clearTimeout(timeout);
          timeout = setTimeout(() => {
            userId.value = '';
            userName.value = '';
            recordCompleted.value = false;
          }, 3000)
        })
        .catch((error) => {
          // カメラをリセットする
          cameraMode.value = 'off';
          nextTick(() => { cameraMode.value = 'auto'; });

          decodedQrString.value = '';
          refreshToken.value = '';
          userId.value = '';
          userName.value = '';
          recordCompleted.value = false;

          errorName.value = error.toString();

          clearTimeout(timeout);
          timeout = setTimeout(() => { // 5秒後にエラー表示はクリアする
            errorName.value = '';
          }, 5000);
        });
    }
  });
}

const userId = ref('');
const userName = ref('');

function onDecode(result: string) {
  //refreshToken.value = result;
  BeepSound.play();
  console.log(`QR code: ${result}`);
  decodedQrString.value = result;
  backendAccess.getToken(decodedQrString.value)
    .then((token) => {
      if (token) {
        refreshToken.value = result;
        const access = new backendAccess.TokenAccess(token.accessToken);
        access.getUserInfo(token.userId).then((userInfo) => {
          if (userInfo) {
            userId.value = token.userId;
            userName.value = userInfo.name;
          }
        });

        clearTimeout(timeout);
        timeout = setTimeout(() => { // 認証してから1分経過しても打刻していない場合は認証をクリアする
          // カメラをリセットする
          cameraMode.value = 'off';
          nextTick(() => { cameraMode.value = 'auto'; });

          decodedQrString.value = '';
          refreshToken.value = '';
          userId.value = '';
          userName.value = '';
        }, 60000);
      }
    })
    .catch((error) => {
      decodedQrString.value = '';
      refreshToken.value = '';
      userId.value = '';
      userName.value = '';

      if (error.name === '401') {
        console.log(error);
        errorName.value = 'TokenAuthFailedError';
      }
      else {
        errorName.value = error.toString();
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => { // 5秒後にエラー表示はクリアする

        // カメラをリセットする
        cameraMode.value = 'off';
        nextTick(() => { cameraMode.value = 'auto'; });

        errorName.value = '';
      }, 5000);
    });
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

function onSetDeviceNameButton() {
  backendAccess.getDevices().then((devices) => {
    if (devices) {
      deviceNameList.value = devices.map(device => device.name);
      selectedDeviceName.value = thisDeviceName.value;
      openDeviceModal.value = true;
    }
  });
}

function onSaveDeviceNameButton() {
  if (selectedDeviceName.value) {
    thisDeviceName.value = selectedDeviceName.value;
    Cookies.set('deviceName', selectedDeviceName.value);
  }
  openDeviceModal.value = false;
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="打刻画面"
          customButton1="端末名設定"
          v-on:customButton1="onSetDeviceNameButton"
          customButton2="ログイン画面"
          v-on:customButton2="router.push('/')"
          :deviceName="thisDeviceName"
        ></Header>
      </div>
    </div>

    <Teleport to="body">
      <div v-show="openDeviceModal" class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">端末名設定</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              v-on:click="openDeviceModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <p>この端末で使用する端末名を選択してください</p>
            <select
              v-model="selectedDeviceName"
              class="form-select"
              aria-label="Default select example"
            >
              <option value>端末名を選択してください</option>
              <option v-for="deviceName in deviceNameList" :value="deviceName">{{ deviceName }}</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" v-on:click="openDeviceModal = false">取消</button>
            <button
              type="button"
              class="btn btn-primary"
              v-bind:disabled="selectedDeviceName === ''"
              v-on:click="onSaveDeviceNameButton"
            >保存</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="row justify-content-center gy-5">
      <div v-if="store.isLoggedIn()" class="col-4 h-100">
        <qrcode-stream v-bind:camera="cameraMode" @decode="onDecode" @init="onInit" />
      </div>
      <div class="col-6">
        <span class="display-6">現在時刻&nbsp;</span>
        <span class="display-1">{{ timeStr }}</span>
        <div
          v-if="thisDeviceName === ''"
          class="alert h5 alert-warning"
          role="alert"
        >端末名を右上メニューボタンから設定してください。</div>
        <div
          v-else-if="decodedQrString !== '' && refreshToken === ''"
          class="alert h5 alert-primary"
          role="alert"
        >QRコードが確認できました。ユーザー情報確認中です。</div>
        <div
          v-else-if="refreshToken !== '' && recordCompleted === false"
          class="alert h5 alert-primary"
          role="alert"
        >ユーザー情報が確認できました。打刻してください。</div>
        <div v-else-if="recordCompleted" class="alert h5 alert-success" role="alert">打刻が完了しました。</div>
        <div
          v-else-if="errorName === ''"
          class="alert h5 alert-light"
          role="alert"
        >QRコードをカメラにかざしてスキャンしてください。</div>
        <div
          v-else-if="errorName === 'TokenAuthFailedError'"
          class="alert h5 alert-danger"
          role="alert"
        >ユーザー認証に失敗しました。管理者にお問い合わせください。</div>
        <div
          v-else-if="errorName === 'NotAllowedError'"
          class="alert h5 alert-danger"
          role="alert"
        >エラー: カメラへのアクセスが許可されていません。</div>
        <div
          v-else-if="errorName === 'NotFoundError'"
          class="alert h5 alert-danger"
          role="alert"
        >エラー: この機器にはカメラがありません。</div>
        <div
          v-else-if="errorName === 'NotSupportedError' || errorName === 'InsecureContextError'"
          class="alert h5 alert-danger"
          role="alert"
        >エラー: リモートHTTPS通信で無い為、カメラへのアクセスができません。</div>
        <div
          v-else-if="errorName === 'NotReadableError'"
          class="alert h5 alert-danger"
          role="alert"
        >エラー: カメラからの読み込みができません。</div>
        <div
          v-else-if="errorName === 'OverconstrainedError'"
          class="alert h5 alert-danger"
          role="alert"
        >エラー: カメラのスペックが本用途に適しておらず使用できません。</div>
        <div
          v-else-if="errorName === 'StreamApiNotSupportedError'"
          class="alert h5 alert-danger"
          role="alert"
        >エラー: このブラウザではカメラストリーミングがサポートされていません。</div>
        <div v-else class="alert h5 alert-danger" role="alert">不明なエラーが発生しました: {{ errorName }}</div>

        <!--<span v-if="thisDeviceName === ''">端末名を設定してください。</span>
          <span v-else-if="decodedQrString !== ''">QRコードが確認できました。打刻してください。</span>
          <span v-else-if="errorName === ''">QRコードをカメラにかざしてスキャンしてください。</span>
        <span v-else>{{ errorName }}</span>-->
        <div class="d-grid gap-2">
          <button
            type="button"
            class="btn btn-warning btn-lg"
            @click="onRecord"
            v-bind:disabled="refreshToken === '' || thisDeviceName === ''"
          >
            <span v-if="recordType === 'clockin'">出勤</span>
            <span v-else-if="recordType === 'clockout'">退出</span>
            <span v-else-if="recordType === 'break'">外出</span>
            <span v-else-if="recordType === 'reenter'">再入</span>
            打刻
          </button>
        </div>
      </div>
    </div>

    <div class="row justify-content-center gy-5">
      <div class="col-2">
        ID:
        <span v-if="userId">{{ userId }}</span>
      </div>
      <div class="col-2">
        氏名:
        <span v-if="userName">{{ userName }}</span>
      </div>
      <div class="col-6"></div>
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
    </div>

    <!--
    <div class="row">
      <div class="shadow-none p-3 rounded">
        <h3 class="text-center">IDとPASSを入力してください</h3>
      </div>
    </div>
    <div class="row mb-3 justify-content-center">
      <div class="col-1">
        <label for="exampleInputEmail1" class="form-label">ID</label>
      </div>
      <div class="col-5">
        <input
          type="email"
          class="form-control"
          id="exampleInputEmail1"
          aria-describedby="emailHelp"
        />
      </div>
    </div>
    <div class="row mb-3 justify-content-center">
      <div class="col-1">
        <label for="exampleInputPassword1" class="form-label">PASS</label>
      </div>
      <div class="col-5">
        <input type="password" class="form-control" id="exampleInputPassword1" />
      </div>
    </div>
    <div class="row mb-3 justify-content-center">
      <div class="col-2">
        <button type="button" class="btn btn-primary btn-lg" @click="handleLogin">打刻画面</button>
      </div>
      <div class="col-2">
        <button type="button" class="btn btn-primary btn-lg" @click="handleLogin">管理画面</button>
      </div>
    </div>
    -->
  </div>
  <!--
<main>
    <TheWelcome />
  </main>
  -->
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