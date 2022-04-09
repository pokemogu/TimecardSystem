<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as backendAccess from '@/BackendAccess';
import { useSessionStore } from '@/stores/session';
import type * as apiif from 'shared/APIInterfaces';
import { openDeviceDB } from '@/RecordDBSchema';

const store = useSessionStore();

const deviceInfos = ref<apiif.DeviceResponseData[]>([]);
const selectedDeviceAccount = ref('');

const props = defineProps<{
  isOpened: boolean
}>();

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

async function onSubmit(event: Event) {
  const selectedDevice = deviceInfos.value.find(device => device.account === selectedDeviceAccount.value);
  if (!selectedDevice) {
    return;
  }

  try {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      const tokenInfo = await access.issueRefreshTokenForOtherUser(selectedDevice.account);
      if (tokenInfo?.token) {
        const db = await openDeviceDB();
        if (db) {
          await db.clear('timecard-device');
          await db.put('timecard-device', {
            name: selectedDevice.name,
            timestamp: new Date(),
            refreshToken: tokenInfo.token.refreshToken
          }, selectedDeviceAccount.value);
        }
      }
    }
  }
  catch (error) {
    alert(error);
  }

  emits('update:isOpened', false);
}

onMounted(async () => {
  try {
    const db = await openDeviceDB();
    if (db) {
      const keys = await db.getAllKeys('timecard-device');
      if (keys.length > 0) {
        selectedDeviceAccount.value = keys[0];
      }
    }

    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      const infos = await access.getDevices();
      if (infos) {
        deviceInfos.value.splice(0);
        Array.prototype.push.apply(deviceInfos.value, infos);
      }
    }
  }
  catch (error) {
    alert(error);
  }
});

</script>

<template>
  <div class="overlay">
    <div class="modal-dialog vue-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">端末名設定</h5>
          <button type="button" class="btn-close" v-on:click="onClose"></button>
        </div>
        <div class="modal-body">
          <p>この端末で使用する端末名を選択してください</p>
          <select v-model="selectedDeviceAccount" class="form-select">
            <option value disabled>端末名を選択してください</option>
            <option v-for="(device) in deviceInfos" :value="device.account">{{ device.name }}</option>
          </select>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
          <button
            type="button"
            class="btn btn-primary"
            v-bind:disabled="selectedDeviceAccount === ''"
            v-on:click="onSubmit"
          >保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  z-index: 998;
  top: 0;
  height: 100%;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}
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