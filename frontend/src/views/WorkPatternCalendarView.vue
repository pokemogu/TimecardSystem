<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
import * as backendAccess from '@/BackendAccess';

import WorkPatternCalendarEdit from '@/components/WorkPatternCalendarEdit.vue';
import { putErrorToDB } from '@/ErrorDB';

function dateToStr(date: Date) {
  return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
}

const router = useRouter();
const route = useRoute();
const store = useSessionStore();

const isModalOpened = ref(false);
const holidayInfos = ref<apiif.HolidayResponseData[]>([]);
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref((new Date().getMonth()) + 1);

const datesOfMonth = ref<Date[]>([]);

const userWorkPatternCalendars = ref<apiif.UserWorkPatternCalendarResponseData[]>([]);

async function updateTable() {
  const lastDayOfMonth = new Date(selectedYear.value, selectedMonth.value - 1 + 1, 0).getDate();
  datesOfMonth.value.splice(0);
  for (let i = 1; i <= lastDayOfMonth; i++) {
    datesOfMonth.value.push(new Date(selectedYear.value, selectedMonth.value - 1, i));
  }

  const fromDateStr = selectedYear.value + '-' + selectedMonth.value.toString().padStart(2, '0') + '-01';
  const toDateStr = selectedYear.value + '-' + selectedMonth.value.toString().padStart(2, '0') + '-' + lastDayOfMonth.toString().padStart(2, '0');

  try {
    const holidays = await backendAccess.getHolidays({ from: fromDateStr, to: toDateStr });
    if (holidays) {
      holidayInfos.value.splice(0);
      Array.prototype.push.apply(holidayInfos.value, holidays);
    }

    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      const userWorkPatternInfo = await access.getUserWorkPatternCalendar({ from: fromDateStr, to: toDateStr });
      if (userWorkPatternInfo) {
        userWorkPatternCalendars.value.splice(0);
        Array.prototype.push.apply(userWorkPatternCalendars.value, userWorkPatternInfo);
        console.log(userWorkPatternCalendars.value);
      }
    }
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
}

const defaultWorkPattern = ref<apiif.WorkPatternResponseData>();
const optional1WorkPattern = ref<apiif.WorkPatternResponseData>();
const optional2WorkPattern = ref<apiif.WorkPatternResponseData>();
const workPatterNames = ref<string[]>([]);

const selectedWorkPatternName = ref('');
const selectedDate = ref(new Date());

onMounted(async () => {
  const token = await store.getToken();
  if (token) {
    const access = new backendAccess.TokenAccess(token);
    const userInfo = await access.getUserInfo((route.params.account as string) ?? store.userAccount);
    if (userInfo) {
      if (userInfo.defaultWorkPatternName) {
        defaultWorkPattern.value = await access.getWorkPattern(userInfo.defaultWorkPatternName);
        workPatterNames.value.push(userInfo.defaultWorkPatternName);
      }
      if (userInfo.optional1WorkPatternName) {
        optional1WorkPattern.value = await access.getWorkPattern(userInfo.optional1WorkPatternName);
        workPatterNames.value.push(userInfo.optional1WorkPatternName);
      }
      if (userInfo.optional2WorkPatternName) {
        optional2WorkPattern.value = await access.getWorkPattern(userInfo.optional2WorkPatternName);
        workPatterNames.value.push(userInfo.optional2WorkPatternName);
      }
    }
  }
  await updateTable();
});

watch(selectedYear, async () => {
  await updateTable();
});

watch(selectedMonth, async () => {
  await updateTable();
});

async function onWorkPatternCalendarClick(date: Date) {
  const workPatternName = getWorkPatternNameOfDay(date);
  if (workPatternName) {
    selectedWorkPatternName.value = workPatternName;
  }
  else {
    selectedWorkPatternName.value = '';
  }
  selectedDate.value = new Date(date);
  isModalOpened.value = true;
}

async function onSubmit() {
  try {
    const token = await store.getToken();
    const access = new backendAccess.TokenAccess(token);
    if (token) {
      let workPatternName: string | null = null;
      if (!isHoliday(selectedDate.value)) {
        // 平日かつデフォルト勤務形態の場合は削除登録する
        if (selectedWorkPatternName.value === defaultWorkPattern.value?.name) {
          await access.deleteUserWorkPatternCalendar(dateToStr(selectedDate.value));
          await updateTable();
          return;
        }
        // 平日かつ勤務なしの場合はNULL登録する
        else if (selectedWorkPatternName.value === '') {
          workPatternName = null;
        }
        else {
          workPatternName = selectedWorkPatternName.value;
        }
      }
      else {
        // 休日かつ勤務なしの場合は削除登録する
        if (selectedWorkPatternName.value === '') {
          await access.deleteUserWorkPatternCalendar(dateToStr(selectedDate.value));
          await updateTable();
          return;
        }
        else {
          workPatternName = selectedWorkPatternName.value;
        }
      }

      await access.setUserWorkPatternCalendar({
        date: dateToStr(selectedDate.value),
        name: workPatternName //selectedWorkPatternName.value
      });
      await updateTable();
    }
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
}

function isHoliday(date: Date) {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  return holidayInfos.value.some(holiday => holiday.date === dateToStr(date));
}

function getDayOfWeekName(date: Date) {
  const dayOfWeekName = ['日', '月', '火', '水', '木', '金', '土'];

  if (holidayInfos.value.some(holiday => holiday.date === dateToStr(date))) {
    return '休';
  }
  else {
    return dayOfWeekName[date.getDay()];
  }
}

function getWorkPatternNameOfDay(date: Date) {
  const dateStr = dateToStr(date);
  const matchedWorkPattern = userWorkPatternCalendars.value.find(calendar => dateStr === calendar.date);

  return matchedWorkPattern?.workPattern === null ? '' : matchedWorkPattern?.workPattern.name;
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
      <WorkPatternCalendarEdit v-model:isOpened="isModalOpened"
        v-model:selectedWorkPatternName="selectedWorkPatternName" :workPatternNames="workPatterNames"
        v-on:submit="onSubmit" :date="selectedDate" :isHoliday="isHoliday(selectedDate)"></WorkPatternCalendarEdit>
    </Teleport>
    <div class="row justify-content-end p-2">
      <div class="col-md-3">
        <div class="input-group">
          <input class="form-control form-control-sm" type="number" min="1970" v-model="selectedYear" />
          <span class="input-group-text">年</span>
          <input class="form-control form-control-sm" type="number" min="1" max="12" v-model="selectedMonth" />
          <span class="input-group-text">月</span>
        </div>
      </div>
    </div>
    <div class="row justify-content-center m-2"></div>

    <div class="row justify-content-center m-2">
      <div v-for="n of 3" :key="n" :class="'col-' + Math.floor(12 / 3) + ' bg-white shadow-sm'">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">日付</th>
              <th scope="col">勤務体系</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(date, index) in datesOfMonth.slice((n - 1) * Math.ceil(31 / 3), n * Math.ceil(31 / 3))"
              :class="isHoliday(date) ? 'table-danger' : 'table-primary'">
              <td>
                <button type="button" class="btn btn-link" v-on:click="onWorkPatternCalendarClick(date)">{{
                    `${date.getMonth() + 1}/${date.getDate()}(${getDayOfWeekName(date)})`
                }}</button>
              </td>
              <td class="text-start">{{ getWorkPatternNameOfDay(date) }}</td>
            </tr>
          </tbody>
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