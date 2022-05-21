<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from 'vue-loading-overlay'
import { format } from 'fecha';
import { useSessionStore } from '@/stores/session';

import lodash from 'lodash';

import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
//import * as backendAccess from '@/BackendAccess';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const store = useSessionStore();

const recordInfos = ref<apiif.RecordResponseData[]>([]);
const checks = ref<boolean[]>([]);
const isModalOpened = ref(false);

const limit = ref(10);
const offset = ref(0);

const dateFrom = ref(format(new Date(), 'YYYY-MM-DD'));
const dateTo = ref(format(new Date(), 'YYYY-MM-DD'));
const accountSearch = ref('');
const nameSearch = ref('');
const departmentSearch = ref('');
const sectionSearch = ref('');
const deviceSearch = ref('');
const clockinSearch = ref('');
const breakSearch = ref('');
const reenterSearch = ref('');
const clockoutSearch = ref('');

const UpdateOnSearch = async function () {
  offset.value = 0;
  await updateRecordList();
}

watch(dateFrom, lodash.debounce(UpdateOnSearch, 200));
watch(dateTo, lodash.debounce(UpdateOnSearch, 200));
watch(accountSearch, lodash.debounce(UpdateOnSearch, 200));
watch(nameSearch, lodash.debounce(UpdateOnSearch, 200));
watch(departmentSearch, lodash.debounce(UpdateOnSearch, 200));
watch(sectionSearch, lodash.debounce(UpdateOnSearch, 200));
watch(deviceSearch, lodash.debounce(UpdateOnSearch, 200));
watch(clockinSearch, lodash.debounce(UpdateOnSearch, 200));
watch(breakSearch, lodash.debounce(UpdateOnSearch, 200));
watch(reenterSearch, lodash.debounce(UpdateOnSearch, 200));
watch(clockoutSearch, lodash.debounce(UpdateOnSearch, 200));

const $loading = useLoading();
const updateRecordList = async () => {

  const loader = $loading.show({ opacity: 0 });

  try {
    //const token = await store.getToken();
    //if (token) {
    //const tokenAccess = new backendAccess.TokenAccess(token);
    const access = await store.getTokenAccess();
    const infos = await access.getRecords({
      byUserAccount: accountSearch.value !== '' ? accountSearch.value : undefined,
      byUserName: nameSearch.value !== '' ? nameSearch.value : undefined,
      byDepartment: departmentSearch.value !== '' ? departmentSearch.value : undefined,
      bySection: sectionSearch.value !== '' ? sectionSearch.value : undefined,
      byDevice: deviceSearch.value !== '' ? deviceSearch.value : undefined,
      from: dateFrom.value !== '' ? new Date(dateFrom.value).toLocaleDateString() : undefined,
      to: dateTo.value !== '' ? new Date(dateTo.value).toLocaleDateString() : undefined,
      clockin: clockinSearch.value === 'notRecorded' ? false : (clockinSearch.value === 'recorded' ? true : undefined),
      break: breakSearch.value === 'notRecorded' ? false : (breakSearch.value === 'recorded' ? true : undefined),
      reenter: reenterSearch.value === 'notRecorded' ? false : (reenterSearch.value === 'recorded' ? true : undefined),
      clockout: clockoutSearch.value === 'notRecorded' ? false : (clockoutSearch.value === 'recorded' ? true : undefined),
      limit: limit.value + 1,
      offset: offset.value
    });

    if (infos) {
      recordInfos.value.splice(0);
      Array.prototype.push.apply(recordInfos.value, infos);
    }
    checks.value = Array.from({ length: recordInfos.value.length }, () => false);
    //}
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }

  loader.hide();
}

onMounted(async () => {
  await updateRecordList();
})

async function onRecordClick(id: number) {
  const loader = $loading.show({ opacity: 0 });
  try {
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
  loader.hide();
}

async function onPageBack() {
  const backTo = offset.value - limit.value;
  offset.value = backTo > 0 ? backTo : 0;
  await updateRecordList();
}

async function onPageForward() {
  const forwardTo = offset.value + limit.value;
  offset.value = forwardTo > 0 ? forwardTo : 0;
  await updateRecordList();
}

async function onSubmit() {
  try {
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
  await updateRecordList();
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="打刻一覧" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <div class="row justify-content-end p-2">
      <!--
      <div class="d-grid gap-2 col-4">
        <button type="button" class="btn btn-primary" id="button1" v-on:click="">ボタン1</button>
      </div>
      <div class="d-grid gap-2 col-4">
        <button type="button" class="btn btn-primary" id="button2" v-on:click="">ボタン2</button>
      </div>
      -->
      <div class="col-md-6">
        <div class="input-group">
          <span class="input-group-text">打刻日で検索</span>
          <input class="form-control form-control-sm" type="date" v-model="dateFrom" />〜
          <input class="form-control form-control-sm" type="date" v-model="dateTo" />
        </div>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-12 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">打刻日</th>
              <th scope="col">ID</th>
              <th scope="col">氏名</th>
              <th scope="col">部門</th>
              <th scope="col">部署</th>
              <th scope="col">端末</th>
              <th scope="col">出勤</th>
              <th scope="col">外出</th>
              <th scope="col">再入</th>
              <th scope="col">退勤</th>
            </tr>
            <tr>
              <th scope="col">
                <!-- <input class="form-check-input" type="checkbox" id="checkboxall" value /> -->
              </th>
              <th scope="col"></th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="accountSearch"
                  placeholder="完全一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="nameSearch"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="departmentSearch"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="sectionSearch"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="deviceSearch"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <select class="form-select form-select-sm" v-model="clockinSearch">
                  <option selected></option>
                  <option value="notRecorded">未打刻</option>
                  <option value="recorded">打刻済</option>
                </select>
              </th>
              <th scope="col">
                <select class="form-select form-select-sm" v-model="breakSearch">
                  <option selected></option>
                  <option value="notRecorded">未打刻</option>
                  <option value="recorded">打刻済</option>
                </select>
              </th>
              <th scope="col">
                <select class="form-select form-select-sm" v-model="reenterSearch">
                  <option selected></option>
                  <option value="notRecorded">未打刻</option>
                  <option value="recorded">打刻済</option>
                </select>
              </th>
              <th scope="col">
                <select class="form-select form-select-sm" v-model="clockoutSearch">
                  <option selected></option>
                  <option value="notRecorded">未打刻</option>
                  <option value="recorded">打刻済</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in recordInfos.slice(0, limit)">
              <th scope="row">
                <!-- <input class="form-check-input" type="checkbox" :id="'checkbox' + index" v-model="checks[index]" /> -->
              </th>
              <td>{{ record.date ? new Date(record.date).toLocaleDateString() : '' }}</td>
              <td>{{ record.userAccount }}</td>
              <td>{{ record.userName }}</td>
              <td>{{ record.userDepartment }}</td>
              <td>{{ record.userSection }}</td>
              <td>{{ record.clockin?.deviceName ?? '' }}</td>
              <td>{{ record.clockin?.timestamp.toLocaleTimeString() ?? '' }}</td>
              <td>{{ record.break?.timestamp.toLocaleTimeString() ?? '' }}</td>
              <td>{{ record.reenter?.timestamp.toLocaleTimeString() ?? '' }}</td>
              <td>{{ record.clockout?.timestamp.toLocaleTimeString() ?? '' }}</td>
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
                    <li class="page-item" v-bind:class="{ disabled: recordInfos.length <= limit }">
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