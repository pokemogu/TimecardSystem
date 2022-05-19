<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import FileSaver from 'file-saver';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';

import { getErrorsFromDB } from '@/ErrorDB';

const router = useRouter();
const store = useSessionStore();

const logText = ref('');

onMounted(async () => {
  const errors = await getErrorsFromDB(store.isLoggedIn() === false); // 打刻端末ログインの場合は打刻エラーを表示する
  for (const error of errors) {
    logText.value += `${error.timestamp.toLocaleString()} [${error.name}]: ${error.message}`;
    if (error.stack) {
      logText.value += error.stack;
    }
    logText.value += '\n\n';
  }
});

async function onCopyToClipboard() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(logText.value);
    alert('クリップボードにコピーされました。');
  }
}

async function onSaveToFile() {
  const blob = new Blob([logText.value], { type: 'text/csv;charset=utf-8' });
  FileSaver.saveAs(blob, 'timecard-client-errors.log');
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="端末エラー履歴" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <div class="row justify-content-start p-2">
      <div class="d-grid gap-2 col-4">
        <button type="button" class="btn btn-primary" id="button-copy"
          v-on:click="onCopyToClipboard">クリップボードにコピー</button>
      </div>
      <div class="d-grid gap-2 col-4">
        <button type="button" class="btn btn-primary" id="button-save" v-on:click="onSaveToFile">ファイルに保存</button>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-12">
        <form>
          <textarea class="form-control form-control-sm" rows="20" v-model="logText" readonly></textarea>
        </form>
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