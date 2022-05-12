<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
import * as backendAccess from '@/BackendAccess';

import CustomApplyEdit from '@/components/CustomApplyEdit.vue';

const router = useRouter();
const store = useSessionStore();

const isModalOpened = ref(false);
const selectedCustomApplyType = ref<apiif.ApplyTypeResponseData>({ name: '', isSystemType: false, description: '' });
const selectedApplyPermissionNames = ref<string[]>([]);
const customApplyTypes = ref<apiif.ApplyTypeResponseData[]>([]);
const checks = ref<Record<string, boolean>>({});

const limit = ref(10);
const offset = ref(0);

async function updateTable() {

  try {
    const infos = await backendAccess.getApplyTypes();
    if (infos) {
      customApplyTypes.value.splice(0);
      Array.prototype.push.apply(customApplyTypes.value, infos.filter(info => info.isSystemType === false));
    }

  }
  catch (error) {
    console.error(error);
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

async function onCustomApplyTypeClick(name?: string) {
  if (name) {
    const applyType = customApplyTypes.value.find(applyType => applyType.name === name);
    if (applyType) {
      selectedCustomApplyType.value = applyType;
    }
  }
  else {
    selectedCustomApplyType.value.id = undefined;
    selectedCustomApplyType.value.name = '';
    selectedCustomApplyType.value.description = '';
    selectedCustomApplyType.value.isSystemType = false;
  }
  isModalOpened.value = true;
}

async function onApplyTypeDelete() {
  if (!confirm('チェックされた申請種類を削除しますか? (※1回でもこの申請種類で申請がされている場合は削除できず、サーバーエラーが発生します)')) {
    return;
  }
  try {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      for (const applyType of customApplyTypes.value) {
        if (checks.value[applyType.name]) {
          await access.deleteApplyType(applyType.name);
        }
      }
    }
  }
  catch (error) {
    console.error(error);
    alert(error);
  }

  // チェックをすべてクリアする
  for (const key in checks.value) {
    checks.value[key] = false;
  }

  await updateTable();
}

async function onSubmit() {
  try {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);

      console.log(selectedCustomApplyType.value.id)
      // 新規申請種類の場合は追加する
      if (!selectedCustomApplyType.value.id) {
        selectedCustomApplyType.value.isSystemType = false;
        selectedCustomApplyType.value.id = await access.addApplyType(selectedCustomApplyType.value);
      } else {
        await access.updateApplyType(selectedCustomApplyType.value);
      }

      // この申請種類の権限を設定する
      const privileges = await access.getPrivileges();
      if (privileges) {
        for (const privilege of privileges) {
          const applyPrivilege = privilege.applyPrivileges?.find(applyPrivilege => applyPrivilege.applyTypeId === selectedCustomApplyType.value.id);

          // 権限追加
          if (selectedApplyPermissionNames.value.some(name => name === privilege.name)) {
            if (applyPrivilege) { // 既に申請権限情報がある場合はそれを修正する
              applyPrivilege.permitted = true;
            }
            else { // 申請権限情報がない場合は追加する
              privilege.applyPrivileges?.push({
                applyTypeId: selectedCustomApplyType.value.id ?? 0,
                applyTypeName: selectedCustomApplyType.value.name,
                permitted: true
              });
            }
          }
          // 権限削除
          else {
            if (applyPrivilege) { // 既に権限情報がある場合はそれを修正する
              applyPrivilege.permitted = false;
            }
          }
          await access.updatePrivilege(privilege);
        }
      }
    }
  }
  catch (error) {
    console.error(error);
    alert(error);
  }
  await updateTable();
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="その他申請種類設定" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <Teleport to="body" v-if="isModalOpened">
      <CustomApplyEdit v-model:isOpened="isModalOpened" v-model:applyType="selectedCustomApplyType"
        v-model:applyPermissionNames="selectedApplyPermissionNames" v-on:submit="onSubmit"></CustomApplyEdit>
    </Teleport>

    <div class="row justify-content-start p-2">
      <div class="d-grid gap-2 col-3">
        <button type="button" class="btn btn-primary" id="new-route"
          v-on:click="onCustomApplyTypeClick()">その他申請種類の追加</button>
      </div>
      <div class="d-grid gap-2 col-4">
        <button type="button" class="btn btn-primary" id="export"
          v-bind:disabled="Object.values(checks).every(check => check === false)"
          v-on:click="onApplyTypeDelete">チェックした申請種類を削除</button>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">申請種類</th>
              <!--<th scope="col">休日名</th>-->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(applyType, index) in customApplyTypes">
              <th scope="row">
                <input class="form-check-input" type="checkbox" :id="'checkbox' + index"
                  v-model="checks[applyType.name]" />
              </th>
              <td>
                <button type="button" class="btn btn-link" v-on:click="onCustomApplyTypeClick(applyType.name)">{{
                    applyType.description
                }}</button>
              </td>
            </tr>
          </tbody>
          <!--
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
                    <li
                      class="page-item"
                      v-bind:class="{ disabled: customApplyTypes.length <= limit }"
                    >
                      <button class="page-link" v-on:click="onPageForward">
                        <span>&raquo;</span>
                      </button>
                    </li>
                  </ul>
                </nav>
              </td>
            </tr>
          </tfoot>
          -->
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