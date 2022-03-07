<script setup lang="ts">
import TheWelcome from '@/components/TheWelcome.vue'
import { ref, defineComponent, inject } from 'vue';
import type { TimecardSession } from '../timecard-session-interface';
import { RouterLink } from 'vue-router';

let decodedQrString = ref('');
let timeStr = ref('');
let message = ref('QRコードをカメラにかざしてスキャンしてください');
let alertClass = ref('alert-light');
let modeStr = ref('出勤');

let errorQrSetup = '';

const session = inject<TimecardSession>('session');

function handleLogin(event: Event) {
  alertClass.value = 'alert-primary';
  if (session) {
    console.log(session.refreshToken);
    session.refreshToken = "HUGASHUGAHUGA";
  }
}

function onDecode(result: string) {
  console.log(result);
  decodedQrString.value = result;
}

async function onInit(promise: Promise<any>) {
  console.log("onInit1");
  try {
    await promise;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      message.value = 'カメラへのアクセスが許可されていません';
    } else if (error.name === 'NotFoundError') {
      message.value = "この機器にはカメラがありません"
    } else if (error.name === 'NotSupportedError') {
      message.value = "ERROR: secure context required (HTTPS, localhost)"
    } else if (error.name === 'NotReadableError') {
      message.value = "カメラの読み込みができません"
    } else if (error.name === 'OverconstrainedError') {
      message.value = "ERROR: installed cameras are not suitable"
    } else if (error.name === 'StreamApiNotSupportedError') {
      message.value = "このブラウザではカメラストリーミングがサポートされていません"
    } else if (error.name === 'InsecureContextError') {
      message.value = 'ERROR: Camera access is only permitted in secure context. Use HTTPS or localhost rather than HTTP.';
    } else {
      message.value = `ERROR: Camera error(${error.name})`;
    }
  }
  console.log("onInit2");
}

const interval = setInterval(() => {
  const now = new Date();
  const hourStr = now.getHours().toString().padStart(2, '0');
  const minStr = now.getMinutes().toString().padStart(2, '0');
  const secStr = now.getSeconds().toString().padStart(2, '0');
  timeStr.value = `${hourStr}:${minStr}:${secStr}`;
}, 1000);

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
          <div class="container-fluid">
            <span class="navbar-text">打刻端末モード</span>
            <div class="collapse navbar-collapse justify-content-end">
              <span class="navbar-text">管理者PC</span>
            </div>
            <RouterLink to="/" class="ms-2 btn btn-warning btn-sm" role="button">管理画面</RouterLink>
          </div>
        </nav>
      </div>
    </div>

    <div class="row justify-content-center gy-5">
      <div class="col-4">
        <qrcode-stream @decode="onDecode" @init="onInit" />
      </div>
      <div class="col-6">
        <span class="display-6">現在時刻&nbsp;</span>
        <span class="display-1">{{ timeStr }}</span>
        <div class="alert h5" v-bind:class="alertClass" role="alert">{{ message }}</div>
        <div class="d-grid gap-2">
          <button
            type="button"
            class="btn btn-warning btn-lg"
            @click="handleLogin"
            v-bind:disabled="decodedQrString === ''"
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