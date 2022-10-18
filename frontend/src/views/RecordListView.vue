<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { useLoading } from 'vue-loading-overlay'
import FileSaver from 'file-saver';
import { stringify } from 'csv/browser/esm/sync';
import { format, parse } from 'fecha';

import { useSessionStore } from '@/stores/session';
import Cookies from 'js-cookie';

import lodash from 'lodash';

import Header from '@/components/Header.vue';
import LayoutEditButtonView from '@/components/TableLayoutEditButton.vue'
import RecordEdit from '@/components/RecordEdit.vue';

import type * as apiif from 'shared/APIInterfaces';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const store = useSessionStore();

interface RecordAndApllyInfo {
  record: apiif.RecordResponseData,
  applies?: apiif.ApplyResponseData[],

  earlyLeaveTime?: string,
  earlyLeaveApply?: apiif.ApplyResponseData,
  earlyLeaveRouterLink?: RouteLocationRaw,
  earlyLeaveApplyTime?: string,
  earlyLeaveApplyDescription?: string,

  latenessTime?: string,
  latenessApply?: apiif.ApplyResponseData,
  latenessRouterLink?: RouteLocationRaw,
  latenessApplyTime?: string,
  latenessApplyDescription?: string,

  earlyOverTime?: string,
  earlyOverApply?: apiif.ApplyResponseData,
  earlyOverRouterLink?: RouteLocationRaw,
  earlyOverApplyTime?: string,
  earlyOverApplyDescription?: string,

  lateOverTime?: string,
  lateOverApply?: apiif.ApplyResponseData,
  lateOverRouterLink?: RouteLocationRaw,
  lateOverApplyTime?: string,
  lateOverApplyDescription?: string,

  leaveType?: string
}

const recordAndApplyInfo = ref<RecordAndApllyInfo[]>([]);

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

const deviceSearch = ref('');
const clockinSearch = ref('');
const stepoutSearch = ref('');
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

async function UpdateOnSearch() {
  offset.value = 0;
  await updateRecordListView();
}

async function UpdateOnSearchKeepOffset() {
  await updateRecordListView();
}

watch(dateFrom, lodash.debounce(UpdateOnSearch, 200));
watch(dateTo, lodash.debounce(UpdateOnSearch, 200));
watch(accountSearch, lodash.debounce(UpdateOnSearch, 200));
watch(nameSearch, lodash.debounce(UpdateOnSearch, 200));
watch(departmentSearch, lodash.debounce(UpdateOnSearch, 200));
watch(sectionSearch, lodash.debounce(UpdateOnSearch, 200));
watch(deviceSearch, lodash.debounce(UpdateOnSearch, 200));
watch(clockinSearch, lodash.debounce(UpdateOnSearch, 200));
watch(stepoutSearch, lodash.debounce(UpdateOnSearch, 200));
watch(reenterSearch, lodash.debounce(UpdateOnSearch, 200));
watch(clockoutSearch, lodash.debounce(UpdateOnSearch, 200));
watch(isRoundEnabled, lodash.debounce(UpdateOnSearchKeepOffset, 200));
watch(roundMinutes, lodash.debounce(UpdateOnSearchKeepOffset, 200));

// テーブルレイアウトのカスタマイズ
const columnNames = ref<string[]>([
  '打刻日', 'ID', '氏名', '部門', '部署', '端末', '出勤', '外出', '再入', '退勤', '遅刻', '早退', '残業', '休憩',
  '休暇', '遅刻申請内容', '遅刻申請状況', '早退申請内容', '早退申請状況', '残業申請内容', '残業申請状況'
]);
const defaultLayout = ref<{ name: string, columnIndices: number[] }>({
  name: '標準レイアウト',
  columnIndices: [
    columnNames.value.findIndex(column => column === '打刻日'),
    columnNames.value.findIndex(column => column === 'ID'),
    columnNames.value.findIndex(column => column === '氏名'),
    columnNames.value.findIndex(column => column === '部門'),
    columnNames.value.findIndex(column => column === '部署'),
    columnNames.value.findIndex(column => column === '端末'),
    columnNames.value.findIndex(column => column === '出勤'),
    columnNames.value.findIndex(column => column === '外出'),
    columnNames.value.findIndex(column => column === '再入'),
    columnNames.value.findIndex(column => column === '退勤'),
    columnNames.value.findIndex(column => column === '遅刻'),
    columnNames.value.findIndex(column => column === '早退'),
    columnNames.value.findIndex(column => column === '残業'),
    columnNames.value.findIndex(column => column === '休憩'),
    columnNames.value.findIndex(column => column === '休暇'),
    columnNames.value.findIndex(column => column === '遅刻申請内容'),
    columnNames.value.findIndex(column => column === '遅刻申請状況'),
    columnNames.value.findIndex(column => column === '早退申請内容'),
    columnNames.value.findIndex(column => column === '早退申請状況'),
    columnNames.value.findIndex(column => column === '残業申請内容'),
    columnNames.value.findIndex(column => column === '残業申請状況')
  ]
});
const layouts = ref<{ name: string, columnIndices: number[] }[]>([]);
const selectedLayout = ref<{ name: string, columnIndices: number[] }>(defaultLayout.value);
const isMounted = ref(false);

watch(selectedLayout, function () {
  if (selectedLayout.value === defaultLayout.value) {
    Cookies.remove('selectedTableLayoutNameRecordList', { path: '' }); // デフォルトレイアウトの場合は設定削除する
  } else {
    Cookies.set('selectedTableLayoutNameRecordList', selectedLayout.value.name, { expires: 3650, path: '' });
  }
});

function onLayoutSubmit() {
  Cookies.set('tableLayoutsRecordList', JSON.stringify(layouts.value), { expires: 3650, path: '' });
}

onMounted(async function () {
  const savedLayoutJson = Cookies.get('tableLayoutsRecordList');
  if (savedLayoutJson) {
    layouts.value = JSON.parse(savedLayoutJson);
  }

  const savedDefaultLayoutName = Cookies.get('selectedTableLayoutNameRecordList');
  if (savedDefaultLayoutName) {
    const savedDefaultLayout = layouts.value.find(layout => layout.name === savedDefaultLayoutName);
    if (savedDefaultLayout) {
      selectedLayout.value = savedDefaultLayout;
    }
  }
  await updateRecordListView();
  isMounted.value = true;
});

// 共通関数
const $loading = useLoading();

async function getRecordList(searchOptions?: {
  account?: string, name?: string, department?: string, section?: string, device?: string, dateFrom?: Date, dateTo?: Date,
  clockin?: boolean, stepout?: boolean, reenter?: boolean, clockout?: boolean, limit?: number, offset?: number,
  roundMinutes?: number
}) {
  const recordAndApplyInfoValue: RecordAndApllyInfo[] = []

  const access = await store.getTokenAccess();
  const records = await access.getRecordAndApplyList({
    byUserAccount: searchOptions?.account !== '' ? searchOptions?.account : undefined,
    byUserName: searchOptions?.name !== '' ? searchOptions?.name : undefined,
    byDepartment: searchOptions?.department !== '' ? searchOptions?.department : undefined,
    bySection: searchOptions?.section !== '' ? searchOptions?.section : undefined,
    byDevice: searchOptions?.device !== '' ? searchOptions?.device : undefined,
    from: searchOptions?.dateFrom ? searchOptions.dateFrom.toLocaleDateString() : undefined,
    to: searchOptions?.dateTo ? searchOptions.dateTo.toLocaleDateString() : undefined,
    clockin: searchOptions?.clockin,
    stepout: searchOptions?.stepout,
    reenter: searchOptions?.reenter,
    clockout: searchOptions?.clockout,
    limit: searchOptions?.limit ? searchOptions.limit + 1 : undefined,
    offset: searchOptions?.offset,
    selectAllDays: true,
    roundMinutes: searchOptions?.roundMinutes
  });

  if (records) {
    Array.prototype.push.apply(recordAndApplyInfoValue, records.map(record => { return { record: record, applies: record.applies } }));

    // 打刻実績に対応した各種申請の検索
    if (records.length > 0) {
      for (const recordAndApply of recordAndApplyInfoValue) {
        if (recordAndApply.applies && recordAndApply.applies.length > 0) {
          // その日の早退・遅刻・早出・残業について複数の申請がある場合は、
          // 最新の申請を有効なものとする。
          const existingEarlyLeaveApplies = recordAndApply.applies.filter(apply => apply.type.name === 'leave-early');
          if (existingEarlyLeaveApplies.length > 0) {
            recordAndApply.earlyLeaveApply = existingEarlyLeaveApplies.reduce((prev, cur) => cur.timestamp > prev.timestamp ? cur : prev);
          }

          const existingLatenessApplies = recordAndApply.applies.filter(apply => apply.type.name === 'lateness');
          if (existingLatenessApplies.length > 0) {
            recordAndApply.latenessApply = existingLatenessApplies.reduce((prev, cur) => cur.timestamp > prev.timestamp ? cur : prev);
          }

          const existingEarlyOverApplies = recordAndApply.applies.filter(apply => apply.type.name === 'overtime'); // 早出は実装未定
          if (existingEarlyOverApplies.length > 0) {
            recordAndApply.earlyOverApply = existingEarlyOverApplies.reduce((prev, cur) => cur.timestamp > prev.timestamp ? cur : prev);
          }

          const existingLateOverApplies = recordAndApply.applies.filter(apply => apply.type.name === 'overtime');
          if (existingLateOverApplies.length > 0) {
            recordAndApply.lateOverApply = existingLateOverApplies.reduce((prev, cur) => cur.timestamp > prev.timestamp ? cur : prev);
          }
        }
      }
      //}
    }
  }

  for (const recordAndApply of recordAndApplyInfoValue) {
    // 遅刻・早退・早出・残業時間の算出
    if (recordAndApply.record.earlyOverTimeSeconds && recordAndApply.record.earlyOverTimeSeconds <= -60) {
      recordAndApply.latenessTime = secondsToTimeStr(Math.abs(recordAndApply.record.earlyOverTimeSeconds));
      if (recordAndApply.record.clockin?.timestamp && recordAndApply.record.onTimeStart) {
        recordAndApply.latenessTime =
          format(recordAndApply.record.onTimeStart, 'H:mm') + '〜' +
          format(recordAndApply.record.clockin?.timestamp, 'H:mm')
      }
    }
    if (recordAndApply.record.lateOverTimeSeconds && recordAndApply.record.lateOverTimeSeconds <= -60) {
      recordAndApply.earlyLeaveTime = secondsToTimeStr(Math.abs(recordAndApply.record.lateOverTimeSeconds), false);
      if (recordAndApply.record.clockout?.timestamp && recordAndApply.record.onTimeEnd) {
        recordAndApply.earlyLeaveTime =
          format(recordAndApply.record.clockout?.timestamp, 'H:mm') + '〜' +
          format(recordAndApply.record.onTimeEnd, 'H:mm')
      }
    }
    if (recordAndApply.record.earlyOverTimeSeconds && recordAndApply.record.earlyOverTimeSeconds >= 60) {
      recordAndApply.earlyOverTime = secondsToTimeStr(recordAndApply.record.earlyOverTimeSeconds, false);
      if (recordAndApply.record.clockin?.timestamp && recordAndApply.record.onTimeStart) {
        recordAndApply.earlyOverTime =
          format(recordAndApply.record.clockin?.timestamp, 'H:mm') + '〜' +
          format(recordAndApply.record.onTimeStart, 'H:mm')
      }
    }
    if (recordAndApply.record.lateOverTimeSeconds && recordAndApply.record.lateOverTimeSeconds >= 60) {
      recordAndApply.lateOverTime = secondsToTimeStr(recordAndApply.record.lateOverTimeSeconds);
      if (recordAndApply.record.clockout?.timestamp && recordAndApply.record.onTimeEnd) {
        recordAndApply.lateOverTime =
          format(recordAndApply.record.onTimeEnd, 'H:mm') + '〜' +
          format(recordAndApply.record.clockout?.timestamp, 'H:mm')
      }
    }

    // 申請書起票リンク
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

    // 申請書回付状況
    const getApplyDescription = function (apply: apiif.ApplyResponseData | undefined) {
      if (!apply) {
        return [undefined, '未起票'];
      }
      const timeDesciption = format(apply.dateTimeFrom, 'H:mm') + '〜' + format(apply.dateTimeTo!, 'H:mm');

      if (apply.isApproved === true) {
        return [timeDesciption, '全承認済' + format(apply.timestamp, 'M/D H:mm')];
      }

      if (apply.approvedLevel3User && apply.approvedLevel3Timestamp) {
        return [timeDesciption, '承認3済' + format(apply.approvedLevel3Timestamp, 'M/D H:mm') + apply.approvedLevel3User.name];
      }
      else if (apply.approvedLevel2User && apply.approvedLevel2Timestamp) {
        return [timeDesciption, '承認2済' + format(apply.approvedLevel2Timestamp, 'M/D H:mm') + apply.approvedLevel2User.name];
      }
      else if (apply.approvedLevel1User && apply.approvedLevel1Timestamp) {
        return [timeDesciption, '承認1済' + format(apply.approvedLevel1Timestamp, 'M/D H:mm') + apply.approvedLevel1User.name];
      }
      else {
        return [timeDesciption, '起票済' + format(apply.timestamp, 'M/D H:mm')];
      }
    };

    if (recordAndApply.latenessTime) {
      [recordAndApply.latenessApplyTime, recordAndApply.latenessApplyDescription] = getApplyDescription(recordAndApply.latenessApply);
    }
    if (recordAndApply.earlyLeaveTime) {
      [recordAndApply.earlyLeaveApplyTime, recordAndApply.earlyLeaveApplyDescription] = getApplyDescription(recordAndApply.earlyLeaveApply);
    }
    if (recordAndApply.earlyOverTime) {
      [recordAndApply.earlyOverApplyTime, recordAndApply.earlyOverApplyDescription] = getApplyDescription(recordAndApply.earlyOverApply);
    }
    if (recordAndApply.lateOverTime) {
      [recordAndApply.lateOverApplyTime, recordAndApply.lateOverApplyDescription] = getApplyDescription(recordAndApply.lateOverApply);
    }

    // 休暇
    if (recordAndApply.record.leaveType) {
      switch (recordAndApply.record.leaveType) {
        case 'leave':
          recordAndApply.leaveType = '有給';
          break;
        case 'am-leave':
          recordAndApply.leaveType = '午前';
          break;
        case 'pm-leave':
          recordAndApply.leaveType = '午後';
          break;
        case 'makeup-leave':
          recordAndApply.leaveType = '代休';
          break;
        case 'mourning-leave':
          recordAndApply.leaveType = '慶弔';
          break;
        case 'measure-leave':
          recordAndApply.leaveType = '措置';
          break;
      }
    }

  }

  return recordAndApplyInfoValue;
}

async function getRecordListBySearchForm(enableLimit = true) {

  const searchOptions = {
    account: accountSearch.value !== '' ? accountSearch.value : undefined,
    name: nameSearch.value !== '' ? nameSearch.value : undefined,
    department: departmentSearch.value !== '' ? departmentSearch.value : undefined,
    section: sectionSearch.value !== '' ? sectionSearch.value : undefined,
    device: deviceSearch.value !== '' ? deviceSearch.value : undefined,
    dateFrom: dateFrom.value !== '' ? new Date(dateFrom.value) : undefined,
    dateTo: dateTo.value !== '' ? new Date(dateTo.value) : undefined,
    clockin: clockinSearch.value === 'notRecorded' ? false : (clockinSearch.value === 'recorded' ? true : undefined),
    stepout: stepoutSearch.value === 'notRecorded' ? false : (stepoutSearch.value === 'recorded' ? true : undefined),
    reenter: reenterSearch.value === 'notRecorded' ? false : (reenterSearch.value === 'recorded' ? true : undefined),
    clockout: clockoutSearch.value === 'notRecorded' ? false : (clockoutSearch.value === 'recorded' ? true : undefined),
    limit: enableLimit ? limit.value : undefined,
    offset: enableLimit ? offset.value : undefined,
    roundMinutes: isRoundEnabled.value === true ? roundMinutes.value : undefined
  };

  return await getRecordList(searchOptions);
}

async function updateRecordListView() {

  const loader = $loading.show({ opacity: 0 });

  try {
    const recordAndApplyList = await getRecordListBySearchForm(true);
    recordAndApplyInfo.value.splice(0);
    Array.prototype.push.apply(recordAndApplyInfo.value, recordAndApplyList);

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

  const configRoundMinutesStr = await access.getSystemConfigValue('defaultRoundMinutes');
  if (configRoundMinutesStr) {
    const configRoundMinutes = parseInt(configRoundMinutesStr);
    if (!isNaN(configRoundMinutes)) {
      roundMinutes.value = configRoundMinutes;
    }
  }

  await updateRecordListView();
})

const selectedUserAccount = ref('');
const selectedRecordDate = ref<Date>();
const selectedClockinTime = ref<Date>();
const selectedStepoutTime = ref<Date>();
const selectedReenterTime = ref<Date>();
const selectedClockoutTime = ref<Date>();

async function onPageBack() {
  const backTo = offset.value - limit.value;
  offset.value = backTo > 0 ? backTo : 0;
  await updateRecordListView();
}

async function onPageForward() {
  const forwardTo = offset.value + limit.value;
  offset.value = forwardTo > 0 ? forwardTo : 0;
  await updateRecordListView();
}

async function onExportCsv() {
  try {
    const loader = $loading.show({ opacity: 0 });

    const recordAndApplyList = await getRecordListBySearchForm(false);
    if (recordAndApplyList) {
      const recordCsvData = recordAndApplyList.map(recordAndApply => {
        const record = recordAndApply.record;
        return {
          '打刻日': new Date(record.date).toLocaleDateString(),
          'ID': record.userAccount,
          '氏名': record.userName,
          '部門': record.userDepartment,
          '部署': record.userSection,
          '端末': record.clockin?.deviceName,
          '出勤': record.clockin?.timestamp ? format(record.clockin.timestamp, 'YYYY/MM/DD HH:mm:ss') : undefined,
          '外出': record.stepout?.timestamp ? format(record.stepout.timestamp, 'YYYY/MM/DD HH:mm:ss') : undefined,
          '再入': record.reenter?.timestamp ? format(record.reenter.timestamp, 'YYYY/MM/DD HH:mm:ss') : undefined,
          '退勤': record.clockout?.timestamp ? format(record.clockout.timestamp, 'YYYY/MM/DD HH:mm:ss') : undefined,
          '休憩': record.breakPeriodMinutes ?? '',
          '休暇': recordAndApply.leaveType ?? '',
          '遅刻': recordAndApply.latenessTime ?? '',
          '早退': recordAndApply.earlyLeaveTime ?? '',
          '残業': recordAndApply.lateOverTime ?? '',
          '遅刻申請内容': recordAndApply.latenessApplyTime ?? '',
          '遅刻申請状況': recordAndApply.latenessApplyDescription ?? '',
          '早退申請内容': recordAndApply.earlyLeaveApplyTime ?? '',
          '早退申請状況': recordAndApply.earlyLeaveApplyDescription ?? '',
          '残業申請内容': recordAndApply.lateOverApplyTime ?? '',
          '残業申請状況': recordAndApply.lateOverApplyDescription ?? ''
        }
      });
      const recordCsvString = stringify(recordCsvData, {
        bom: true,
        header: true,
        columns: selectedLayout.value.columnIndices.map(columnIndex => ({ key: columnNames.value[columnIndex] }))
      });
      const blob = new Blob([recordCsvString], { type: 'text/csv;charset=utf-8' });
      FileSaver.saveAs(blob, 'record' + format(new Date(), 'YYYYMMDDHHmmss') + '.csv');
    }

    loader.hide();
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
}

async function onRecordClick(params: { account: string, date: Date, clockin?: Date, stepout?: Date, reenter?: Date, clockout?: Date }) {
  selectedUserAccount.value = params.account;
  selectedRecordDate.value = new Date(params.date);
  selectedClockinTime.value = (params.clockin ? new Date(params.clockin) : undefined);
  selectedStepoutTime.value = params.stepout ? new Date(params.stepout) : undefined;
  selectedReenterTime.value = params.reenter ? new Date(params.reenter) : undefined;
  selectedClockoutTime.value = params.clockout ? new Date(params.clockout) : undefined;

  const loader = $loading.show({ opacity: 0 });
  const record = await (await store.getTokenAccess()).getRecords({ byUserAccount: params.account, from: format(params.date, 'isoDate') });
  loader.hide();
  if (record && record.length > 0) {
    selectedClockinTime.value = record[0].clockin?.timestamp;
    selectedStepoutTime.value = record[0].stepout?.timestamp;
    selectedReenterTime.value = record[0].reenter?.timestamp;
    selectedClockoutTime.value = record[0].clockout?.timestamp;
  }

  isModalOpened.value = true;
}

function onAddRecord() {
  selectedUserAccount.value = '';
  selectedRecordDate.value = undefined;
  selectedClockinTime.value = undefined;
  selectedStepoutTime.value = undefined;
  selectedReenterTime.value = undefined;
  selectedClockoutTime.value = undefined;

  isModalOpened.value = true;
}

async function onRecordEditSubmit() {
  const access = await store.getTokenAccess();

  if (selectedClockinTime.value) {
    await access.submitRecord('clockin', { account: selectedUserAccount.value, timestamp: selectedClockinTime.value });
  }
  if (selectedStepoutTime.value) {
    await access.submitRecord('stepout', { account: selectedUserAccount.value, timestamp: selectedStepoutTime.value });
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
  selectedStepoutTime.value = undefined;
  selectedReenterTime.value = undefined;
  selectedClockoutTime.value = undefined;

  await updateRecordListView();
}

const isToday = (date: Date) => {
  const today = new Date()
  return date.getDate() == today.getDate() &&
    date.getMonth() == today.getMonth() &&
    date.getFullYear() == today.getFullYear()
};

function getStyleClassForCell(columnName: string, recordAndApply: RecordAndApllyInfo) {
  switch (columnName) {
    case '遅刻申請内容':
      return (recordAndApply.latenessTime && recordAndApply.latenessApplyTime) ? (recordAndApply.latenessTime === recordAndApply.latenessApplyTime ? 'table-success' : 'table-warning text-danger') : '';
    case '早退申請内容':
      return (recordAndApply.earlyLeaveTime && recordAndApply.earlyLeaveApplyTime) ? (recordAndApply.earlyLeaveTime === recordAndApply.earlyLeaveApplyTime ? 'table-success' : 'table-warning text-danger') : '';
    case '残業申請内容':
      return (recordAndApply.lateOverTime && recordAndApply.lateOverApplyTime) ? (recordAndApply.lateOverTime === recordAndApply.lateOverApplyTime ? 'table-success' : 'table-warning text-danger') : '';

    case '遅刻申請状況':
      return recordAndApply.latenessTime ? (recordAndApply.latenessApply ? (recordAndApply.latenessApply.isApproved ? 'table-success' : 'table-warning') : 'table-danger') : '';
    case '早退申請状況':
      return recordAndApply.earlyLeaveTime ? (recordAndApply.earlyLeaveApply ? (recordAndApply.earlyLeaveApply.isApproved ? 'table-success' : 'table-warning') : 'table-danger') : '';
    case '残業申請状況':
      return recordAndApply.lateOverTime ? (recordAndApply.lateOverApply ? (recordAndApply.lateOverApply.isApproved ? 'table-success' : 'table-warning') : 'table-danger') : '';

    case '休暇':
      if (recordAndApply.leaveType) {
        return 'table-success';
      }
      break;
    case '退勤':
      // 出勤打刻がされているが退勤打刻がされていない場合
      if (recordAndApply.record.clockin && !recordAndApply.record.clockout) {
        if (isToday(recordAndApply.record.date)) {
          return 'table-warning';
        }
        else if (recordAndApply.record.date < new Date()) {
          return 'table-danger';
        }
      }
      break;
    case '再入':
      // 出勤打刻がされているが退勤打刻がされていない場合
      if (recordAndApply.record.stepout && !recordAndApply.record.reenter) {
        if (isToday(recordAndApply.record.date)) {
          return 'table-warning';
        }
        else if (recordAndApply.record.date < new Date()) {
          return 'table-danger';
        }
      }
      break;
    default:
      return '';
  }
}

</script>

<template>

  <Teleport to="body" v-if="isModalOpened">
    <RecordEdit v-model:isOpened="isModalOpened" v-model:account="selectedUserAccount" v-model:date="selectedRecordDate"
      v-model:clockin="selectedClockinTime" v-model:stepout="selectedStepoutTime" v-model:reenter="selectedReenterTime"
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
      <div class="d-grid gap-2 col-3">
        <LayoutEditButtonView v-if="isMounted" :columnNames="columnNames" v-model:layouts="layouts"
          v-model:selectedLayout="selectedLayout" :defaultLayout="defaultLayout" v-on:submit="onLayoutSubmit">
        </LayoutEditButtonView>
      </div>
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="button-export-csv" v-on:click="onExportCsv">CSVエクスポート</button>
      </div>
      <div v-if="isAccountSearchable === true || isDepartmentSearchable === true" class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="button2" v-on:click="onAddRecord">打刻追加</button>
      </div>
      <div class="col-md-5">
        <div class="input-group">
          <span class="input-group-text">打刻日で検索</span>
          <input class="form-control form-control-sm" type="date" v-model="dateFrom" />〜
          <input class="form-control form-control-sm" type="date" v-model="dateTo" />
        </div>
      </div>
    </div>

    <div class="row justify-content-end">
      <div class="col-2">
        <div class="input-group input-group-sm mb-3">
          <div class="input-group-text">
            <input class="form-check-input mt-0" type="checkbox" id="round-enabled" v-model="isRoundEnabled">
          </div>
          <label class="input-group-text" for="round-enabled">丸め</label>
          <input type="number" class="form-control" min="1" step="1" max="59" v-model="roundMinutes"
            :disabled="isRoundEnabled === false">
          <span class="input-group-text">分</span>
        </div>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="record-table">
        <div class="col-12 bg-white shadow-sm table-responsive">
          <table class="table" v-if="isMounted">
            <thead>
              <tr>
                <th scope="col"></th>
                <th v-for="columnIndex in selectedLayout.columnIndices" scope="col">{{ columnNames[columnIndex] }}</th>
              </tr>
              <tr>
                <th scope="col"></th>
                <th v-for="columnIndex in selectedLayout.columnIndices" scope="col">

                  <input v-if="columnNames[columnIndex] === 'ID'" class="form-control form-control-sm" type="text"
                    size="3" v-model="accountSearch" :readonly="isAccountSearchable !== true"
                    :disabled="isAccountSearchable !== true" placeholder="完全一致" />

                  <input v-else-if="columnNames[columnIndex] === '氏名'" class="form-control form-control-sm" type="text"
                    size="3" v-model="nameSearch" placeholder="部分一致" />

                  <input v-else-if="columnNames[columnIndex] === '部門'" class="form-control form-control-sm" type="text"
                    size="3" v-model="departmentSearch" :readonly="isDepartmentSearchable !== true"
                    :disabled="isDepartmentSearchable !== true" placeholder="部分一致" />

                  <input v-else-if="columnNames[columnIndex] === '部署'" class="form-control form-control-sm" type="text"
                    size="3" v-model="sectionSearch" :readonly="isSectionSearchable !== true"
                    :disabled="isSectionSearchable !== true" placeholder="部分一致" />

                  <select v-else-if="columnNames[columnIndex] === '端末'" class="form-select form-select-sm"
                    v-model="deviceSearch">
                    <option value="">全て</option>
                    <option v-for="(deviceName, index) of deviceNames" :value="deviceName">{{ deviceName }}</option>
                  </select>

                  <select v-else-if="columnNames[columnIndex] === '出勤'" class="form-select form-select-sm"
                    v-model="clockinSearch">
                    <option selected></option>
                    <option value="notRecorded">未打刻</option>
                    <option value="recorded">打刻済</option>
                  </select>

                  <select v-else-if="columnNames[columnIndex] === '外出'" class="form-select form-select-sm"
                    v-model="stepoutSearch">
                    <option selected></option>
                    <option value="notRecorded">未打刻</option>
                    <option value="recorded">打刻済</option>
                  </select>

                  <select v-else-if="columnNames[columnIndex] === '再入'" class="form-select form-select-sm"
                    v-model="reenterSearch">
                    <option selected></option>
                    <option value="notRecorded">未打刻</option>
                    <option value="recorded">打刻済</option>
                  </select>

                  <select v-else-if="columnNames[columnIndex] === '退勤'" class="form-select form-select-sm"
                    v-model="clockoutSearch">
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
                <td v-for="columnIndex in selectedLayout.columnIndices"
                  :class="getStyleClassForCell(columnNames[columnIndex], recordAndApply)">

                  <template v-if="columnNames[columnIndex] === '打刻日'">
                    <button v-if="isAccountSearchable === true || isDepartmentSearchable === true" type="button"
                      class="btn btn-link" v-on:click="onRecordClick({
                        account: recordAndApply.record.userAccount, date: new Date(recordAndApply.record.date),
                        clockin: recordAndApply.record.clockin?.timestamp,
                        stepout: recordAndApply.record.stepout?.timestamp,
                        reenter: recordAndApply.record.reenter?.timestamp,
                        clockout: recordAndApply.record.clockout?.timestamp,
                      })">
                      {{ recordAndApply.record.date ? new Date(recordAndApply.record.date).toLocaleDateString() : '' }}
                    </button>
                    <template v-else>{{ recordAndApply.record.date ? new
                    Date(recordAndApply.record.date).toLocaleDateString() : ''
                    }}</template>
                  </template>

                  <span v-else-if="columnNames[columnIndex] === 'ID'">{{ recordAndApply.record.userAccount }}</span>
                  <span v-else-if="columnNames[columnIndex] === '氏名'">{{ recordAndApply.record.userName }}</span>
                  <span v-else-if="columnNames[columnIndex] === '部門'">{{ recordAndApply.record.userDepartment }}</span>
                  <span v-else-if="columnNames[columnIndex] === '部署'">{{ recordAndApply.record.userSection }}</span>
                  <span v-else-if="columnNames[columnIndex] === '端末'">{{ recordAndApply.record.clockin?.deviceName ?? ''
                  }}</span>
                  <span v-else-if="columnNames[columnIndex] === '出勤'">{{
                  recordAndApply.record.clockin?.timestamp.toLocaleTimeString().split(':', 2).join(':') ?? ''
                  }}</span>
                  <span v-else-if="columnNames[columnIndex] === '外出'">{{
                  recordAndApply.record.stepout?.timestamp.toLocaleTimeString().split(':', 2).join(':') ?? ''
                  }}</span>
                  <span v-else-if="columnNames[columnIndex] === '再入'">{{
                  recordAndApply.record.reenter?.timestamp.toLocaleTimeString().split(':', 2).join(':') ?? ''
                  }}</span>
                  <span v-else-if="columnNames[columnIndex] === '退勤'">{{
                  recordAndApply.record.clockout?.timestamp.toLocaleTimeString().split(':', 2).join(':') ?? ''
                  }}</span>

                  <span v-else-if="columnNames[columnIndex] === '休憩'">{{ recordAndApply.record.breakPeriodMinutes ?
                  recordAndApply.record.breakPeriodMinutes + '分'
                  : ''}}</span>
                  <span v-else-if="columnNames[columnIndex] === '休暇'">{{ recordAndApply.leaveType ?? '' }}</span>

                  <!-- 遅刻 -->
                  <template v-else-if="columnNames[columnIndex] === '遅刻'">
                    {{ recordAndApply.latenessTime }}
                  </template>

                  <span v-else-if="columnNames[columnIndex] === '遅刻申請内容'">
                    {{ recordAndApply.latenessApplyTime }}
                  </span>

                  <span v-else-if="columnNames[columnIndex] === '遅刻申請状況'">
                    <!-- その打刻が遅刻の場合 -->
                    <template v-if="recordAndApply.latenessTime">
                      <!-- 遅刻した本人か、遅刻の申請が起票済の場合、申請書画面へのリンクを作成する -->
                      <RouterLink
                        v-if="(recordAndApply.latenessApply || recordAndApply.record.userAccount === store.userAccount) && recordAndApply.latenessRouterLink"
                        :to="recordAndApply.latenessRouterLink">
                        {{ recordAndApply.latenessApplyDescription }}
                      </RouterLink>
                      <!-- それ以外の場合(遅刻した本人ではなく、かつ申請書も未起票の場合)単に遅刻時間を表示する -->
                      <template v-else>
                        {{ recordAndApply.latenessApplyDescription }}
                      </template>
                    </template>
                  </span>

                  <!-- 早退 -->
                  <template v-else-if="columnNames[columnIndex] === '早退'">
                    {{ recordAndApply.earlyLeaveTime }}
                  </template>

                  <span v-else-if="columnNames[columnIndex] === '早退申請内容'">
                    {{ recordAndApply.earlyLeaveApplyTime }}
                  </span>

                  <template v-else-if="columnNames[columnIndex] === '早退申請状況'">
                    <!-- その打刻が早退の場合 -->
                    <template v-if="recordAndApply.earlyLeaveTime">
                      <!-- 早退した本人か、早退の申請が起票済の場合、申請書画面へのリンクを作成する -->
                      <RouterLink
                        v-if="(recordAndApply.earlyLeaveApply || recordAndApply.record.userAccount === store.userAccount) && recordAndApply.earlyLeaveRouterLink"
                        :to="recordAndApply.earlyLeaveRouterLink">
                        {{ recordAndApply.earlyLeaveApplyDescription }}
                      </RouterLink>
                      <!-- それ以外の場合(遅刻した本人ではなく、かつ申請書も未起票の場合)単に早退時間を表示する -->
                      <template v-else>
                        {{ recordAndApply.earlyLeaveApplyDescription }}
                      </template>
                    </template>
                  </template>

                  <!-- 残業 -->
                  <template v-else-if="columnNames[columnIndex] === '残業'">
                    {{ recordAndApply.lateOverTime }}
                  </template>

                  <span v-else-if="columnNames[columnIndex] === '残業申請内容'">
                    {{ recordAndApply.lateOverApplyTime }}
                  </span>

                  <template v-else-if="columnNames[columnIndex] === '残業申請状況'">
                    <!-- その打刻が残業の場合 -->
                    <template v-if="recordAndApply.lateOverTime">
                      <!-- 残業した本人か、早退の申請が起票済の場合、申請書画面へのリンクを作成する -->
                      <RouterLink
                        v-if="(recordAndApply.lateOverApply || recordAndApply.record.userAccount === store.userAccount) && recordAndApply.lateOverRouterLink"
                        :to="recordAndApply.lateOverRouterLink">
                        {{ recordAndApply.lateOverApplyDescription }}
                      </RouterLink>
                      <!-- それ以外の場合(残業した本人ではなく、かつ申請書も未起票の場合)単に残業時間を表示する -->
                      <template v-else>
                        {{ recordAndApply.lateOverApplyDescription }}
                      </template>
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

.record-table {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}
</style>