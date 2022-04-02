<script setup lang="ts">

import { ref, onMounted } from 'vue';
import { useSessionStore } from '@/stores/session';

import type * as apiif from 'shared/APIInterfaces';
import * as backendAccess from '@/BackendAccess';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  applyType: apiif.ApplyTypeResponseData,
  applyPermissionNames: string[]
}>();

const isOpened = ref(false);
const applyType = ref(props.applyType);
const privilegeInfos = ref<apiif.PrivilegeResponseData[]>([]);
const checks = ref<Record<string, boolean>>({});

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:applyType', value: apiif.ApplyTypeResponseData): void,
  (event: 'update:applyPermissionNames', value: string[]): void,
  (event: 'submit'): void,
}>();

onMounted(async () => {
  try {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token)
      const privs = await access.getPrivileges();
      if (privs) {
        privilegeInfos.value.splice(0);
        Array.prototype.push.apply(privilegeInfos.value, privs);
        for (const priv of privs) {
          const applyPrivilege = priv.applyPrivileges?.find(applyPrivilege => applyPrivilege.applyTypeName === props.applyType.name);
          if (applyPrivilege) {
            checks.value[priv.name] = applyPrivilege.permitted;
          }
          else {
            checks.value[priv.name] = false;
          }
        }
      }
    }
  }
  catch (error) {
    alert(error);
  }
});

function onClose(event: Event) {
  emits('update:isOpened', false);
}

function onSubmit(event: Event) {
  const checksResult: string[] = [];
  for (const key in checks.value) {
    if (checks.value[key] === true) {
      checksResult.push(key);
    }
  }

  emits('update:isOpened', false);
  emits('update:applyType', applyType.value);
  emits('update:applyPermissionNames', checksResult);
  emits('submit');
}

</script>

<template>
  <div class="overlay" id="privilege-root">
    <div class="modal-dialog modal-xl vue-modal">
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">申請種別設定</h5>
            <button type="button" class="btn-close" v-on:click="onClose"></button>
          </div>
          <div class="modal-body">
            <div class="row justify-content-start">
              <label for="apply-type-description" class="col-2 col-form-label text-end">申請種別名</label>
              <div class="col-3">
                <input
                  type="text"
                  class="form-control"
                  id="apply-type-description"
                  v-model="applyType.description"
                  required
                />
              </div>
              <label for="apply-type-name" class="col-2 col-form-label text-end">申請種別ID</label>
              <div class="col-3">
                <input
                  type="text"
                  class="form-control"
                  id="apply-type-name"
                  pattern="^[0-9A-Za-z\-_]+$"
                  maxlength="15"
                  title="15文字以内の半角英数字、及びハイフン文字のみ使用可能です"
                  v-model="applyType.name"
                  required
                />
              </div>
            </div>
            <div class="row">
              <div class="d-flex align-content-start flex-wrap">
                <div class="form-check form-switch m-2" v-for="(item, index) in privilegeInfos">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    :id="'apply-' + item.id"
                    v-model="checks[item.name]"
                  />
                  <label class="form-check-label" :for="'apply-' + item.id">{{ item.name }}</label>
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