<script setup lang="ts">
import { ref, inject } from 'vue';
import type { TimecardSession } from '../timecard-session-interface';
import { useRouter } from 'vue-router';
import Cookies from 'js-cookie';
import * as backendAccess from '@/BackendAccess';

import Header from '@/components/Header.vue';

const decodedQrString = ref('');
const timeStr = ref('');
const modeStr = ref('出勤');
const openDeviceModal = ref(false);
const deviceNameList = ref<string[]>([]);
const thisDeviceName = ref(Cookies.get('deviceName') ?? '');
const selectedDeviceName = ref(thisDeviceName.value);
const errorName = ref('');

const router = useRouter();
const session = inject<TimecardSession>('session');

function handleLogin(event: Event) {
  if (session) {
    console.log(session.refreshToken);
    session.refreshToken = "HUGASHUGAHUGA";
  }
}

function onDecode(result: string) {
  decodedQrString.value = result;
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
          v-bind:isAuthorized="false"
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
      <div class="col-4">
        <qrcode-stream @decode="onDecode" @init="onInit" />
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
          v-else-if="decodedQrString !== ''"
          class="alert h5 alert-primary"
          role="alert"
        >QRコードが確認できました。打刻してください。</div>
        <div
          v-else-if="errorName === ''"
          class="alert h5 alert-light"
          role="alert"
        >QRコードをカメラにかざしてスキャンしてください。</div>
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
            @click="handleLogin"
            v-bind:disabled="decodedQrString === '' || thisDeviceName === ''"
          >{{ modeStr }}打刻</button>
        </div>
      </div>
    </div>

    <div class="row justify-content-center gy-5">
      <div class="col-4">QRコード: {{ decodedQrString }}</div>
      <div class="col-6"></div>
    </div>

    <div class="row justify-content-center">
      <div class="d-grid gap-2 col-2">
        <input
          type="radio"
          class="btn-check"
          name="record-type"
          id="clockin"
          @click="modeStr = '出勤'"
          autocomplete="off"
          checked
        />
        <label class="btn btn-outline-warning btn-lg" for="clockin">出勤</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input
          type="radio"
          class="btn-check"
          name="record-type"
          id="clockout"
          @click="modeStr = '退出'"
          autocomplete="off"
        />
        <label class="btn btn-outline-warning btn-lg" for="clockout">退出</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input
          type="radio"
          class="btn-check"
          name="record-type"
          id="goout"
          @click="modeStr = '外出'"
          autocomplete="off"
        />
        <label class="btn btn-outline-warning btn-lg" for="goout">外出</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input
          type="radio"
          class="btn-check"
          name="record-type"
          id="goin"
          @click="modeStr = '再入'"
          autocomplete="off"
        />
        <label class="btn btn-outline-warning btn-lg" for="goin">再入</label>
      </div>
      <div class="d-grid gap-2 col-2">
        <input
          type="radio"
          class="btn-check"
          name="record-type"
          id="nobreak"
          @click="modeStr = '休憩なし'"
          autocomplete="off"
        />
        <label class="btn btn-outline-warning btn-lg" for="nobreak">休憩なし</label>
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
</style>