<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';

import WorkPatternEdit from '@/components/WorkPatternEdit.vue';
import { putErrorToDB } from '@/ErrorDB';

function formatTimeString(time: string) {
  const hourMinSec = time.split(':');
  if (hourMinSec.length < 2) {
    return '';
  }

  const hour = parseInt(hourMinSec[0]);
  return ((hour > 24) ? ('翌' + (hour - 24)) : hour) + ':' + hourMinSec[1];
}

const router = useRouter();
const store = useSessionStore();

const isModalOpened = ref(false);
const selectedWorkPattern = ref<apiif.WorkPatternRequestData>({ name: '', onTimeStart: '', onTimeEnd: '', wagePatterns: [] });
const workPatternInfos = ref<apiif.WorkPatternResponseData[]>([]);
const checks = ref<Record<number, boolean>>({});

const limit = ref(10);
const offset = ref(0);

async function updateTable() {
  try {
    const access = await store.getTokenAccess();
    const infos = await access.getWorkPatterns({ limit: limit.value + 1, offset: offset.value });
    if (infos) {
      workPatternInfos.value.splice(0);
      Array.prototype.push.apply(workPatternInfos.value, infos);
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

async function onWorkPatternClick(workPatternName?: string) {
  if (workPatternName) {
    try {
      const access = await store.getTokenAccess();
      const workPattern = await access.getWorkPattern(workPatternName);
      if (workPattern) {
        selectedWorkPattern.value = JSON.parse(JSON.stringify(workPattern));
      }
      isModalOpened.value = true;
    }
    catch (error) {
      console.error(error);
      await putErrorToDB(store.userAccount, error as Error);
      alert(error);
    }
  }
  else {
    selectedWorkPattern.value.id = undefined;
    selectedWorkPattern.value.name = '';
    selectedWorkPattern.value.onTimeStart = '';
    selectedWorkPattern.value.onTimeEnd = '';
    selectedWorkPattern.value.wagePatterns = undefined;
    isModalOpened.value = true;
  }
}

async function onWorkPatternDelete() {
  if (!confirm('チェックされた勤務体系を削除しますか? (※従業員が1人でも使用している勤務体系は削除できず、サーバーエラーが発生します)')) {
    return;
  }
  try {
    const access = await store.getTokenAccess();
    for (const workPattern of workPatternInfos.value) {
      if (checks.value[workPattern.id]) {
        await access.deleteWorkPattern(workPattern.id);
      }
    }
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

async function onWorkPatternSubmit() {
  try {
    const access = await store.getTokenAccess();

    // 承認ルートIDが作成済であれば既存ルートの更新、そうでなければ新規作成
    if (selectedWorkPattern.value.id) {
      await access.updateWorkPattern(selectedWorkPattern.value);
    }
    else {
      await access.addWorkPattern(selectedWorkPattern.value);
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
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="勤務体系設定" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <Teleport to="body" v-if="isModalOpened">
      <WorkPatternEdit v-model:isOpened="isModalOpened" v-model:workPattern="selectedWorkPattern"
        v-on:submit="onWorkPatternSubmit"></WorkPatternEdit>
    </Teleport>

    <div class="row justify-content-start p-2">
      <div class="d-grid gap-2 col-3">
        <button type="button" class="btn btn-primary" id="new-route" v-on:click="onWorkPatternClick()">新規勤務体系作成</button>
      </div>
      <div class="d-grid gap-2 col-4">
        <button type="button" class="btn btn-primary" id="export"
          v-bind:disabled="Object.values(checks).every(check => check === false)"
          v-on:click="onWorkPatternDelete()">チェックした勤務体系を削除</button>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">勤務体系名</th>
              <th scope="col">定時開始時刻</th>
              <th scope="col">定時終了時刻</th>
              <!-- <th v-for="roleName in roleNamesLinear">{{ roleName }}</th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(workPattern, index) in workPatternInfos">
              <th scope="row">
                <input class="form-check-input" type="checkbox" :id="'checkbox' + index"
                  v-model="checks[workPattern.id]" />
              </th>
              <td>
                <button type="button" class="btn btn-link" v-on:click="onWorkPatternClick(workPattern.name)">{{
                    workPattern.name
                }}</button>
              </td>
              <td>{{ formatTimeString(workPattern.onTimeStart) }}</td>
              <td>{{ formatTimeString(workPattern.onTimeEnd) }}</td>
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
                    <li class="page-item" v-bind:class="{ disabled: workPatternInfos.length <= limit }">
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