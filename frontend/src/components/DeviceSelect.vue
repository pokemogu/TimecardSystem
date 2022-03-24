<script setup lang="ts">
import { ref } from 'vue';
import * as backendAccess from '@/BackendAccess';

const deviceNameList = ref<string[]>([]);
const selectedDeviceName = ref('');

const props = defineProps<{
  isOpened: boolean,
  deviceName: string
}>();

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:deviceName', value: string): void
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

function onSubmit(event: Event) {
  if (props.deviceName !== '') {
    emits('update:deviceName', props.deviceName);
    emits('update:isOpened', false);
  }
}

backendAccess.getDevices().then((devices) => {
  if (devices) {
    deviceNameList.value = devices.map(device => device.name);
    selectedDeviceName.value = props.deviceName;
  }
});

</script>

<template>
  <div class="modal-dialog vue-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">端末名設定</h5>
        <button type="button" class="btn-close" v-on:click="onClose"></button>
      </div>
      <div class="modal-body">
        <p>この端末で使用する端末名を選択してください</p>
        <select v-model="deviceName" class="form-select">
          <option value>端末名を選択してください</option>
          <option
            v-for="deviceListName in deviceNameList"
            :value="deviceListName"
          >{{ deviceListName }}</option>
        </select>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
        <button
          type="button"
          class="btn btn-primary"
          v-bind:disabled="deviceName === ''"
          v-on:click="onSubmit"
        >保存</button>
      </div>
    </div>
  </div>
</template>

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