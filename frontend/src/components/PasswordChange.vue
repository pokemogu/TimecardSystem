<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as backendAccess from '@/BackendAccess';
import { useSessionStore } from '@/stores/session';

const store = useSessionStore();

const oldPassword = ref('');
const newPassword = ref('');
const newPasswordConfirm = ref('');

const props = defineProps<{
  isOpened: boolean,
  confirmOldPasword: boolean,
  account?: string
}>();

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'submit'): void,
}>();

function onClose() {
  emits('update:isOpened', false);
}

onMounted(() => {
  if (props.confirmOldPasword === false && props.account === undefined) {
    alert('パスワード変更には現在のパスワードの入力が必要です。');
    onClose();
  }
});

async function onSubmit() {
  if (newPassword.value !== newPasswordConfirm.value) {
    alert('「変更後のパスワード」と「変更後のパスワード(確認)」が一致しません。');
    return;
  }

  try {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      if (props.confirmOldPasword === true) {
        await access.changePassword({ oldPassword: oldPassword.value, newPassword: newPassword.value });
        alert('パスワードの変更が完了しました。');
      }
      else if (props.account && store.privilege?.registerUser === true) {
        await access.changePassword({ account: props.account, newPassword: newPassword.value });
        alert('パスワードの設定が完了しました。');
      }
      else {
        alert('パスワードの変更を行なう権限がありません。');
      }
    }
  }
  catch (error) {
    const err = error as Error;
    if (err.name === '401' && err.message === 'password verification failed.') {
      alert('現在のパスワードが間違っています。');
    }
    else {
      alert(error);
    }
    return;
  }

  emits('update:isOpened', false);
  emits('submit');
}

</script>

<template>
  <div class="overlay">
    <div class="modal-dialog vue-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">パスワード変更</h5>
          <button type="button" class="btn-close" v-on:click="onClose"></button>
        </div>
        <div class="modal-body">
          <template v-if="props.confirmOldPasword === true">
            <p>現在のパスワードと変更後のパスワードを入力してください。</p>
            <div class="row">
              <label for="oldPassword" class="col-6 col-form-label">現在のパスワード</label>
              <div class="col-6">
                <input type="password" class="form-control p-2" id="oldPassword" v-model="oldPassword" required />
              </div>
            </div>
          </template>
          <p v-else>パスワードを入力してください。</p>
          <div class="row">
            <label for="newPassword" class="col-6 col-form-label"><span
                v-if="props.confirmOldPasword === true">変更後の</span>パスワード</label>
            <div class="col-6">
              <input type="password" class="form-control p-2" id="newPassword" v-model="newPassword" required />
            </div>
          </div>
          <div class="row">
            <label for="newPasswordConfirm" class="col-6 col-form-label"><span
                v-if="props.confirmOldPasword === true">変更後の</span>パスワード(確認)</label>
            <div class="col-6">
              <input type="password" class="form-control p-2" id="newPasswordConfirm" v-model="newPasswordConfirm"
                required />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
          <button type="button" class="btn btn-primary"
            v-bind:disabled="oldPassword === '' || newPassword === '' || newPasswordConfirm === ''"
            v-on:click="onSubmit">変更</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  z-index: 998;
  top: 0;
  height: 100%;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.vue-modal {
  position: fixed;
  z-index: 999;
  margin: 0 auto;
  top: 10%;
  bottom: 10%;
  left: 20%;
  right: 20%;
}
</style>