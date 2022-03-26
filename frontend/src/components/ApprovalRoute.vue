<script setup lang="ts">

import { ref, watch, onMounted } from 'vue';

import { useSessionStore } from '@/stores/session';
import * as backendAccess from '@/BackendAccess';

import UserSelect from '@/components/UserSelect.vue';

import type * as apiif from 'shared/APIInterfaces';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  route?: apiif.ApprovalRouteResposeData
}>();

const routeName = ref(props.route?.name ? props.route.name : '');
const isUserSelectOpened = ref(false);
const selectedUserAccount = ref('');
const selectedUserName = ref('');
const inputUserAccounts = ref<string[][]>([]);
const inputUserNames = ref<string[][]>([]);

const currentRow = ref(0);
const currentCol = ref(0);

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:route', value: apiif.ApprovalRouteResposeData): void,
  (event: 'submit'): void,
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}
const roles = ref<apiif.ApprovalRouteRoleData[]>([]);

function onSubmit(event: Event) {
  const route: apiif.ApprovalRouteResposeData = { name: routeName.value, roles: [] };
  for (let i = 0; i < roles.value.length; i++) {
    const users: { role: string, account: string, name: string }[] = [];
    for (let j = 0; j < roles.value[i].names.length; j++) {
      if (inputUserAccounts.value[i][j] !== '') {
        users.push({ role: roles.value[i].names[j], account: inputUserAccounts.value[i][j], name: inputUserNames.value[i][j] });
      }
    }
    if (route.roles) {
      route.roles.push({ level: roles.value[i].level, users: users });
    }
  }

  if (props.route?.id) {
    route.id = props.route.id;
  }
  emits('update:route', route);
  emits('update:isOpened', false);
  emits('submit');
}

try {
  const result = await backendAccess.getApprovalRouteRoles();
  if (result) {
    roles.value.splice(0);
    Array.prototype.push.apply(roles.value, result);

    // ユーザー名取得の為のアクセストークを取得する
    const token = props.route ? await store.getToken() : undefined;

    for (const role of roles.value) {
      inputUserAccounts.value.push([]);
      inputUserNames.value.push([]);
      for (const roleName of role.names) {

        // ルート設定情報をprop渡しされている場合は適切な項目に入力する
        let account = ''; // 新規追加の場合は空
        if (props.route && props.route.roles) {
          const userRole = props.route.roles.find(userRole => userRole.level === role.level);
          if (userRole) {
            const user = userRole.users.find(user => user.role === roleName);
            if (user) {
              account = user.account;
            }
          }
        }
        inputUserAccounts.value[inputUserAccounts.value.length - 1].push(account);

        let userName = '';
        if (token && account !== '') {
          const access = new backendAccess.TokenAccess(token);
          const info = await access.getUserInfo(account);
          userName = info.name;
        }
        inputUserNames.value[inputUserAccounts.value.length - 1].push(userName);
      }
    }
  }
} catch (error) {
  console.log(error);
}

watch(selectedUserAccount, () => {
  inputUserAccounts.value[currentCol.value][currentRow.value] = selectedUserAccount.value;
  inputUserNames.value[currentCol.value][currentRow.value] = selectedUserName.value;
});

function isAllFilled() {
  if (routeName.value === '') {
    return false;
  }

  for (const inputUserAccountCol of inputUserAccounts.value) {
    for (const inputUserAccountRow of inputUserAccountCol) {
      if (inputUserAccountRow !== '') {
        return true;
      }
    }
  }

  return false;
}

</script>

<template>
  <div class="overlay" id="approval-route-root">
    <div class="modal-dialog modal-xl vue-modal">
      <Teleport to="#approval-route-root" v-if="isUserSelectOpened">
        <UserSelect
          v-model:account="selectedUserAccount"
          v-model:name="selectedUserName"
          v-model:isOpened="isUserSelectOpened"
        ></UserSelect>
      </Teleport>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">申請ルート設定</h5>
          <button type="button" class="btn-close" v-on:click="onClose"></button>
        </div>
        <div class="modal-body">
          <div class="input-group mb-3">
            <span class="input-group-text" id="basic-addon3">ルート名</span>
            <input type="text" class="form-control" id="route-name" v-model="routeName" />
          </div>
          <div class="row">
            <div class="col-3" v-for="(level, indexCol) in roles">
              <div class="row p-1" v-for="(name, indexRow) in level.names">
                <div class="col-12">
                  <label :for="'user' + indexCol + indexRow" class="form-label">{{ name }}</label>
                  <div class="input-group mb-3">
                    <input
                      type="search"
                      class="form-control"
                      :id="'user' + indexCol + indexRow"
                      v-model="inputUserAccounts[indexCol][indexRow]"
                      placeholder="社員ID"
                      disabled
                      readonly
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="inputUserAccounts[indexCol][indexRow] = ''; inputUserNames[indexCol][indexRow] = ''"
                    >&times;</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="isUserSelectOpened = true; currentCol = indexCol; currentRow = indexRow"
                    >検索</button>
                  </div>
                  <input
                    class="form-control"
                    type="text"
                    v-model="inputUserNames[indexCol][indexRow]"
                    placeholder="社員名"
                    disabled
                    readonly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
          <button
            type="button"
            class="btn btn-primary"
            v-bind:disabled="!isAllFilled()"
            v-on:click="onSubmit"
          >設定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  top: 0;
  height: 100%;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.vue-modal {
  position: fixed;
  z-index: 997;
  margin: 0 auto;
  top: 10%;
  bottom: 10%;
  left: 0%;
  right: 0%;
}

input[type="search"] {
  -webkit-appearance: searchfield;
}
input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: searchfield-cancel-button;
}
</style>