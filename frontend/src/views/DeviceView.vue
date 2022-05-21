<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
//import * as backendAccess from '@/BackendAccess';

import DeviceEdit from '@/components/DeviceEdit.vue';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const store = useSessionStore();

const isModalOpened = ref(false);
const selectedDeviceAccount = ref('');
const selectedDeviceName = ref('');
const deviceInfos = ref<apiif.DeviceResponseData[]>([]);
const checks = ref<Record<string, boolean>>({});
const isNewDevice = ref(false);

const limit = ref(10);
const offset = ref(0);

async function updateTable() {

  try {
    //const token = await store.getToken();
    //if (token) {
    //const access = new backendAccess.TokenAccess(token);
    const access = await store.getTokenAccess();
    const infos = await access.getDevices({ limit: limit.value + 1, offset: offset.value });
    if (infos) {
      deviceInfos.value.splice(0);
      Array.prototype.push.apply(deviceInfos.value, infos);
    }
    //}
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
}

onMounted(async () => {
  await updateTable();
});

async function onPageBack() {
  const backTo = offset.value - limit.value;
  offset.value = backTo > 0 ? backTo : 0;
  await updateTable();
}

async function onPageForward() {
  const forwardTo = offset.value + limit.value;
  offset.value = forwardTo > 0 ? forwardTo : 0;
  await updateTable();
}

async function onDeviceClick(deviceAccount?: string) {
  if (deviceAccount) {
    const device = deviceInfos.value.find(device => device.account === deviceAccount);
    if (device) {
      selectedDeviceAccount.value = device.account;
      selectedDeviceName.value = device.name;
      isNewDevice.value = false;
    }
  }
  else {
    selectedDeviceAccount.value = '';
    selectedDeviceName.value = '';
    isNewDevice.value = true;
  }
  isModalOpened.value = true;
}

async function onDeviceDelete() {
  if (!confirm('チェックされた打刻端末を削除しますか?')) {
    return;
  }
  try {
    //const token = await store.getToken();
    //if (token) {
    //const access = new backendAccess.TokenAccess(token);
    const access = await store.getTokenAccess();
    for (const device of deviceInfos.value) {
      if (checks.value[device.account]) {
        await access.deleteDevice(device.account);
      }
    }
    //}
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }

  // チェックをすべてクリアする
  for (const key in checks.value) {
    checks.value[key] = false;
  }

  await updateTable();
}

async function onDeviceSubmit() {
  if (isNewDevice.value === true) {
    if (deviceInfos.value.some(device => device.account === selectedDeviceAccount.value)) {
      alert('既に使用されている機器IDです。');
    }
  }
  try {
    //const token = await store.getToken();
    //if (token) {
    //const access = new backendAccess.TokenAccess(token);
    const access = await store.getTokenAccess();
    if (isNewDevice.value === true) {
      await access.addDevice({ account: selectedDeviceAccount.value, name: selectedDeviceName.value });
    }
    else {
      await access.updateDevice({ account: selectedDeviceAccount.value, name: selectedDeviceName.value });
    }
    //}
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
  await updateTable();
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="打刻端末設定" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <Teleport to="body" v-if="isModalOpened">
      <DeviceEdit v-model:isOpened="isModalOpened" v-model:account="selectedDeviceAccount"
        v-model:name="selectedDeviceName" v-on:submit="onDeviceSubmit"></DeviceEdit>
    </Teleport>

    <div class="row justify-content-start p-2">
      <div class="d-grid gap-2 col-3">
        <button type="button" class="btn btn-primary" id="new-route" v-on:click="onDeviceClick()">打刻端末追加</button>
      </div>
      <div class="d-grid gap-2 col-4">
        <button type="button" class="btn btn-primary" id="export"
          v-bind:disabled="Object.values(checks).every(check => check === false)"
          v-on:click="onDeviceDelete">チェックした打刻端末を削除</button>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">端末ID</th>
              <th scope="col">端末名</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(device, index) in deviceInfos.slice(0, limit)">
              <th scope="row">
                <input class="form-check-input" type="checkbox" :id="'checkbox' + index"
                  v-model="checks[device.account]" />
              </th>
              <td>
                <button type="button" class="btn btn-link" v-on:click="onDeviceClick(device.account)">{{ device.account
                }}</button>
              </td>
              <td>{{ device.name }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="7">
                <nav>
                  <ul class="pagination">
                    <li class="page-item" v-bind:class="{ disabled: offset <= 0 }">
                      <button class="page-link" v-on:click="onPageBack">
                        <span>&laquo;</span>
                      </button>
                    </li>
                    <li class="page-item" v-bind:class="{ disabled: deviceInfos.length <= limit }">
                      <button class="page-link" v-on:click="onPageForward">
                        <span>&raquo;</span>
                      </button>
                    </li>
                  </ul>
                </nav>
              </td>
            </tr>
          </tfoot>
        </table>
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

.nav-tabs .nav-item .nav-link {
  background-color: navajowhite !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}

.nav-tabs .nav-item .nav-link.active {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
</style>