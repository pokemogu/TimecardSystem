<script setup lang="ts">
import { ref, onMounted } from 'vue';
import FileSaver from 'file-saver';
import { stringify, parse } from 'csv/browser/esm/sync';

import * as backendAccess from '@/BackendAccess';
import { useSessionStore } from '@/stores/session';
import type * as apiif from 'shared/APIInterfaces';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  bulkUsers: apiif.UserInfoRequestDataWithPassword[]
}>();

const emits = defineEmits<{
  (event: 'submit'): void,
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:bulkUsers', value: apiif.UserInfoRequestDataWithPassword[]): void,
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

onMounted(async () => {
});

function onSaveCsv() {
  const csvSample = stringify([{
    'ID': 'USR00000', '名前': '山田 太郎', 'パスワード': 'P@ssw0rd', 'フリガナ': 'ヤマダ タロウ',
    'メール': 'usr00000@sample.co.jp', '権限': 'XX社員', '部門': 'XXX事業所', '部署': 'XXX部',
    '勤務体系1': 'XXX事業所社員', '勤務体系2': '', '勤務体系3': ''
  }], { bom: true, header: true });
  const blob = new Blob([csvSample], { type: 'text/csv;charset=utf-8' });
  FileSaver.saveAs(blob, 'bulk_add_users.csv');
}

const errorMessage = ref('');
const bulkUserData = ref<apiif.UserInfoRequestDataWithPassword[]>([]);

async function loadBlobToString(blob: Blob) {
  return await new Promise<string>(function (resolve, reject) {
    const fileReader = new FileReader();
    fileReader.onload = function () {
      if (typeof this.result === 'string') {
        resolve(this.result);
      }
      else {
        reject(new Error('ファイルの読み込みに失敗しました。ファイルがテキストデータではありません。'));
      }
    };
    fileReader.onerror = function () {
      reject(new Error('ファイルの読み込みでエラーが発生しました。'));
    };
    fileReader.onabort = function () {
      reject(new Error('ファイルの読み込みが中断しました。'));
    };
    fileReader.readAsText(blob);
  });
}

function checkData(data: apiif.UserInfoRequestDataWithPassword[]) {
  for (const info of data) {
    if (!info.account.match(/^[\w\-\.]+$/)) {
      errorMessage.value = `IDに半角英数字以外が含まれています: ${info.account}`;
      return false;
    }
    if (info.phonetic) {
      if (!info.phonetic.match(/^[ァ-ヶ０-９0-9ー　 ]+$/)) {
        errorMessage.value = `フリガナに全角カナ以外が含まれています: ${info.phonetic}`;
        return false;
      }
    }
  }

  errorMessage.value = '';
  return true;
}

async function onChangeCsv(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {

    try {
      const result = await loadBlobToString(target.files[0]);
      const csvResult = <apiif.UserInfoRequestDataWithPassword[]>parse(result, {
        columns: function (header: string[]) {
          const headerMap: Record<string, string> = {
            'ID': 'account', '名前': 'name', 'パスワード': 'password', 'フリガナ': 'phonetic',
            'メール': 'email', '権限': 'privilegeName', '部門': 'department', '部署': 'section',
            '勤務体系1': 'defaultWorkPatternName', '勤務体系2': 'optional1WorkPatternName', '勤務体系3': 'optional2WorkPatternName'
          };
          return header.map(column => headerMap[column]);
        }
      });

      if (checkData(csvResult)) {
        bulkUserData.value.push(...csvResult);
      }
    }
    catch (error) {
      console.error(error);
      alert(error);
    }

  }
}

function onSubmit() {
  emits('update:bulkUsers', bulkUserData.value);
  emits('update:isOpened', false);
  emits('submit');
}

</script>

<template>
  <div class="overlay">
    <div class="modal-dialog modal-lg vue-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">従業員ID一括追加</h5>
          <button type="button" class="btn-close" v-on:click="onClose"></button>
        </div>
        <div class="modal-body">
          <p>1. 一括追加する従業員情報を記載するCSVファイル(.csv)をダウンロードしてください。</p>
          <button type="button" class="btn btn-primary" v-on:click="onSaveCsv">ダウンロード</button>
          <ul>
            <li>CSVファイルの1行目の見出しは修正や削除はしないでください。</li>
            <li>CSVファイルの2行目以降に追加したい従業員情報を1行ずつ追加してください。</li>
            <li>既に作成済のIDを記載するとその従業員情報が上書きされます。</li>
            <li>設定されていない権限や勤務体系を記載するとエラーになります。</li>
            <li>権限や勤務体系は完全に一致しないとエラーになります。半角文字と全角文字の間違いやスペースの有無に注意してください。</li>
          </ul>
          <p>2. 一括追加する従業員情報を記載して保存したCSVファイル(.csv)を選択してください。</p>
          <input class="form-control" type="file" accept=".csv" id="formFile" v-on:change="onChangeCsv">
          <p>3. 追加ボタンを押してください。</p>
        </div>
        <div class="modal-footer">
          <div v-if="errorMessage !== ''" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
          <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
          <button type="button" class="btn btn-primary" v-on:click="onSubmit"
            :disabled="(bulkUserData.length < 1) || errorMessage !== ''">追加</button>
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