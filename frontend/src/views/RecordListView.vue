<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { useLoading } from 'vue-loading-overlay'
import FileSaver from 'file-saver';
import { stringify } from 'csv/browser/esm/sync';
import { format, parse } from 'fecha';

import { useSessionStore } from '@/stores/session';

import lodash from 'lodash';

import Header from '@/components/Header.vue';
import RecordEdit from '@/components/RecordEdit.vue';

import type * as apiif from 'shared/APIInterfaces';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const store = useSessionStore();

const recordAndApplyInfo = ref<{
  record: apiif.RecordResponseData,
  apply?: apiif.ApplyResponseData[],
  earlyLeaveTime?: string,
  earlyLeaveApply?: apiif.ApplyResponseData,
  earlyLeaveRouterLink?: RouteLocationRaw,
  latenessTime?: string,
  latenessApply?: apiif.ApplyResponseData,
  latenessRouterLink?: RouteLocationRaw,
  earlyOverTime?: string,
  earlyOverApply?: apiif.ApplyResponseData,
  earlyOverRouterLink?: RouteLocationRaw,
  lateOverTime?: string
  lateOverApply?: apiif.ApplyResponseData,
  lateOverRouterLink?: RouteLocationRaw
}[]>([]);

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
const isAccountSearchable = ref(false);
const isDepartmentSearchable = ref(false);
const isSectionSearchable = ref(false);

if (store.privilege?.viewAllUserInfo) {
  isAccountSearchable.value = true;
  isSectionSearchable.value = true;
  isDepartmentSearchable.value = true;
}
else if (store.privilege?.viewDepartmentUserInfo) {
  isAccountSearchable.value = true;
  isSectionSearchable.value = true;
  departmentSearch.value = store.userDepartment;
}
else if (store.privilege?.viewSectionUserInfo) {
  isAccountSearchable.value = true;
  departmentSearch.value = store.userDepartment;
  sectionSearch.value = store.userSection;
}
else {
  departmentSearch.value = store.userDepartment;
  sectionSearch.value = store.userSection;
  accountSearch.value = store.userAccount;
}

const deviceSearch = ref('');
const clockinSearch = ref('');
const breakSearch = ref('');
const reenterSearch = ref('');
const clockoutSearch = ref('');

const deviceNames = ref<string[]>([]);

function secondsToTimeStr(seconds: number, floor: boolean = true) {
  const negative = seconds < 0 ? '-' : '';
  const absSeconds = Math.abs(seconds);

  const hour = Math.floor(absSeconds / 3600);
  const minFloat = (absSeconds - (hour * 3600)) / 60;
  const min = floor ? Math.floor(minFloat) : Math.ceil(minFloat);
  //const sec = seconds - (hour * 3600) - (min * 60);

  return `${negative}${hour}:` + min.toString().padStart(2, '0');
}

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
    const access = await store.getTokenAccess();
    const records = await access.getRecords({
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

    if (records) {
      recordAndApplyInfo.value.splice(0);
      Array.prototype.push.apply(recordAndApplyInfo.value, records.map(record => { return { record: record } }));

      // 打刻実績に対応した各種申請の検索
      if (records.length > 0) {
        const userAccounts = records.map(record => record.userAccount);
        const applyDates = records.map(record => new Date(record.date));
        const applies = await access.getApplies({
          targetedUserAccounts: userAccounts,
          dateFrom: applyDates.reduce((prev, cur) => (prev < cur) ? prev : cur),
          dateTo: applyDates.reduce((prev, cur) => (prev > cur) ? prev : cur),
        })

        if (applies && applies.length > 0) {
          for (const recordAndApply of recordAndApplyInfo.value) {
            const existingApplies = applies.filter(apply =>
              (apply.targetUser.account === recordAndApply.record.userAccount) &&
              (apply.date?.getTime() === recordAndApply.record.date.getTime()) &&
              (apply.isApproved !== false) // 否認された申請は含めない
            );

            if (existingApplies.length > 0) {
              recordAndApply.apply = [];
              Array.prototype.push.apply(recordAndApply.apply, existingApplies);

              recordAndApply.earlyLeaveApply = existingApplies.find(apply => apply.type.name === 'leave-early');
              recordAndApply.latenessApply = existingApplies.find(apply => apply.type.name === 'lateness');
              recordAndApply.earlyOverApply = existingApplies.find(apply => apply.type.name === 'overtime'); // 早出は実装未定
              recordAndApply.lateOverApply = existingApplies.find(apply => apply.type.name === 'overtime');
            }
          }
        }
      }
    }

    // 遅刻・早退・早出・残業時間の算出
    for (const recordAndApply of recordAndApplyInfo.value) {
      if (recordAndApply.record.earlyOverTimeSeconds && recordAndApply.record.earlyOverTimeSeconds < -60) {
        recordAndApply.latenessTime = secondsToTimeStr(Math.abs(recordAndApply.record.earlyOverTimeSeconds));
      }
      if (recordAndApply.record.lateOverTimeSeconds && recordAndApply.record.lateOverTimeSeconds < -60) {
        recordAndApply.earlyLeaveTime = secondsToTimeStr(Math.abs(recordAndApply.record.lateOverTimeSeconds), false);
      }
      if (recordAndApply.record.earlyOverTimeSeconds && recordAndApply.record.earlyOverTimeSeconds > (60 * 30)) {
        recordAndApply.earlyOverTime = secondsToTimeStr(recordAndApply.record.earlyOverTimeSeconds, false);
      }
      if (recordAndApply.record.lateOverTimeSeconds && recordAndApply.record.lateOverTimeSeconds > (60 * 30)) {
        recordAndApply.lateOverTime = secondsToTimeStr(recordAndApply.record.lateOverTimeSeconds);
      }

      recordAndApply.latenessRouterLink = {
        name: recordAndApply.latenessApply ? 'apply-lateness-view' : 'apply-lateness',
        params: recordAndApply.latenessApply ?
          { id: recordAndApply.latenessApply.id } :
          {
            date: format(recordAndApply.record.date, 'isoDate'),
            timeFrom: recordAndApply.record.onTimeStart ? format(recordAndApply.record.onTimeStart, 'HH:mm') : undefined,
            timeTo: recordAndApply.record.clockin ? format(recordAndApply.record.clockin.timestamp, 'HH:mm') : ''
          }
      };

      recordAndApply.earlyLeaveRouterLink = {
        name: recordAndApply.earlyLeaveApply ? 'apply-leave-early-view' : 'apply-leave-early',
        params: recordAndApply.earlyLeaveApply ?
          { id: recordAndApply.earlyLeaveApply.id } :
          {
            date: format(recordAndApply.record.date, 'isoDate'),
            timeFrom: recordAndApply.record.clockout ? format(recordAndApply.record.clockout.timestamp, 'HH:mm') : '',
            timeTo: recordAndApply.record.onTimeEnd ? format(recordAndApply.record.onTimeEnd, 'HH:mm') : undefined
          }
      };

      recordAndApply.lateOverRouterLink = {
        name: recordAndApply.lateOverApply ? 'apply-overtime-view' : 'apply-overtime',
        params: recordAndApply.lateOverApply ?
          { id: recordAndApply.lateOverApply.id } :
          {
            date: format(recordAndApply.record.date, 'isoDate'),
            timeFrom: recordAndApply.record.onTimeEnd ? format(recordAndApply.record.onTimeEnd, 'HH:mm') : undefined,
            timeTo: recordAndApply.record.clockout ? format(recordAndApply.record.clockout.timestamp, 'HH:mm') : ''
          }
      };
    }

    checks.value = Array.from({ length: recordAndApplyInfo.value.length }, () => false);
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }

  loader.hide();
}

onMounted(async () => {
  const access = await store.getTokenAccess();
  const devices = await access.getDevices();
  if (devices) {
    devices.forEach(device => deviceNames.value.push(device.name));
  }

  await updateRecordList();
})

const selectedUserAccount = ref('');
const selectedRecordDate = ref<Date>();
const selectedClockinTime = ref<Date>();
const selectedBreakTime = ref<Date>();
const selectedReenterTime = ref<Date>();
const selectedClockoutTime = ref<Date>();

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

async function onExportCsv() {
  try {
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
      clockout: clockoutSearch.value === 'notRecorded' ? false : (clockoutSearch.value === 'recorded' ? true : undefined)
    });

    if (infos) {
      const recordCsvData = infos.map(info => {
        return {
          '打刻日': new Date(info.date).toLocaleDateString(),
          'ID': info.userAccount,
          '氏名': info.userName,
          '部門': info.userDepartment,
          '部署': info.userSection,
          '端末': info.clockin?.deviceName,
          '出勤': info.clockin?.timestamp ? format(info.clockin.timestamp, 'YYYY/MM/DD HH:mm:ss') : undefined,
          '外出': info.break?.timestamp ? format(info.break.timestamp, 'YYYY/MM/DD HH:mm:ss') : undefined,
          '再入': info.reenter?.timestamp ? format(info.reenter.timestamp, 'YYYY/MM/DD HH:mm:ss') : undefined,
          '退勤': info.clockout?.timestamp ? format(info.clockout.timestamp, 'YYYY/MM/DD HH:mm:ss') : undefined
        }
      });
      const recordCsvString = stringify(recordCsvData, { bom: true, header: true });
      const blob = new Blob([recordCsvString], { type: 'text/csv;charset=utf-8' });
      FileSaver.saveAs(blob, 'record' + format(new Date(), 'YYYYMMDDHHmmss') + '.csv');
    }
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
}

async function onRecordClick(params: { account: string, date: Date, clockin?: Date, break?: Date, reenter?: Date, clockout?: Date }) {
  selectedUserAccount.value = params.account;
  selectedRecordDate.value = new Date(params.date);

  selectedClockinTime.value = params.clockin ? new Date(params.clockin) : undefined;
  selectedBreakTime.value = params.break ? new Date(params.break) : undefined;
  selectedReenterTime.value = params.reenter ? new Date(params.reenter) : undefined;
  selectedClockoutTime.value = params.clockout ? new Date(params.clockout) : undefined;

  isModalOpened.value = true;
}

async function onAddRecord() {
  selectedUserAccount.value = '';
  selectedRecordDate.value = undefined;
  selectedClockinTime.value = undefined;
  selectedBreakTime.value = undefined;
  selectedReenterTime.value = undefined;
  selectedClockoutTime.value = undefined;

  isModalOpened.value = true;
}

async function onRecordEditSubmit() {
  const access = await store.getTokenAccess();

  if (selectedClockinTime.value) {
    await access.submitRecord('clockin', { account: selectedUserAccount.value, timestamp: selectedClockinTime.value });
  }
  if (selectedBreakTime.value) {
    await access.submitRecord('break', { account: selectedUserAccount.value, timestamp: selectedBreakTime.value });
  }
  if (selectedReenterTime.value) {
    await access.submitRecord('reenter', { account: selectedUserAccount.value, timestamp: selectedReenterTime.value });
  }
  if (selectedClockoutTime.value) {
    await access.submitRecord('clockout', { account: selectedUserAccount.value, timestamp: selectedClockoutTime.value });
  }

  selectedUserAccount.value = '';
  selectedRecordDate.value = undefined;
  selectedClockinTime.value = undefined;
  selectedBreakTime.value = undefined;
  selectedReenterTime.value = undefined;
  selectedClockoutTime.value = undefined;

  await updateRecordList();
}

</script>

<template>

  <Teleport to="body" v-if="isModalOpened">
    <RecordEdit v-model:isOpened="isModalOpened" v-model:account="selectedUserAccount" v-model:date="selectedRecordDate"
      v-model:clockin="selectedClockinTime" v-model:break="selectedBreakTime" v-model:reenter="selectedReenterTime"
      v-model:clockout="selectedClockoutTime"
      :limitDepartmentName="isDepartmentSearchable === false ? store.userDepartment : undefined"
      :limitSectionName="isSectionSearchable === false ? store.userSection : undefined"
      v-on:submit="onRecordEditSubmit">
    </RecordEdit>
  </Teleport>

  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="打刻一覧" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <div class="row justify-content-end p-2">
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="button-export-csv" v-on:click="onExportCsv">CSVエクスポート</button>
      </div>
      <div v-if="isAccountSearchable === true || isDepartmentSearchable === true" class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="button2" v-on:click="onAddRecord">打刻追加</button>
      </div>
      <div class="col-md-6">
        <div class="input-group">
          <span class="input-group-text">打刻日で検索</span>
          <input class="form-control form-control-sm" type="date" v-model="dateFrom" />〜
          <input class="form-control form-control-sm" type="date" v-model="dateTo" />
        </div>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-12 bg-white shadow-sm table-responsive">
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
              <th scope="col">遅刻</th>
              <th scope="col">早退</th>
              <!-- <th scope="col">早出</th> -->
              <th scope="col">残業</th>
            </tr>
            <tr>
              <th scope="col">
                <!-- <input class="form-check-input" type="checkbox" id="checkboxall" value /> -->
              </th>
              <th scope="col"></th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="accountSearch"
                  :readonly="isAccountSearchable !== true" :disabled="isAccountSearchable !== true"
                  placeholder="完全一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="nameSearch"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="departmentSearch"
                  :readonly="isDepartmentSearchable !== true" :disabled="isDepartmentSearchable !== true"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="sectionSearch"
                  :readonly="isSectionSearchable !== true" :disabled="isSectionSearchable !== true"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <!--
                <input class="form-control form-control-sm" type="text" size="3" v-model="deviceSearch"
                  placeholder="部分一致" />
                -->
                <select class="form-select form-select-sm" v-model="deviceSearch">
                  <option value="">全て</option>
                  <option v-for="(deviceName, index) of deviceNames" :value="deviceName">{{ deviceName }}</option>
                </select>
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
            <tr v-for="(recordAndApply, index) in recordAndApplyInfo.slice(0, limit)">
              <th scope="row">
                <!-- <input class="form-check-input" type="checkbox" :id="'checkbox' + index" v-model="checks[index]" /> -->
              </th>
              <td>
                <button v-if="isAccountSearchable === true || isDepartmentSearchable === true" type="button"
                  class="btn btn-link" v-on:click="onRecordClick({
                    account: recordAndApply.record.userAccount, date: new Date(recordAndApply.record.date),
                    clockin: recordAndApply.record.clockin?.timestamp,
                    break: recordAndApply.record.break?.timestamp,
                    reenter: recordAndApply.record.reenter?.timestamp,
                    clockout: recordAndApply.record.clockout?.timestamp,
                  })">
                  {{ recordAndApply.record.date ? new Date(recordAndApply.record.date).toLocaleDateString() : '' }}
                </button>
                <template v-else>{{ recordAndApply.record.date ? new
                    Date(recordAndApply.record.date).toLocaleDateString() : ''
                }}</template>
              </td>
              <td>{{ recordAndApply.record.userAccount }}</td>
              <td>{{ recordAndApply.record.userName }}</td>
              <td>{{ recordAndApply.record.userDepartment }}</td>
              <td>{{ recordAndApply.record.userSection }}</td>
              <td>{{ recordAndApply.record.clockin?.deviceName ?? '' }}</td>
              <td>{{ recordAndApply.record.clockin?.timestamp.toLocaleTimeString().split(':', 2).join(':') ?? '' }}</td>
              <td>{{ recordAndApply.record.break?.timestamp.toLocaleTimeString().split(':', 2).join(':') ?? '' }}</td>
              <td>{{ recordAndApply.record.reenter?.timestamp.toLocaleTimeString().split(':', 2).join(':') ?? '' }}</td>
              <td>{{ recordAndApply.record.clockout?.timestamp.toLocaleTimeString().split(':', 2).join(':') ?? '' }}
              </td>
              <td
                :class="recordAndApply.latenessTime ? (recordAndApply.latenessApply ? (recordAndApply.latenessApply.isApproved ? 'table-success' : 'table-warning') : 'table-danger') : ''">
                <!-- その打刻が遅刻の場合 -->
                <template v-if="recordAndApply.latenessTime">
                  <!-- 遅刻した本人か、遅刻の申請が起票済の場合、申請書画面へのリンクを作成する -->
                  <RouterLink
                    v-if="(recordAndApply.latenessApply || recordAndApply.record.userAccount === store.userAccount) && recordAndApply.latenessRouterLink"
                    :to="recordAndApply.latenessRouterLink">
                    {{ recordAndApply.latenessTime }}
                  </RouterLink>
                  <!-- それ以外の場合(遅刻した本人ではなく、かつ申請書も未起票の場合)単に遅刻時間を表示する -->
                  <template v-else>
                    {{ recordAndApply.latenessTime }}
                  </template>
                </template>
              </td>
              <td
                :class="recordAndApply.earlyLeaveTime ? (recordAndApply.earlyLeaveApply ? (recordAndApply.earlyLeaveApply.isApproved ? 'table-success' : 'table-warning') : 'table-danger') : ''">
                <!-- その打刻が早退の場合 -->
                <template v-if="recordAndApply.earlyLeaveTime">
                  <!-- 早退した本人か、早退の申請が起票済の場合、申請書画面へのリンクを作成する -->
                  <RouterLink
                    v-if="(recordAndApply.earlyLeaveApply || recordAndApply.record.userAccount === store.userAccount) && recordAndApply.earlyLeaveRouterLink"
                    :to="recordAndApply.earlyLeaveRouterLink">
                    {{ recordAndApply.earlyLeaveTime }}
                  </RouterLink>
                  <!-- それ以外の場合(遅刻した本人ではなく、かつ申請書も未起票の場合)単に早退時間を表示する -->
                  <template v-else>
                    {{ recordAndApply.earlyLeaveTime }}
                  </template>
                </template>
              </td>
              <!--
              <td
                :class="recordAndApply.earlyOverTime ? (recordAndApply.earlyOverApply ? (recordAndApply.earlyOverApply.isApproved ? 'table-success' : 'table-warning') : 'table-danger') : ''">
                <RouterLink v-if="recordAndApply.earlyOverTime" :to="{ name: 'apply-overtime' }">
                  {{ recordAndApply.earlyOverTime }}
                </RouterLink>
              </td>
              -->
              <td
                :class="recordAndApply.lateOverTime ? (recordAndApply.lateOverApply ? (recordAndApply.lateOverApply.isApproved ? 'table-success' : 'table-warning') : 'table-danger') : ''">
                <!-- その打刻が残業の場合 -->
                <template v-if="recordAndApply.lateOverTime">
                  <!-- 残業した本人か、早退の申請が起票済の場合、申請書画面へのリンクを作成する -->
                  <RouterLink
                    v-if="(recordAndApply.lateOverApply || recordAndApply.record.userAccount === store.userAccount) && recordAndApply.lateOverRouterLink"
                    :to="recordAndApply.lateOverRouterLink">
                    {{ recordAndApply.lateOverTime }}
                  </RouterLink>
                  <!-- それ以外の場合(残業した本人ではなく、かつ申請書も未起票の場合)単に残業時間を表示する -->
                  <template v-else>
                    {{ recordAndApply.lateOverTime }}
                  </template>
                </template>
              </td>
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
                    <li class="page-item" v-bind:class="{ disabled: recordAndApplyInfo.length <= limit }">
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