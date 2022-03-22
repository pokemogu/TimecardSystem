<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { useSessionStore } from '../stores/session';

import Header from '@/components/Header.vue';

const router = useRouter();
const route = useRoute();
const store = useSessionStore();

const alertMessage = ref<string | null>(null);
const userId = ref('');
const userPassword = ref('');
const formFilled = computed(() => (userId.value !== '' && userPassword.value !== ''));

const redirectedStatus = route.query.status ? route.query.status as string : '';
if (redirectedStatus === 'forcedLogout') {
  alertMessage.value = 'セッションが無効となり強制ログアウトしました';
}

function onLogin(event: Event): void {

  store.login(userId.value, userPassword.value)
    .then((success) => {
      if (success) {
        router.push({ name: 'dashboard' });
      }
      else {
        alertMessage.value = 'IDかPASSが間違っています';
        userPassword.value = '';
      }
    })
    .catch(() => {
      alertMessage.value = 'システムエラーが発生しました';
      userPassword.value = '';
    });
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="false"
          titleName="ログイン画面"
          customButton1="QR打刻画面"
          v-on:customButton1="router.push({ name: 'record' })"
        ></Header>
      </div>
    </div>
    <div class="row justify-content-center">
      <div
        v-show="alertMessage"
        class="col-8 alert alert-danger alert-dismissible fade show"
        role="alert"
      >
        {{ alertMessage }}
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="alertMessage = null"
        ></button>
      </div>
    </div>

    <form @submit.prevent="onLogin">
      <div class="row">
        <div class="shadow-none p-3 rounded">
          <h3 class="text-center">IDとPASSを入力してください</h3>
        </div>
      </div>
      <div class="row mb-3 justify-content-center">
        <div class="col-2">
          <label for="user-id" class="form-label">ID</label>
        </div>
        <div class="col-10">
          <input v-model="userId" type="text" class="form-control" id="user-id" />
        </div>
      </div>
      <div class="row mb-3 justify-content-center">
        <div class="col-2">
          <label for="user-password" class="form-label">PASS</label>
        </div>
        <div class="col-10">
          <input v-model="userPassword" type="password" class="form-control" id="user-password" />
        </div>
      </div>
      <div class="row mb-3 justify-content-center">
        <div class="col-4">
          <!-- <button type="button" class="btn btn-primary btn-lg" @click="handleRecord">打刻画面</button> -->
          <!-- <RouterLink to="/record/byqrcode" class="btn btn-warning btn-lg" role="button">打刻画面</RouterLink> -->
        </div>
        <div class="col-4">
          <button v-bind:disabled="!formFilled" type="submit" class="btn btn-warning btn-lg">ログイン</button>
        </div>
      </div>
    </form>
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
</style>