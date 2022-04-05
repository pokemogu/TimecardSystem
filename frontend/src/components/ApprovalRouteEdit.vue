<script setup lang="ts">

import { ref } from 'vue';
import UserSelect from '@/components/UserSelect.vue';
import type * as apiif from 'shared/APIInterfaces';

const props = defineProps<{
  isOpened: boolean,
  route: apiif.ApprovalRouteResposeData
}>();

const routeInfo = ref(props.route);
const isUserSelectOpened = ref(false);
const selectedUserId = ref(0);
const selectedUserAccount = ref('');
const selectedUserName = ref('');
const selectedUserIndex = ref(0);

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:route', value: apiif.ApprovalRouteResposeData): void,
  (event: 'submit'): void,
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

function onSubmit(event: Event) {
  emits('update:route', routeInfo.value);
  emits('update:isOpened', false);
  emits('submit');
}

function onUserSelectSubmit() {
  console.log('selectedUserId = ' + selectedUserId.value)
  switch (selectedUserIndex.value) {
    case 0:
      routeInfo.value.approvalLevel1MainUserId = selectedUserId.value;
      routeInfo.value.approvalLevel1MainUserAccount = selectedUserAccount.value;
      routeInfo.value.approvalLevel1MainUserName = selectedUserName.value;
      break;
    case 1:
      routeInfo.value.approvalLevel1SubUserId = selectedUserId.value;
      routeInfo.value.approvalLevel1SubUserAccount = selectedUserAccount.value;
      routeInfo.value.approvalLevel1SubUserName = selectedUserName.value;
      break;
    case 2:
      routeInfo.value.approvalLevel2MainUserId = selectedUserId.value;
      routeInfo.value.approvalLevel2MainUserAccount = selectedUserAccount.value;
      routeInfo.value.approvalLevel2MainUserName = selectedUserName.value;
      break;
    case 3:
      routeInfo.value.approvalLevel2SubUserId = selectedUserId.value;
      routeInfo.value.approvalLevel2SubUserAccount = selectedUserAccount.value;
      routeInfo.value.approvalLevel2SubUserName = selectedUserName.value;
      break;
    case 4:
      routeInfo.value.approvalLevel3MainUserId = selectedUserId.value;
      routeInfo.value.approvalLevel3MainUserAccount = selectedUserAccount.value;
      routeInfo.value.approvalLevel3MainUserName = selectedUserName.value;
      break;
    case 5:
      routeInfo.value.approvalLevel3SubUserId = selectedUserId.value;
      routeInfo.value.approvalLevel3SubUserAccount = selectedUserAccount.value;
      routeInfo.value.approvalLevel3SubUserName = selectedUserName.value;
      break;
    case 6:
      routeInfo.value.approvalDecisionUserId = selectedUserId.value;
      routeInfo.value.approvalDecisionUserAccount = selectedUserAccount.value;
      routeInfo.value.approvalDecisionUserName = selectedUserName.value;
      break;
  }
}

function isAllFilled() {
  if (routeInfo.value.name === '') {
    return false;
  }

  if (routeInfo.value.approvalLevel1MainUserAccount !== '') {
    return true;
  }
  if (routeInfo.value.approvalLevel1SubUserAccount !== '') {
    return true;
  }
  if (routeInfo.value.approvalLevel2MainUserAccount !== '') {
    return true;
  }
  if (routeInfo.value.approvalLevel2SubUserAccount !== '') {
    return true;
  }
  if (routeInfo.value.approvalLevel3MainUserAccount !== '') {
    return true;
  }
  if (routeInfo.value.approvalLevel3SubUserAccount !== '') {
    return true;
  }
  if (routeInfo.value.approvalDecisionUserAccount !== '') {
    return true;
  }

  return false;
}

</script>

<template>
  <div class="overlay" id="approval-route-root">
    <div class="modal-dialog modal-xl vue-modal">
      <Teleport to="#approval-route-root" v-if="isUserSelectOpened">
        <UserSelect
          v-model:id="selectedUserId"
          v-model:account="selectedUserAccount"
          v-model:name="selectedUserName"
          v-model:isOpened="isUserSelectOpened"
          v-on:submit="onUserSelectSubmit"
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
            <input
              type="text"
              class="form-control"
              id="route-name"
              v-model="routeInfo.name"
              required
            />
          </div>
          <div class="row">
            <div class="col-3">
              <div class="row p-1">
                <div class="col-12">
                  <label for="user1-1" class="form-label">承認者1(主)</label>
                  <div class="input-group mb-3">
                    <input
                      type="input"
                      class="form-control"
                      id="user1-1"
                      v-model="routeInfo.approvalLevel1MainUserAccount"
                      placeholder="社員ID"
                      disabled
                      readonly
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="routeInfo.approvalLevel1MainUserId = undefined; routeInfo.approvalLevel1MainUserAccount = ''; routeInfo.approvalLevel1MainUserName = ''"
                    >&times;</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="selectedUserIndex = 0; isUserSelectOpened = true"
                    >検索</button>
                  </div>
                  <input
                    class="form-control"
                    type="text"
                    v-model="routeInfo.approvalLevel1MainUserName"
                    placeholder="社員名"
                    disabled
                    readonly
                  />
                </div>
                <div class="col-12">
                  <label for="user1-1" class="form-label">承認者1(副)</label>
                  <div class="input-group mb-3">
                    <input
                      type="input"
                      class="form-control"
                      id="user1-1"
                      v-model="routeInfo.approvalLevel1SubUserAccount"
                      placeholder="社員ID"
                      disabled
                      readonly
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="routeInfo.approvalLevel1SubUserId = undefined; routeInfo.approvalLevel1SubUserAccount = ''; routeInfo.approvalLevel1SubUserName = ''"
                    >&times;</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="selectedUserIndex = 1; isUserSelectOpened = true"
                    >検索</button>
                  </div>
                  <input
                    class="form-control"
                    type="text"
                    v-model="routeInfo.approvalLevel1SubUserName"
                    placeholder="社員名"
                    disabled
                    readonly
                  />
                </div>
              </div>
            </div>
            <div class="col-3">
              <div class="row p-1">
                <div class="col-12">
                  <label for="user1-1" class="form-label">承認者2(主)</label>
                  <div class="input-group mb-3">
                    <input
                      type="input"
                      class="form-control"
                      id="user1-1"
                      v-model="routeInfo.approvalLevel2MainUserAccount"
                      placeholder="社員ID"
                      disabled
                      readonly
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="routeInfo.approvalLevel2MainUserId = undefined; routeInfo.approvalLevel2MainUserAccount = ''; routeInfo.approvalLevel2MainUserName = ''"
                    >&times;</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="selectedUserIndex = 2; isUserSelectOpened = true"
                    >検索</button>
                  </div>
                  <input
                    class="form-control"
                    type="text"
                    v-model="routeInfo.approvalLevel2MainUserName"
                    placeholder="社員名"
                    disabled
                    readonly
                  />
                </div>
                <div class="col-12">
                  <label for="user1-1" class="form-label">承認者2(副)</label>
                  <div class="input-group mb-3">
                    <input
                      type="input"
                      class="form-control"
                      id="user1-1"
                      v-model="routeInfo.approvalLevel2SubUserAccount"
                      placeholder="社員ID"
                      disabled
                      readonly
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="routeInfo.approvalLevel2SubUserId = undefined; routeInfo.approvalLevel2SubUserAccount = ''; routeInfo.approvalLevel2SubUserName = ''"
                    >&times;</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="selectedUserIndex = 3; isUserSelectOpened = true"
                    >検索</button>
                  </div>
                  <input
                    class="form-control"
                    type="text"
                    v-model="routeInfo.approvalLevel2SubUserName"
                    placeholder="社員名"
                    disabled
                    readonly
                  />
                </div>
              </div>
            </div>
            <div class="col-3">
              <div class="row p-1">
                <div class="col-12">
                  <label for="user1-1" class="form-label">承認者3(主)</label>
                  <div class="input-group mb-3">
                    <input
                      type="input"
                      class="form-control"
                      id="user1-1"
                      v-model="routeInfo.approvalLevel3MainUserAccount"
                      placeholder="社員ID"
                      disabled
                      readonly
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="routeInfo.approvalLevel3MainUserId = undefined; routeInfo.approvalLevel3MainUserAccount = ''; routeInfo.approvalLevel3MainUserName = ''"
                    >&times;</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="selectedUserIndex = 4; isUserSelectOpened = true"
                    >検索</button>
                  </div>
                  <input
                    class="form-control"
                    type="text"
                    v-model="routeInfo.approvalLevel3MainUserName"
                    placeholder="社員名"
                    disabled
                    readonly
                  />
                </div>
                <div class="col-12">
                  <label for="user1-1" class="form-label">承認者3(副)</label>
                  <div class="input-group mb-3">
                    <input
                      type="input"
                      class="form-control"
                      id="user1-1"
                      v-model="routeInfo.approvalLevel3SubUserAccount"
                      placeholder="社員ID"
                      disabled
                      readonly
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="routeInfo.approvalLevel3SubUserId = undefined; routeInfo.approvalLevel3SubUserAccount = ''; routeInfo.approvalLevel3SubUserName = ''"
                    >&times;</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="selectedUserIndex = 5; isUserSelectOpened = true"
                    >検索</button>
                  </div>
                  <input
                    class="form-control"
                    type="text"
                    v-model="routeInfo.approvalLevel3SubUserName"
                    placeholder="社員名"
                    disabled
                    readonly
                  />
                </div>
              </div>
            </div>
            <div class="col-3">
              <div class="row p-1">
                <div class="col-12">
                  <label for="user1-1" class="form-label">決裁者</label>
                  <div class="input-group mb-3">
                    <input
                      type="input"
                      class="form-control"
                      id="user1-1"
                      v-model="routeInfo.approvalDecisionUserAccount"
                      placeholder="社員ID"
                      disabled
                      readonly
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="routeInfo.approvalDecisionUserId = undefined; routeInfo.approvalDecisionUserAccount = ''; routeInfo.approvalDecisionUserName = ''"
                    >&times;</button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="selectedUserIndex = 6; isUserSelectOpened = true"
                    >検索</button>
                  </div>
                  <input
                    class="form-control"
                    type="text"
                    v-model="routeInfo.approvalDecisionUserName"
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