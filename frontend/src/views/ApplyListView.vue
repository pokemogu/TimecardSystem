<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Cookies from 'js-cookie';
import { useLoading } from 'vue-loading-overlay'

import Header from '@/components/Header.vue';
import LayoutEditButtonView from '@/components/TableLayoutEditButton.vue'

import type * as apiif from 'shared/APIInterfaces';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const route = useRoute();
const store = useSessionStore();

const TAB_NAME = {
  UNAPPROVED: 'UNAPPROVED',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  ALL: 'ALL'
} as const;
type TAB_NAME = typeof TAB_NAME[keyof typeof TAB_NAME];
const lastTab = store.lastApplyListViewTab;
const selectedTab = ref<TAB_NAME>(lastTab ? lastTab as TAB_NAME : TAB_NAME.UNAPPROVED);

switch (route.query.approved as string) {
  case 'unapproved':
    selectedTab.value = TAB_NAME.UNAPPROVED;
    break;
  case 'rejected':
    selectedTab.value = TAB_NAME.REJECTED;
    break;
  case 'approved':
    selectedTab.value = TAB_NAME.APPROVED;
    break;
}

const columnNames = ref<string[]>([
  '申請種類', '申請者', '申請日時', '対象日', '開始日時', '終了日時', '理由', '連絡先', '承認ルート名', '承認1', '承認2', '承認3', '決裁'
]);
const defaultLayout = ref<{ name: string, columnIndices: number[] }>({
  name: '標準レイアウト',
  columnIndices: [
    columnNames.value.findIndex(column => column === '申請種類'),
    columnNames.value.findIndex(column => column === '申請者'),
    columnNames.value.findIndex(column => column === '申請日時'),
    columnNames.value.findIndex(column => column === '対象日'),
    columnNames.value.findIndex(column => column === '承認1'),
    columnNames.value.findIndex(column => column === '承認2'),
    columnNames.value.findIndex(column => column === '承認3'),
    columnNames.value.findIndex(column => column === '決裁')
  ]
});
const layouts = ref<{ name: string, columnIndices: number[] }[]>([]);
const selectedLayout = ref<{ name: string, columnIndices: number[] }>(defaultLayout.value);
const isMounted = ref(false);

const applies = ref<apiif.ApplyResponseData[]>([]);
const limit = ref(10);
const offset = ref(0);

const $loading = useLoading();
async function updateList() {
  const params: apiif.ApplyRequestQuery = { limit: limit.value + 1, offset: offset.value };
  switch (selectedTab.value) {
    case TAB_NAME.UNAPPROVED:
      if (route.name === 'approval-list') {
        params.approvingUserAccount = store.userAccount;
      }
      else if (route.name === 'apply-list') {
        params.targetedUserAccounts = [store.userAccount];
      }
      params.isApproved = null;
      break;
    case TAB_NAME.REJECTED:
      if (route.name === 'approval-list') {
        params.approvedUserAccount = store.userAccount;
      }
      else if (route.name === 'apply-list') {
        params.targetedUserAccounts = [store.userAccount];
      }
      params.isApproved = false;
      break;
    case TAB_NAME.APPROVED:
      if (route.name === 'approval-list') {
        params.approvedUserAccount = store.userAccount;
        params.isApproved = [true, null];
      }
      else if (route.name === 'apply-list') {
        params.targetedUserAccounts = [store.userAccount];
        params.isApproved = true;
      }
      break;
    //case 'ALL':
    //  break;
  }

  const loader = $loading.show({ opacity: 0 });
  try {
    const access = await store.getTokenAccess();
    const appliesInfo = await access.getApplies(params);
    if (appliesInfo) {
      applies.value = [...appliesInfo];
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
  const savedLayoutJson = Cookies.get('tableLayoutsApproval');
  if (savedLayoutJson) {
    layouts.value = JSON.parse(savedLayoutJson);
  }

  const savedDefaultLayoutName = Cookies.get('selectedTableLayoutNameApproval');
  if (savedDefaultLayoutName) {
    const savedDefaultLayout = layouts.value.find(layout => layout.name === savedDefaultLayoutName);
    if (savedDefaultLayout) {
      selectedLayout.value = savedDefaultLayout;
    }
  }
  await updateList();
  isMounted.value = true;
});

watch(selectedLayout, () => {
  if (selectedLayout.value === defaultLayout.value) {
    Cookies.remove('selectedTableLayoutNameApproval', { path: '' }); // デフォルトレイアウトの場合は設定削除する
  } else {
    Cookies.set('selectedTableLayoutNameApproval', selectedLayout.value.name, { expires: 3650, path: '' });
  }
});

function onLayoutSubmit() {
  Cookies.set('tableLayoutsApproval', JSON.stringify(layouts.value), { expires: 3650, path: '' });
}

async function onTabClick(tabName: TAB_NAME) {
  offset.value = 0;
  selectedTab.value = tabName;
  store.lastApplyListViewTab = tabName;

  await updateList();
}

async function onPageBack() {
  const backTo = offset.value - limit.value;
  offset.value = backTo > 0 ? backTo : 0;
  await updateList();
}

async function onPageForward() {
  const forwardTo = offset.value + limit.value;
  offset.value = forwardTo > 0 ? forwardTo : 0;
  await updateList();
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()"
          :titleName="route.name === 'approval-list' ? '承認一覧画面' : '申請一覧画面'" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <div class="row m-1">
      <!-- レイアウト変更ボタン コメントアウトを消さないこと！！ -->
      <!--
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="export">エクスポート</button>
      </div>
      <div class="d-grid gap-2 col-3">
        <template v-if="isMounted">
          <LayoutEditButtonView :columnNames="columnNames" v-model:layouts="layouts"
            v-model:selectedLayout="selectedLayout" :defaultLayout="defaultLayout" v-on:submit="onLayoutSubmit">
          </LayoutEditButtonView>
        </template>
      </div>
      -->
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <button :class="'nav-link' + ((selectedTab === TAB_NAME.UNAPPROVED) ? ' active' : '')"
              v-on:click="onTabClick(TAB_NAME.UNAPPROVED)">未承認</button>
          </li>
          <li class="nav-item">
            <button :class="'nav-link' + ((selectedTab === TAB_NAME.REJECTED) ? ' active' : '')"
              v-on:click="onTabClick(TAB_NAME.REJECTED)">否認済</button>
          </li>
          <li class="nav-item">
            <button :class="'nav-link' + ((selectedTab === TAB_NAME.APPROVED) ? ' active' : '')"
              v-on:click="onTabClick(TAB_NAME.APPROVED)">承認済</button>
          </li>
          <!--
          <li class="nav-item">
            <button :class="'nav-link' + ((selectedTab === TAB_NAME.ALL) ? ' active' : '')"
              v-on:click="onTabClick(TAB_NAME.ALL)">全て</button>
          </li>
          -->
        </ul>
      </div>
    </div>
    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">
                <!-- <input class="form-check-input" type="checkbox" id="checkboxall" value /> -->
              </th>
              <th scope="col">申請種類</th>
              <th scope="col">申請日</th>
              <th scope="col">申請者</th>
              <th scope="col">申請期間</th>
              <th scope="col">承認1</th>
              <th scope="col">承認2</th>
              <th scope="col">承認3</th>
              <th scope="col">決裁</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(apply, index) in applies.slice(0, limit)">
              <th scope="row">
                <input class="form-check-input" type="checkbox" id="checkbox1" value />
              </th>

              <td>
                <RouterLink :to="`/approve/${apply.id}`">{{ apply.type.description }}</RouterLink>
              </td>
              <td>{{ apply.timestamp.toLocaleDateString() }}</td>
              <td>{{ apply.appliedUser ? apply.appliedUser.name : apply.targetUser.name }}</td>
              <td>{{ apply.dateTimeFrom.toLocaleDateString() }}{{ apply.dateTimeTo ?
                  ` 〜 ${apply.dateTimeTo.toLocaleDateString()}` : ''
              }}</td>
              <td>{{ apply.approvedLevel1User?.name }}</td>
              <td>{{ apply.approvedLevel2User?.name }}</td>
              <td>{{ apply.approvedLevel3User?.name }}</td>
              <td>{{ apply.approvedDecisionUser?.name }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="8">
                <nav>
                  <ul class="pagination">
                    <li class="page-item" v-bind:class="{ disabled: offset <= 0 }">
                      <button class="page-link" v-on:click="onPageBack">
                        <span>&laquo;</span>
                      </button>
                    </li>
                    <li class="page-item" v-bind:class="{ disabled: applies.length <= limit }">
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

/*
.nav-item {
  background: navajowhite !important;
}

.nav-item:active {
  background: navajowhite !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
}

.nav-pills .nav-link:active {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
*/

.nav-tabs .nav-item .nav-link {
  background-color: navajowhite !important;
  /*
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  */
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