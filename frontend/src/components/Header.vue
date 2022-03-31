<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import PasswordChange from './PasswordChange.vue';

interface HeaderProps {
  isAuthorized: boolean,
  titleName: string,
  customMessage?: string,
  deviceName?: string,
  userName?: string,
  customButton1?: string,
  customButton2?: string,
  customButton3?: string
}
const props = defineProps<HeaderProps>();

const emits = defineEmits<{
  (event: 'customButton1'): void,
  (event: 'customButton2'): void,
  (event: 'customButton3'): void
}>();

const isPasswordChangeOpened = ref(false);

</script>

<template>
  <Teleport to="body" v-if="isPasswordChangeOpened">
    <PasswordChange v-model:isOpened="isPasswordChangeOpened"></PasswordChange>
  </Teleport>

  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <span class="navbar-text">{{ props.titleName }}</span>
      <div class="collapse navbar-collapse justify-content-end">
        <ul class="navbar-nav">
          <li v-if="props.customMessage" class="nav-item">
            <span class="navbar-text">{{ props.customMessage }}</span>
          </li>
          <li v-if="props.deviceName" class="nav-item">
            <span class="navbar-text">{{ props.deviceName }}</span>
          </li>
          <li v-if="props.userName" class="nav-item">
            <span class="navbar-text">{{ props.userName }}</span>
          </li>
        </ul>
        <!--
        <span v-if="props.customMessage" class="navbar-text">{{ props.customMessage }}</span>
        <span v-if="props.deviceName" class="navbar-text">{{ props.deviceName }}</span>
        <span v-if="props.userName" class="navbar-text">{{ props.userName }}</span>
        -->
      </div>
      <button
        v-if="props.customButton1"
        v-on:click="$emit('customButton1')"
        class="ms-2 btn btn-warning btn-sm"
        role="button"
      >{{ props.customButton1 }}</button>
      <button
        v-if="props.customButton2"
        v-on:click="$emit('customButton2')"
        class="ms-2 btn btn-warning btn-sm"
        role="button"
      >{{ props.customButton2 }}</button>
      <button
        v-if="props.customButton3"
        v-on:click="$emit('customButton3')"
        class="ms-2 btn btn-warning btn-sm"
        role="button"
      >{{ props.customButton3 }}</button>
      <button
        v-if="props.isAuthorized"
        v-on:click="isPasswordChangeOpened = true"
        class="ms-2 btn btn-warning btn-sm"
        role="button"
      >パスワード変更</button>
      <RouterLink
        v-if="props.isAuthorized"
        :to="{ name: 'logout' }"
        class="ms-2 btn btn-warning btn-sm"
        role="button"
      >ログアウト</RouterLink>
      <!--
      <RouterLink
        v-if="!props.isAuthorized"
        to="/"
        class="ms-2 btn btn-warning btn-sm"
        role="button"
      >ホーム画面</RouterLink>
      -->
    </div>
  </nav>
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