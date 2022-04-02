<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
import * as backendAccess from '@/BackendAccess';

import HolidayEdit from '@/components/HolidayEdit.vue';

const router = useRouter();
const store = useSessionStore();

const isModalOpened = ref(false);
const selectedHoliday = ref<apiif.HolidayResponseData>({ date: '', name: '' });
const holidayInfos = ref<apiif.HolidayResponseData[]>([]);
const checks = ref<Record<string, boolean>>({});
const selectedYear = ref(new Date().getFullYear());

const limit = ref(10);
const offset = ref(0);

async function updateTable() {

  try {
    const infos = await backendAccess.getHolidays({
      from: `${selectedYear.value.toString()}-01-01T00:00:00`,
      to: `${selectedYear.value.toString()}-12-31T23:59:59`,
      limit: limit.value + 1,
      offset: offset.value
    });
    if (infos) {
      holidayInfos.value.splice(0);
      Array.prototype.push.apply(holidayInfos.value, infos);
    }
  }
  catch (error) {
    alert(error);
  }

}

onMounted(async () => {
  await updateTable();
});

watch(selectedYear, async () => {
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

async function onHolidayClick(params?: { date: string, name: string }) {
  if (params) {
    selectedHoliday.value.date = params.date;
    selectedHoliday.value.name = params.name;
  }
  else {
    selectedHoliday.value.date = '';
    selectedHoliday.value.name = '';
  }
  isModalOpened.value = true;
}

async function onHolidayDelete() {
  if (!confirm('チェックされた休日を削除しますか?')) {
    return;
  }
  try {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      for (const holiday of holidayInfos.value) {
        if (checks.value[holiday.date]) {
          await access.deleteHoliday(holiday.date.replace(/\//g, '-'));
        }
      }
    }
  }
  catch (error) {
    alert(error);
  }

  // チェックをすべてクリアする
  for (const key in checks.value) {
    checks.value[key] = false;
  }

  await updateTable();
}

async function onHolidaySubmit() {
  try {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      await access.setHoliday(selectedHoliday.value);
    }
  }
  catch (error) {
    alert(error);
  }
  await updateTable();
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="休日設定"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push({ name: 'dashboard' })"
        ></Header>
      </div>
    </div>

    <Teleport to="body" v-if="isModalOpened">
      <HolidayEdit
        v-model:isOpened="isModalOpened"
        v-model:date="selectedHoliday.date"
        v-model:name="selectedHoliday.name"
        v-on:submit="onHolidaySubmit"
      ></HolidayEdit>
    </Teleport>
    <!--
    <Teleport to="body" v-if="isModalOpened">
      <WorkPatternEdit
        v-model:isOpened="isModalOpened"
        v-model:workPattern="selectedWorkPattern"
        v-on:submit="onWorkPatternSubmit"
      ></WorkPatternEdit>
    </Teleport>
    -->
    <div class="row justify-content-start p-2">
      <div class="d-grid gap-2 col-3">
        <button
          type="button"
          class="btn btn-primary"
          id="new-route"
          v-on:click="onHolidayClick()"
        >休日追加</button>
      </div>
      <div class="d-grid gap-2 col-4">
        <button
          type="button"
          class="btn btn-primary"
          id="export"
          v-bind:disabled="Object.values(checks).every(check => check === false)"
          v-on:click="onHolidayDelete()"
        >チェックした休日を削除</button>
      </div>
      <div class="col-md-2">
        <div class="input-group">
          <input
            class="form-control form-control-sm"
            type="number"
            min="1970"
            v-model="selectedYear"
          />
          <span class="input-group-text">年</span>
        </div>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">日付</th>
              <th scope="col">休日名</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(holiday, index) in holidayInfos.slice(0, limit)">
              <th scope="row">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="'checkbox' + index"
                  v-model="checks[holiday.date]"
                />
              </th>
              <td>
                <button
                  type="button"
                  class="btn btn-link"
                  v-on:click="onHolidayClick({ date: holiday.date, name: holiday.name })"
                >{{ holiday.date }}</button>
              </td>
              <td>{{ holiday.name }}</td>
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
                    <li class="page-item" v-bind:class="{ disabled: holidayInfos.length <= limit }">
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
} /* Adding !important forces the browser to overwrite the default style applied by Bootstrap */

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