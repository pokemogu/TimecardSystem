<script setup lang="ts">
import AppVue from '@/App.vue';
import TheWelcome from '@/components/TheWelcome.vue';
import { RouterLink, useRouter } from 'vue-router';
import { ref, computed, inject } from 'vue';
import type { TimecardSession } from '../timecard-session-interface';

let alertMessage = ref<string | null>(null);
let userId = ref('');
let userPassword = ref('');
const formFilled = computed(() => (userId.value !== '' && userPassword.value !== ''));

const session = inject<TimecardSession>('session');
const router = useRouter();

function onLogin(event: Event): void {
  console.log(`${userId.value} ${userPassword.value}`);
  if (userId.value === 'testuser' && userPassword.value === 'P@ssw0rd') {
    if (session) {
      session.refreshToken = 'DUMMY_TOKEN';
      session.userId = userId.value;
      session.userName = 'テストユーザー';
      console.log('USER LOGIN ACCEPTED');
      router.push({
        path: '/dashboard'
      });
    }
  }
  else {
    alertMessage.value = 'IDかPASSが間違っています';
    userPassword.value = '';
  }
}

function handleRecord(event: Event): void {
  console.log('login!!!!');
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
          <div class="container-fluid">
            <span class="navbar-text">認証</span>
            <div class="collapse navbar-collapse justify-content-end">
              <span class="navbar-text">管理者PC</span>
            </div>
          </div>
        </nav>
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
          <RouterLink to="/record/byqrcode" class="btn btn-warning btn-lg" role="button">打刻画面</RouterLink>
        </div>
        <div class="col-4">
          <button v-bind:disabled="!formFilled" type="submit" class="btn btn-warning btn-lg">管理画面</button>
        </div>
      </div>
    </form>
  </div>
  <!--
<main>
    <TheWelcome />
  </main>
  -->
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