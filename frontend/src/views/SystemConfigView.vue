<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
import * as backendAccess from '@/BackendAccess';

import SystemConfigEdit from '@/components/SystemConfigEdit.vue';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const store = useSessionStore();

const isModalOpened = ref(false);
const selectedConfig = ref<apiif.SystemConfigResponseData>({ key: '', value: '' });
const selectedConfigValue = ref('');
const configInfos = ref<apiif.SystemConfigResponseData[]>([]);

const limit = ref(4);
const offset = ref(0);

async function updateTable() {

  try {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      const infos = await access.getSystemConfig({ limit: limit.value + 1, offset: offset.value });
      if (infos) {
        configInfos.value.splice(0);
        Array.prototype.push.apply(configInfos.value, infos);
      }
    }
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

async function onConfigClick(configKey: string) {
  const config = configInfos.value.find(config => config.key === configKey);
  if (config) {
    selectedConfig.value.key = config.key;
    selectedConfig.value.value = config.value;
    selectedConfig.value.title = config.title;
    selectedConfig.value.description = config.description;
    selectedConfig.value.isMultiLine = config.isMultiLine;
    selectedConfig.value.isPassword = config.isPassword;
    selectedConfigValue.value = config.value;

    isModalOpened.value = true;
  }
}

async function onConfigSubmit() {
  try {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      access.setSystemConfig(selectedConfig.value.key, selectedConfigValue.value);
    }
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
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="システム設定" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <Teleport to="body" v-if="isModalOpened">
      <SystemConfigEdit v-model:isOpened="isModalOpened" v-model:value="selectedConfigValue"
        :keyName="selectedConfig.key ?? ''" :title="selectedConfig.title ?? ''"
        :description="selectedConfig.description ?? ''" :isMultiLine="selectedConfig.isMultiLine ?? false"
        :isPassword="selectedConfig.isPassword ?? false" v-on:submit="onConfigSubmit"></SystemConfigEdit>
    </Teleport>

    <div class="row justify-content-start p-2">
    </div>

    <div class="row justify-content-center">
      <div class="col-10">
        <div class="row justify-content-start">
          <div class="col">
            <div class="overflow-auto">
              <div v-for="(config, index) in configInfos.slice(0, limit)" class="card">
                <div class="card-header">
                  <button type="button" class="btn btn-link" v-on:click="onConfigClick(config.key)">{{
                      config.title
                  }}</button> ({{ config.key }})
                </div>
                <div class="card-body">
                  <p class="card-title">{{ config.description }}</p>
                  <template v-if="config.isMultiLine">
                    <textarea class="form-control" rows="4" disabled readonly>{{ config.value }}</textarea>
                  </template>
                  <template v-else-if="config.isPassword">
                    <input type="password" class="form-control" disabled readonly :value="config.value">
                  </template>
                  <template v-else>
                    <input type="text" class="form-control" disabled readonly :value="config.value">
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row justify-content-start">
          <nav>
            <ul class="pagination">
              <li class="page-item" v-bind:class="{ disabled: offset <= 0 }">
                <button class="page-link" v-on:click="onPageBack">
                  <span>&laquo;</span>
                </button>
              </li>
              <li class="page-item" v-bind:class="{ disabled: configInfos.length <= limit }">
                <button class="page-link" v-on:click="onPageForward">
                  <span>&raquo;</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
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