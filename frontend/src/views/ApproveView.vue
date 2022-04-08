<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import LayoutEditButtonView from '@/components/TableLayoutEditButton.vue'

import * as backendAccess from '@/BackendAccess';
import Cookies from 'js-cookie';

const router = useRouter();
const route = useRoute();
const store = useSessionStore();

const selectedAccount = ref('');

const TAB_NAME = {
  UNAPPROVED: 'UNAPPROVED',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  ALL: 'ALL'
} as const;
type TAB_NAME = typeof TAB_NAME[keyof typeof TAB_NAME];
const selectedTab = ref<TAB_NAME>(TAB_NAME.UNAPPROVED);

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
onMounted(() => {
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

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="承認一覧画面"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push({ name: 'dashboard' })"
        ></Header>
      </div>
    </div>

    <div class="row m-1">
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="export">エクスポート</button>
      </div>
      <div class="d-grid gap-2 col-3">
        <template v-if="isMounted">
          <LayoutEditButtonView
            :columnNames="columnNames"
            v-model:layouts="layouts"
            v-model:selectedLayout="selectedLayout"
            :defaultLayout="defaultLayout"
            v-on:submit="onLayoutSubmit"
          ></LayoutEditButtonView>
        </template>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <button
              :class="'nav-link' + ((selectedTab === TAB_NAME.UNAPPROVED) ? ' active' : '')"
              v-on:click="selectedTab = TAB_NAME.UNAPPROVED"
            >未承認</button>
          </li>
          <li class="nav-item">
            <button
              :class="'nav-link' + ((selectedTab === TAB_NAME.REJECTED) ? ' active' : '')"
              v-on:click="selectedTab = TAB_NAME.REJECTED"
            >否認済</button>
          </li>
          <li class="nav-item">
            <button
              :class="'nav-link' + ((selectedTab === TAB_NAME.APPROVED) ? ' active' : '')"
              v-on:click="selectedTab = TAB_NAME.APPROVED"
            >承認済</button>
          </li>
          <li class="nav-item">
            <button
              :class="'nav-link' + ((selectedTab === TAB_NAME.ALL) ? ' active' : '')"
              v-on:click="selectedTab = TAB_NAME.ALL"
            >全て</button>
          </li>
        </ul>
      </div>
    </div>
    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">
                <input class="form-check-input" type="checkbox" id="checkboxall" value />
              </th>
              <th scope="col">申請種類</th>
              <th scope="col">申請日</th>
              <th scope="col">申請者</th>
              <th scope="col">申請期間</th>
              <th scope="col">承認1</th>
              <th scope="col">承認2</th>
              <th scope="col">承認3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <input class="form-check-input" type="checkbox" id="checkbox1" value />
              </th>
              <td>Mark</td>
              <td>Otto</td>
              <td>@mdo</td>
            </tr>
            <tr>
              <th scope="row">
                <input class="form-check-input" type="checkbox" id="checkbox2" value />
              </th>
              <td>Jacob</td>
              <td>Thornton</td>
              <td>@fat</td>
            </tr>
            <tr>
              <th scope="row">
                <input class="form-check-input" type="checkbox" id="checkbox3" value />
              </th>
              <td colspan="2">Larry the Bird</td>
              <td>@twitter</td>
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
} /* Adding !important forces the browser to overwrite the default style applied by Bootstrap */

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