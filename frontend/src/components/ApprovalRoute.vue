<script setup lang="ts">

export interface Route {
  name?: string,
  roles?: {
    level: number,
    users: {
      role: string,
      account: string
    }[]
  }[]
};

import { ref, watch, onMounted } from 'vue';

import { useSessionStore } from '@/stores/session';
import * as backendAccess from '@/BackendAccess';

import UserSelect from '@/components/UserSelect.vue';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  route?: Route
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
  (event: 'update:route', value: Route): void
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

const rolesByLevel = ref<{
  level: number,
  names: string[]
}[]>([]);

function onSubmit(event: Event) {
  const route: Route = { name: routeName.value, roles: [] };
  for (let i = 0; i < rolesByLevel.value.length; i++) {
    const users: { role: string, account: string }[] = [];
    for (let j = 0; j < rolesByLevel.value[i].names.length; j++) {
      users.push({ role: rolesByLevel.value[i].names[j], account: inputUserAccounts.value[i][j] });
    }
    if (route.roles) {
      route.roles.push({ level: rolesByLevel.value[i].level, users: users });
    }
  }
  emits('update:route', route);
  emits('update:isOpened', false);
}

try {
  const response = await backendAccess.getApprovalRouteRoles();
  if (response.roles) {

    // 取得した承認役割情報を承認レベルごとにまとめる
    for (const role of response.roles) {
      const index = rolesByLevel.value.findIndex(roleByLevel => roleByLevel.level === role.level);
      if (index >= 0) {
        rolesByLevel.value[index].names.push(role.name);
      }
      else {
        rolesByLevel.value.push({ level: role.level, names: [role.name] });
      }
    }

    // 承認レベルの低い順にソートする
    rolesByLevel.value.sort((first, second) => first.level - second.level);

    // ユーザー名取得の為のアクセストークを取得する
    const token = props.route ? await store.getToken() : undefined;

    for (const role of rolesByLevel.value) {
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
      if (inputUserAccountRow === '') {
        return false;
      }
    }
  }

  return true;
}

</script>

<template>
  <div class="modal-dialog modal-xl vue-modal">
    <Teleport to="body" v-if="isUserSelectOpened">
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
          <div class="col-3" v-for="(level, indexCol) in rolesByLevel">
            <div class="row p-1" v-for="(name, indexRow) in level.names">
              <div class="col-12">
                <label :for="'user' + indexCol + indexRow" class="form-label">{{ name }}</label>
                <div class="input-group mb-3">
                  <input
                    type="text"
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
</template>

<style scoped>
.vue-modal {
  position: fixed;
  z-index: 999;
  margin: 0 auto;
  top: 10%;
  bottom: 10%;
  left: 0%;
  right: 0%;
}
</style>