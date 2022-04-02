<script setup lang="ts">

import { ref, watch, onMounted } from 'vue';

import { useSessionStore } from '@/stores/session';

import type * as apiif from 'shared/APIInterfaces';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  privilege: apiif.PrivilegeResponseData
}>();

const isOpened = ref(false);
const privilege = ref(props.privilege);
const viewRecord = ref('');
if (props.privilege.viewRecord && props.privilege.viewAllUserInfo) {
  viewRecord.value = 'all';
}
else if (props.privilege.viewRecord && props.privilege.viewSectionUserInfo) {
  viewRecord.value = 'section';
}
else if (props.privilege.viewRecord) {
  viewRecord.value = 'self';
}

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:privilege', value: apiif.PrivilegeResponseData): void,
  (event: 'submit'): void,
}>();

onMounted(async () => {
});

function onClose(event: Event) {
  emits('update:isOpened', false);
}

function onSubmit(event: Event) {
  if (privilege.value.maxApplyLateNum?.toString() === '') {
    privilege.value.maxApplyLateNum = null;
  }
  if (privilege.value.maxApplyLateHours?.toString() === '') {
    privilege.value.maxApplyLateHours = null;
  }
  if (privilege.value.maxApplyEarlyNum?.toString() === '') {
    privilege.value.maxApplyEarlyNum = null;
  }
  if (privilege.value.maxApplyEarlyHours?.toString() === '') {
    privilege.value.maxApplyEarlyHours = null;
  }

  if (viewRecord.value === '') {
    privilege.value.viewRecord = false;
    privilege.value.viewSectionUserInfo = false;
    privilege.value.viewAllUserInfo = false;
  }
  else if (viewRecord.value === 'self') {
    privilege.value.viewRecord = true;
    privilege.value.viewSectionUserInfo = false;
    privilege.value.viewAllUserInfo = false;
  }
  else if (viewRecord.value === 'section') {
    privilege.value.viewRecord = true;
    privilege.value.viewSectionUserInfo = true;
    privilege.value.viewAllUserInfo = false;
  }
  else if (viewRecord.value === 'all') {
    privilege.value.viewRecord = true;
    privilege.value.viewSectionUserInfo = true;
    privilege.value.viewAllUserInfo = true;
  }

  emits('update:isOpened', false);
  emits('update:privilege', privilege.value);
  emits('submit');
}

</script>

<template>
  <div class="overlay" id="privilege-root">
    <div class="modal-dialog modal-xl vue-modal">
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">権限設定</h5>
            <button type="button" class="btn-close" v-on:click="onClose"></button>
          </div>
          <div class="modal-body">
            <div class="row justify-content-start">
              <label for="privilage-name" class="col-1 col-form-label text-end">権限名</label>
              <div class="col-3">
                <input
                  type="text"
                  class="form-control"
                  id="privilage-name"
                  v-model="privilege.name"
                  required
                />
              </div>
            </div>
            <div class="row">
              <div class="d-flex align-content-start flex-wrap">
                <div class="form-check form-switch m-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="record-by-pc"
                    v-model="privilege.recordByLogin"
                  />
                  <label class="form-check-label" for="record-by-pc">打刻でPC使用可否</label>
                </div>

                <div
                  class="form-check form-switch m-2"
                  v-for="(item, index) in privilege.applyPrivileges"
                >
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    :id="'apply-' + item.applyTypeName"
                    v-model="item.permitted"
                  />
                  <label
                    class="form-check-label"
                    :for="'apply-' + item.applyTypeName"
                  >{{ item.applyTypeDescription }}申請可否</label>
                </div>

                <div class="form-check form-switch m-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="approve"
                    v-model="privilege.approve"
                  />
                  <label class="form-check-label" for="approve">申請承認可否</label>
                </div>

                <div class="form-check form-switch m-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="view-record-per-device"
                    v-model="privilege.viewRecordPerDevice"
                  />
                  <label class="form-check-label" for="view-record-per-device">簡易工程管理</label>
                </div>

                <div class="form-check form-switch m-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="configure-privilege"
                    v-model="privilege.configurePrivilege"
                  />
                  <label class="form-check-label" for="configure-privilege">権限設定</label>
                </div>

                <div class="form-check form-switch m-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="configure-workpattern"
                    v-model="privilege.configureWorkPattern"
                  />
                  <label class="form-check-label" for="configure-workpattern">勤務体系設定</label>
                </div>

                <div class="form-check form-switch m-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="register-user"
                    v-model="privilege.registerUser"
                  />
                  <label class="form-check-label" for="register-user">従業員登録</label>
                </div>

                <div class="form-check form-switch m-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="issue-qr"
                    v-model="privilege.issueQr"
                  />
                  <label class="form-check-label" for="issue-qr">QR発行</label>
                </div>

                <div class="form-check form-switch m-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="register-device"
                    v-model="privilege.registerDevice"
                  />
                  <label class="form-check-label" for="register-device">端末名設定</label>
                </div>
              </div>
              <div class="row p-4">
                <div class="col-2">
                  <label class="form-check-label text-end" for="view-record">勤怠照会可否</label>
                </div>
                <div class="col-2">
                  <select class="form-select" v-model="viewRecord" id="view-record">
                    <option value></option>
                    <option value="self">本人のみ</option>
                    <option value="section">自部署</option>
                    <option value="all">全社員</option>
                  </select>
                </div>
              </div>
              <div class="row p-4">
                <div class="col-2 text-end">遅刻申請上限</div>
                <div class="col-4">
                  <div class="input-group">
                    <span class="input-group-text">月</span>
                    <input
                      type="number"
                      min="0"
                      class="form-control"
                      v-model="privilege.maxApplyLateNum"
                    />
                    <span class="input-group-text">回</span>
                    <input
                      type="number"
                      min="0"
                      class="form-control"
                      v-model="privilege.maxApplyLateHours"
                    />
                    <span class="input-group-text">時間</span>
                  </div>
                </div>
                <div class="col-2 text-end">早退申請上限</div>
                <div class="col-4">
                  <div class="input-group">
                    <span class="input-group-text">月</span>
                    <input
                      type="number"
                      min="0"
                      class="form-control"
                      v-model="privilege.maxApplyEarlyNum"
                    />
                    <span class="input-group-text">回</span>
                    <input
                      type="number"
                      min="0"
                      class="form-control"
                      v-model="privilege.maxApplyEarlyHours"
                    />
                    <span class="input-group-text">時間</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
            <button type="submit" class="btn btn-primary">設定</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
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
  bottom: 100%;
  left: 0%;
  right: 0%;
}
</style>