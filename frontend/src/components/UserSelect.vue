<script setup lang="ts">
import lodash from 'lodash';
import { ref, watch } from 'vue';

import { useSessionStore } from '@/stores/session';
import * as backendAccess from '@/BackendAccess';

const store = useSessionStore();

const selectedDepartmentName = ref('');
const selectedSectionName = ref('');
const selectedUserAccount = ref('');
const selectedUserName = ref('');

const props = defineProps<{
  isOpened: boolean,
  account: string,
  name?: string
}>();

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:account', value: string): void
  (event: 'update:name', value: string): void
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

function onSubmit(event: Event) {
  if (selectedUserAccount.value !== '') {
    const user = userList.value.find(user => user.account === selectedUserAccount.value);
    if (user) {
      selectedUserName.value = user.name;
    }
    emits('update:account', selectedUserAccount.value);
    emits('update:name', selectedUserName.value);
    emits('update:isOpened', false);
  }
}

const departmentList = ref<{ name: string, sections?: { name: string }[] }[]>([]);
const departmentNameList = ref<string[]>([]);
const sectionNameList = ref<string[]>([]);
const userList = ref<{ account: string, name: string }[]>([]);

backendAccess.getDepartments().then((departments) => {
  if (departments) {
    departmentList.value = departments;
    departmentNameList.value = departmentList.value.map(department => department.name)
  }
});

watch(selectedDepartmentName, () => {
  const department = departmentList.value.find(department => department.name === selectedDepartmentName.value);
  if (department?.sections) {
    selectedSectionName.value = '';
    sectionNameList.value.splice(0);
    sectionNameList.value = department.sections.map(section => section.name);

    selectedUserAccount.value = '';
    userList.value.splice(0);
  }
});

watch(selectedSectionName, async () => {
  if (selectedSectionName.value === '') {
    return;
  }

  if (store.isLoggedIn()) {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      const userInfos = await access.getUserInfos({
        byDepartment: selectedDepartmentName.value,
        bySection: selectedSectionName.value
      });

      if (userInfos) {
        userList.value = userInfos.map((info) => { return { account: info.account, name: info.name } });
        selectedUserAccount.value = '';
      }
    }
  }
});

const phoneticSearch = ref('');
watch(phoneticSearch, lodash.debounce(async () => {
  if (store.isLoggedIn()) {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      const userInfos = await access.getUserInfos({
        byDepartment: selectedDepartmentName.value,
        bySection: selectedSectionName.value,
        byPhonetic: phoneticSearch.value
      });

      if (userInfos) {
        userList.value = userInfos.map((info) => { return { account: info.account, name: info.name } });
      }
    }
  }
}, 200));

</script>

<template>
  <div class="overlay" id="hogehogeuser">
    <div class="modal-dialog vue-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">従業員選択</h5>
          <button type="button" class="btn-close" v-on:click="onClose"></button>
        </div>
        <div class="modal-body">
          <p>従業員を選択してください</p>
          <div class="row">
            <div class="col">
              <p>所属</p>
              <select class="form-select" size="8" v-model="selectedDepartmentName">
                <option
                  v-for="departmentName in departmentNameList"
                  :value="departmentName"
                >{{ departmentName }}</option>
              </select>
            </div>
            <div class="col">
              <p>部署</p>
              <select class="form-select" size="8" v-model="selectedSectionName">
                <option
                  v-for="sectionName in sectionNameList"
                  :value="sectionName"
                >{{ sectionName }}</option>
              </select>
            </div>
            <div class="col">
              <p>氏名</p>
              <input
                class="form-control form-control-sm"
                type="text"
                placeholder="カナ検索"
                v-model="phoneticSearch"
              />
              <select class="form-select" size="8" v-model="selectedUserAccount">
                <option v-for="user in userList" :value="user.account">{{ user.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
          <button
            type="button"
            class="btn btn-primary"
            v-bind:disabled="selectedUserAccount === ''"
            v-on:click="onSubmit"
          >選択</button>
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
  left: 0%;
  right: 0%;
}
</style>