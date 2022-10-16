<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from 'vue-loading-overlay'
import { format, parse } from 'fecha';
import lodash from 'lodash';

import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const store = useSessionStore();

const TAB_NAME = {
  WORKINFO: 'WORKINFO',
  LEAVEINFO: 'LEAVEINFO'
} as const;
type TAB_NAME = typeof TAB_NAME[keyof typeof TAB_NAME];
const selectedTab = ref<TAB_NAME>(TAB_NAME.LEAVEINFO);
//const selectedRoundType = ref<'ceil' | 'floor' | 'round' | undefined>(undefined);
//const selectedRoundValue = ref(15);

//const recordInfos = ref<apiif.RecordResponseData[]>([]);
const checks = ref<boolean[]>([]);
const checkAll = ref(false);
watch(checkAll, () => {
  for (let i = 0; i < checks.value.length; i++) {
    checks.value[i] = checkAll.value;
  }
})

const limit = ref(10);
const offset = ref(0);

const baseDateFrom = new Date();
baseDateFrom.setMonth(3);
baseDateFrom.setDate(1);
if (baseDateFrom.getMonth() < 3) {
  baseDateFrom.setFullYear(baseDateFrom.getFullYear() - 1);
}
const baseDateTo = new Date(baseDateFrom);
baseDateTo.setMonth(2);
baseDateTo.setDate(31);
baseDateTo.setFullYear(baseDateTo.getFullYear() + 1);

const dateFrom = ref(format(baseDateFrom, 'YYYY-MM-DD'));
const dateTo = ref(format(baseDateTo, 'YYYY-MM-DD'));
const accountSearch = ref('');
const nameSearch = ref('');
const departmentSearch = ref('');
const sectionSearch = ref('');
const dayAmountSearch = ref<number>();
const isAccountSearchable = ref(false);
const isDepartmentSearchable = ref(false);
const isSectionSearchable = ref(false);
const isRoundEnabled = ref(true);
const roundMinutes = ref(15);

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

const UpdateOnSearch = async function () {
  offset.value = 0;
  await updateList();
}

async function UpdateOnSearchKeepOffset() {
  await updateList();
}

watch(dateFrom, lodash.debounce(UpdateOnSearch, 200));
watch(dateTo, lodash.debounce(UpdateOnSearch, 200));
watch(accountSearch, lodash.debounce(UpdateOnSearch, 200));
watch(nameSearch, lodash.debounce(UpdateOnSearch, 200));
watch(departmentSearch, lodash.debounce(UpdateOnSearch, 200));
watch(sectionSearch, lodash.debounce(UpdateOnSearch, 200));
watch(dayAmountSearch, lodash.debounce(UpdateOnSearch, 200));
watch(isRoundEnabled, lodash.debounce(UpdateOnSearchKeepOffset, 200));
watch(roundMinutes, lodash.debounce(UpdateOnSearchKeepOffset, 200));

const totalWorkTime = ref<apiif.TotalWorkTimeInfoResponseData[]>([]);
const annualLeaves = ref<apiif.TotalScheduledAnnualLeavesResponseData[]>([]);

const $loading = useLoading();
async function updateList() {

  const loader = $loading.show({ opacity: 0 });

  try {
    const access = await store.getTokenAccess();

    if (selectedTab.value === TAB_NAME.WORKINFO) {
      const totalWorkTimeInfo = await access.getTotalWorkTimeInfo({
        userAccount: accountSearch.value !== '' ? accountSearch.value : undefined,
        userName: nameSearch.value !== '' ? nameSearch.value : undefined,
        departmentName: departmentSearch.value !== '' ? departmentSearch.value : undefined,
        sectionName: sectionSearch.value !== '' ? sectionSearch.value : undefined,
        dateFrom: dateFrom.value !== '' ? (parse(dateFrom.value, 'isoDate') ?? undefined) : undefined,
        dateTo: dateTo.value !== '' ? (parse(dateTo.value, 'isoDate') ?? undefined) : undefined,
        roundMinutes: isRoundEnabled.value === true ? roundMinutes.value : undefined,
        //roundType: selectedRoundType.value,
        limit: limit.value + 1,
        offset: offset.value
      });

      if (totalWorkTimeInfo) {
        totalWorkTime.value.splice(0);
        for (const info of totalWorkTimeInfo) {
          totalWorkTime.value.push({ ...info });
        }
      }
      checks.value = Array.from({ length: totalWorkTime.value.length }, () => false);
    }

    else if (selectedTab.value === TAB_NAME.LEAVEINFO) {
      const annualLeavesInfo = await access.getTotalScheduledAnnualLeaves({
        userAccount: accountSearch.value !== '' ? accountSearch.value : undefined,
        userName: nameSearch.value !== '' ? nameSearch.value : undefined,
        departmentName: departmentSearch.value !== '' ? departmentSearch.value : undefined,
        sectionName: sectionSearch.value !== '' ? sectionSearch.value : undefined,
        date: parse(dateFrom.value, 'isoDate') ?? undefined,
        dayAmount: (typeof dayAmountSearch.value === 'number') ? dayAmountSearch.value : undefined,
        limit: limit.value + 1,
        offset: offset.value
      });

      if (annualLeavesInfo) {
        annualLeaves.value.splice(0);
        for (const info of annualLeavesInfo) {
          annualLeaves.value.push({ ...info });
        }
      }
      checks.value = Array.from({ length: annualLeaves.value.length }, () => false);
    }

  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }

  loader.hide();
}

onMounted(async () => {
  await updateList();
})

const selectedUserAccount = ref('');

async function onPageBack() {
  const backTo = offset.value - limit.value;
  offset.value = backTo > 0 ? backTo : 0;

  checkAll.value = false;

  await updateList();
}

async function onPageForward() {
  const forwardTo = offset.value + limit.value;
  offset.value = forwardTo > 0 ? forwardTo : 0;

  checkAll.value = false;

  await updateList();
}

async function onTabClick(tabName: TAB_NAME) {
  offset.value = 0;
  selectedTab.value = tabName;
  store.lastApplyListViewTab = tabName;

  checkAll.value = false;

  await updateList();
}

async function onSendNoticeLeaveMail() {
  if (confirm('チェックした全員に有給取得メールを送信しますか?')) {
    alert('メールを送信しました。');
  }
}

async function onSendNoticeOverTimeMail() {
  if (confirm('チェックした全員に残業注意メールを送信しますか?')) {
    alert('メールを送信しました。');
  }
}

async function onSendLateMail() {
  if (confirm('チェックした全員に遅刻・早退メールを送信しますか?')) {
    alert('メールを送信しました。');
  }
}

</script>

<template>

  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="勤怠状況一覧" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <div class="row justify-content-end p-2">
      <!--
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="button-export-csv" v-on:click="onExportCsv">CSVエクスポート</button>
      </div>
      -->
      <!--
      <div v-if="isAccountSearchable === true || isDepartmentSearchable === true" class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="button2">打刻追加</button>
      </div>
      -->
      <div class="dropdown d-grid gap-2 col-3">
        <button class="btn btn-primary dropdown-toggle" type="button" id="send-mail-to-users" data-bs-toggle="dropdown"
          :disabled="Object.values(checks).every(check => check === false)">
          チェックした従業員にメール送信
        </button>
        <ul class="dropdown-menu">
          <li v-if="selectedTab === TAB_NAME.LEAVEINFO"><button class="dropdown-item" type="button"
              v-on:click="onSendNoticeLeaveMail">有給取得メール送信</button>
          </li>
          <li v-if="selectedTab === TAB_NAME.WORKINFO"><button class="dropdown-item" type="button"
              v-on:click="onSendNoticeOverTimeMail">残業注意メール送信</button>
          </li>
          <li v-if="selectedTab === TAB_NAME.WORKINFO"><button class="dropdown-item" type="button"
              v-on:click="onSendLateMail">遅刻・早退注意メール送信</button>
          </li>
        </ul>
      </div>
      <div class="col-md-6">
        <div class="input-group">
          <span class="input-group-text">基準日で集計</span>
          <input class="form-control form-control-sm" type="date" v-model="dateFrom" />
          <template v-if="selectedTab === TAB_NAME.WORKINFO">
            〜 <input class="form-control form-control-sm" type="date" v-model="dateTo" />
          </template>
        </div>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-8">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <button :class="'nav-link' + ((selectedTab === TAB_NAME.LEAVEINFO) ? ' active' : '')"
              v-on:click="onTabClick(TAB_NAME.LEAVEINFO)">有給取得</button>
          </li>
          <li class="nav-item">
            <button :class="'nav-link' + ((selectedTab === TAB_NAME.WORKINFO) ? ' active' : '')"
              v-on:click="onTabClick(TAB_NAME.WORKINFO)">残業・勤務時間</button>
          </li>
        </ul>
      </div>
      <div class="col-4">
        <div class="input-group input-group-sm" v-if="selectedTab === TAB_NAME.WORKINFO">
          <div class="input-group input-group-sm mb-3">
            <div class="input-group-text">
              <input class="form-check-input mt-0" type="checkbox" id="round-enabled" v-model="isRoundEnabled">
            </div>
            <label class="input-group-text" for="round-enabled">各日の打刻時刻を丸めてから集計</label>
            <input type="number" class="form-control" min="1" step="1" max="59" v-model="roundMinutes"
              :disabled="isRoundEnabled === false">
            <span class="input-group-text">分</span>
          </div>
        </div>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-12 bg-white shadow-sm table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">ID</th>
              <th scope="col">氏名</th>
              <th scope="col">部門</th>
              <th scope="col">部署</th>
              <template v-if="selectedTab === TAB_NAME.LEAVEINFO">
                <th scope="col">有給付与</th>
                <th scope="col">有給取得</th>
                <th scope="col">有給残</th>
              </template>
              <template v-else-if="selectedTab === TAB_NAME.WORKINFO">
                <th scope="col">遅刻回数</th>
                <th scope="col">早退回数</th>
                <th scope="col">勤務時間</th>
                <th scope="col">早出時間</th>
                <th scope="col">残業時間</th>
              </template>
            </tr>
            <tr>
              <th scope="col">
                <input class="form-check-input" type="checkbox" id="checkboxall" v-model="checkAll" />
              </th>
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
                  :readonly="isDepartmentSearchable !== true" :disabled="isSectionSearchable !== true"
                  placeholder="部分一致" />
              </th>
              <template v-if="selectedTab === TAB_NAME.LEAVEINFO">
                <th scope="col"></th>
                <th scope="col" class="col-md-2">
                  <div class="input-group input-group-sm">
                    <input class="form-control form-control-sm" type="number" min="0" v-model="dayAmountSearch" />
                    <span class="input-group-text">日以下</span>
                  </div>
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-if="selectedTab === TAB_NAME.LEAVEINFO" v-for="(leave, index) in annualLeaves.slice(0, limit)">
              <th scope="row">
                <input class="form-check-input" type="checkbox" :id="'checkbox' + index" v-model="checks[index]" />
              </th>
              <td>{{ leave.userAccount }}</td>
              <td>{{ leave.userName }}</td>
              <td>{{ leave.departmentName }}</td>
              <td>{{ leave.sectionName }}</td>
              <td>{{ leave.dayAmount }}日</td>
              <td>{{ leave.dayAmountScheduled }}日</td>
              <td>{{ leave.dayAmount - leave.dayAmountScheduled }}日</td>
            </tr>
            <tr v-else-if="selectedTab === TAB_NAME.WORKINFO"
              v-for="(workInfo, index) in totalWorkTime.slice(0, limit)">
              <th scope="row">
                <input class="form-check-input" type="checkbox" :id="'checkbox' + index" v-model="checks[index]" />
              </th>
              <td>{{ workInfo.userAccount }}</td>
              <td>{{ workInfo.userName }}</td>
              <td>{{ workInfo.departmentName }}</td>
              <td>{{ workInfo.sectionName }}</td>
              <td>{{ workInfo.totalLateCount }}回</td>
              <td>{{ workInfo.totalEarlyLeaveCount }}回</td>
              <td>{{ workInfo.totalWorkTime.split(':', 2).join(':') ?? '' }}</td>
              <td>{{ workInfo.totalEarlyOverTime.split(':', 2).join(':') ?? '' }}</td>
              <td>{{ workInfo.totalLateOverTime.split(':', 2).join(':') ?? '' }}</td>
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
                    <li class="page-item"
                      v-bind:class="{ disabled: (selectedTab === TAB_NAME.LEAVEINFO ? annualLeaves.length : totalWorkTime.length) <= limit }">
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