<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const store = useSessionStore();

store.logout()
  .then(() => {
    router.push('/');
  });

</script>

<template></template>